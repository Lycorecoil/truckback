import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';
import '../api/api_client.dart';

// ⚠️  À remplir après création du compte OneSignal
const _oneSignalAppId = 'VOTRE_ONESIGNAL_APP_ID';

class PushNotificationService {
  const PushNotificationService(this._api);
  final ApiClient _api;

  /// Initialise OneSignal et demande la permission
  Future<void> initialize() async {
    OneSignal.initialize(_oneSignalAppId);
    await OneSignal.Notifications.requestPermission(true);
  }

  /// À appeler après login — lie le device au driverId
  Future<void> registerDriver(String driverId) async {
    // Lie l'external user ID au compte OneSignal
    await OneSignal.login(driverId);

    // Récupère le player ID et l'envoie au backend
    final playerId = OneSignal.User.pushSubscription.id;
    if (playerId != null && playerId.isNotEmpty) {
      await _savePlayerIdToBackend(playerId);
    }

    // Écoute les changements de subscription (token refresh)
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
    } catch (_) {
      // Fire-and-forget — ne pas bloquer si ça échoue
    }
  }

  /// À appeler au logout
  Future<void> unregister() async {
    await OneSignal.logout();
  }
}

final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService(ref.watch(apiClientProvider));
});
