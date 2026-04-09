import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/notifications/push_notification_service.dart';
import 'core/services/gps_tracking_notifier.dart';
import 'core/services/notification_banner_notifier.dart';
import 'features/auth/data/auth_notifier.dart';
import 'features/missions/data/missions_notifier.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  initForegroundTask();
  runApp(const ProviderScope(child: ElimmekatruckApp()));
}

class ElimmekatruckApp extends ConsumerStatefulWidget {
  const ElimmekatruckApp({super.key});

  @override
  ConsumerState<ElimmekatruckApp> createState() => _ElimmekatruckAppState();
}

class _ElimmekatruckAppState extends ConsumerState<ElimmekatruckApp> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      // Init OneSignal + restaure la session JWT
      final pushService = ref.read(pushNotificationServiceProvider);
      await pushService.initialize();
      await ref.read(authNotifierProvider.notifier).restoreSession();

      // Demander la permission GPS au démarrage (dialog OS)
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        await Geolocator.requestPermission();
      }

      // Auto-refresh + bannière in-app quand une notification push arrive
      pushService.onNotificationReceived(
        onRefresh: () => ref.invalidate(missionsProvider),
        onBanner: (title, body) => ref.read(notificationBannerProvider.notifier).show(
          BannerNotification(title: title, body: body, route: '/missions'),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    // Écouter les missions pour démarrer/arrêter le GPS automatiquement
    ref.listen(missionsProvider, (_, state) {
      state.whenData((missions) {
        final active = missions.where((m) => m.statut == 'IN_PROGRESS').firstOrNull;
        final tracking = ref.read(gpsTrackingProvider);

        if (active != null && !tracking.isTracking) {
          // Mission EN COURS → démarrer le GPS automatiquement
          ref.read(gpsTrackingProvider.notifier).startTracking(active);
        } else if (active == null && tracking.isTracking) {
          // Plus de mission en cours → arrêter le GPS
          ref.read(gpsTrackingProvider.notifier).stopTracking();
        }
      });
    });

    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'Elimmekatruck',
      theme: appTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
