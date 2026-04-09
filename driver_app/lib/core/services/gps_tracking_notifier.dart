import 'dart:async';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../../features/missions/domain/shipment.dart';
import 'gps_queue_service.dart';
import 'route_info_provider.dart';

// ── État GPS ──────────────────────────────────────────────────────────────────

class GpsTrackingState {
  final bool isTracking;
  final Position? lastPosition;
  final List<LatLng> route;
  final String? error;
  final String? activeMissionId;

  const GpsTrackingState({
    this.isTracking = false,
    this.lastPosition,
    this.route = const [],
    this.error,
    this.activeMissionId,
  });

  GpsTrackingState copyWith({
    bool? isTracking,
    Position? lastPosition,
    List<LatLng>? route,
    String? error,
    String? activeMissionId,
  }) => GpsTrackingState(
    isTracking:      isTracking      ?? this.isTracking,
    lastPosition:    lastPosition    ?? this.lastPosition,
    route:           route           ?? this.route,
    error:           error,
    activeMissionId: activeMissionId ?? this.activeMissionId,
  );
}

// ── Foreground Task Handler ───────────────────────────────────────────────────

@pragma('vm:entry-point')
void gpsServiceCallback() {
  FlutterForegroundTask.setTaskHandler(_GpsTaskHandler());
}

class _GpsTaskHandler extends TaskHandler {
  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {}
  @override
  void onRepeatEvent(DateTime timestamp) {}
  @override
  Future<void> onDestroy(DateTime timestamp) async {}
}

// ── Notifier global ───────────────────────────────────────────────────────────

class GpsTrackingNotifier extends Notifier<GpsTrackingState> {
  StreamSubscription<Position>? _posStream;
  Timer?   _sendTimer;
  Shipment? _mission;

  @override
  GpsTrackingState build() => const GpsTrackingState();

  // ── Démarrer ──────────────────────────────────────────────────────────────

  Future<void> startTracking(Shipment mission) async {
    if (state.isTracking && state.activeMissionId == mission.id) return;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      state = state.copyWith(error: 'Permission GPS refusée — tracking impossible');
      return;
    }

    await _stopInternal();
    _mission = mission;

    final result = await FlutterForegroundTask.startService(
      serviceId: 101,
      notificationTitle: 'Mission en cours',
      notificationText:  '${mission.villeDepart} → ${mission.villeArrivee}',
      callback: gpsServiceCallback,
    );

    if (result is! ServiceRequestSuccess) {
      state = state.copyWith(error: 'Impossible de démarrer le service GPS');
      return;
    }

    state = GpsTrackingState(isTracking: true, activeMissionId: mission.id);

    // ── Stream continu → mise à jour visuelle en temps réel ──────────────
    // distanceFilter: 5m → émet uniquement si déplacement réel (évite le bruit GPS)
    _posStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy:       LocationAccuracy.high,
        distanceFilter: 5,
      ),
    ).listen(
      _onPosition,
      onError: (e) => state = state.copyWith(error: 'Erreur GPS : $e'),
    );

    // ── Timer 30s → envoi backend uniquement ─────────────────────────────
    _sendTimer = Timer.periodic(const Duration(seconds: 30), (_) => _sendToQueue());
  }

  // ── Arrêter ───────────────────────────────────────────────────────────────

  Future<void> stopTracking() async {
    await _stopInternal();
    state = const GpsTrackingState();
  }

  Future<void> _stopInternal() async {
    _sendTimer?.cancel();
    _sendTimer = null;
    await _posStream?.cancel();
    _posStream = null;
    _mission = null;
    if (await FlutterForegroundTask.isRunningService) {
      await FlutterForegroundTask.stopService();
    }
  }

  // ── Callback du stream → met à jour l'état visuel ────────────────────────

  void _onPosition(Position pos) {
    final mission = _mission;
    if (mission == null) return;

    final newRoute = [...state.route, LatLng(pos.latitude, pos.longitude)];
    state = GpsTrackingState(
      isTracking:      true,
      lastPosition:    pos,
      route:           newRoute,
      activeMissionId: mission.id,
    );
  }

  // ── Timer 30s → envoie la dernière position connue au backend ─────────────

  Future<void> _sendToQueue() async {
    final mission = _mission;
    final pos     = state.lastPosition;
    if (mission == null || pos == null) return;

    // GPS désactivé sur l'appareil ?
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      FlutterForegroundTask.updateService(
        notificationTitle: '⚠️ GPS désactivé',
        notificationText:  'Activez la localisation pour continuer le tracking',
      );
      state = state.copyWith(error: '⚠️ GPS désactivé — activez la localisation');
      return;
    }

    final speedKmh = pos.speed >= 0 ? pos.speed * 3.6 : 0.0;

    // Mise à jour notification
    final routeInfo = ref.read(routeInfoProvider).valueOrNull;
    String notifText;
    if (routeInfo != null && routeInfo.distanceKm > 0) {
      final eta    = DateTime.now().add(routeInfo.duration);
      final etaStr = '${eta.hour.toString().padLeft(2, '0')}h${eta.minute.toString().padLeft(2, '0')}';
      notifText    = '${routeInfo.distanceKm.toStringAsFixed(0)} km · Arrivée ~$etaStr';
    } else {
      notifText = '${mission.villeDepart} → ${mission.villeArrivee}';
    }
    FlutterForegroundTask.updateService(
      notificationTitle: 'Mission en cours',
      notificationText:  notifText,
    );

    final queue = ref.read(gpsQueueProvider);
    await queue.enqueue(
      truckId:    mission.truckId ?? '',
      shipmentId: mission.id,
      latitude:   pos.latitude,
      longitude:  pos.longitude,
      vitesse:    speedKmh > 0 ? speedKmh : null,
    );
    await queue.flush();
  }
}

// ── Provider global ───────────────────────────────────────────────────────────

final gpsTrackingProvider =
    NotifierProvider<GpsTrackingNotifier, GpsTrackingState>(
  GpsTrackingNotifier.new,
);

// ── Initialisation FlutterForegroundTask (appeler dans main()) ───────────────

void initForegroundTask() {
  FlutterForegroundTask.init(
    androidNotificationOptions: AndroidNotificationOptions(
      channelId:          'gps_tracking_channel',
      channelName:        'Tracking GPS Mission',
      channelDescription: 'Notification active pendant le suivi de mission',
      channelImportance:  NotificationChannelImportance.LOW,
      priority:           NotificationPriority.LOW,
    ),
    iosNotificationOptions: const IOSNotificationOptions(
      showNotification: false,
      playSound:        false,
    ),
    foregroundTaskOptions: ForegroundTaskOptions(
      eventAction:                ForegroundTaskEventAction.nothing(),
      autoRunOnBoot:              false,
      autoRunOnMyPackageReplaced: false,
      allowWifiLock:              false,
      allowWakeLock:              true,
    ),
  );
}
