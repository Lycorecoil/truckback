import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';
import '../api/api_client.dart';

const _oneSignalAppId = '3030218a-6d9b-458e-a75a-e5415d1a73e3';

class PushNotificationService {
  const PushNotificationService(this._api);
  final ApiClient _api;

  /// Initialise OneSignal + demande permission + écoute les notifications
  Future<void> initialize() async {
    OneSignal.initialize(_oneSignalAppId);
    await OneSignal.Notifications.requestPermission(true);
  }

  /// Enregistre les listeners OneSignal.
  /// [onRefresh] : rafraîchit les données.
  /// [onBanner]  : affiche la bannière in-app avec titre + corps du message.
  void onNotificationReceived({
    required void Function() onRefresh,
    required void Function(String title, String? body) onBanner,
  }) {
    OneSignal.Notifications.addForegroundWillDisplayListener((event) {
      event.notification.display();
      onRefresh();
      onBanner(
        event.notification.title ?? 'Nouvelle notification',
        event.notification.body,
      );
    });

    // Tap sur la notification (app en arrière-plan) → juste rafraîchir
    OneSignal.Notifications.addClickListener((_) => onRefresh());
  }

  /// Lie le device au driverId après login
  Future<void> registerDriver(String driverId) async {
    await OneSignal.login(driverId);

    final playerId = OneSignal.User.pushSubscription.id;
    if (playerId != null && playerId.isNotEmpty) {
      await _savePlayerIdToBackend(playerId);
    }

    OneSignal.User.pushSubscription.addObserver((state) {
      final newId = state.current.id;
      if (newId != null && newId.isNotEmpty) {
        _savePlayerIdToBackend(newId);
      }
    });
  }

  Future<void> _savePlayerIdToBackend(String playerId) async {
    try {
      await _api.put('/fleet/drivers/me/device-token', data: {
        'oneSignalPlayerId': playerId,
      });
    } catch (_) {}
  }

  Future<void> unregister() async {
    await OneSignal.logout();
  }
}

final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService(ref.watch(apiClientProvider));
});
