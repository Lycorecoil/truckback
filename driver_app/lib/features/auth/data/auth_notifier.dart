import 'dart:async' show unawaited;
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/notifications/push_notification_service.dart';
import '../domain/auth_state.dart';
import 'auth_repository.dart';

part 'auth_notifier.g.dart';

@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AuthState build() => const AuthState.initial();

  Future<void> restoreSession() async {
    state = const AuthState.loading();
    try {
      final user = await ref.read(authRepositoryProvider).restoreSession();
      state = user != null
          ? AuthState.authenticated(user)
          : const AuthState.unauthenticated();
    } catch (_) {
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> login(String email, String password) async {
    state = const AuthState.loading();
    try {
      final user = await ref.read(authRepositoryProvider).login(email, password);
      state = AuthState.authenticated(user);
      // Enregistre le device token OneSignal après login
      unawaited(ref.read(pushNotificationServiceProvider).registerDriver(user.id));
    } on Exception catch (e) {
      state = AuthState.error(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> logout() async {
    await ref.read(pushNotificationServiceProvider).unregister();
    await ref.read(authRepositoryProvider).logout();
    state = const AuthState.unauthenticated();
  }
}
