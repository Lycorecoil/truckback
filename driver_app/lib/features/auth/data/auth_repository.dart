import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../domain/auth_state.dart';

part 'auth_repository.g.dart';

class AuthRepository {
  const AuthRepository(this._api, this._storage);

  final ApiClient _api;
  final SecureStorage _storage;

  Future<AuthUser> login(String email, String password) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    final data = res.data!;
    final token        = data['token'] as String;
    final refreshToken = data['refreshToken'] as String? ?? '';
    final user = data['user'] as Map<String, dynamic>;

    // Vérification rôle
    if (user['role'] != 'DRIVER') {
      throw Exception('Ce compte n\'est pas un compte chauffeur');
    }

    await _storage.saveSession(token, refreshToken, user);
    return AuthUser(
      id: user['id'] as String,
      email: user['email'] as String,
      role: user['role'] as String,
      tenantId: user['tenantId'] as String? ?? '',
    );
  }

  Future<AuthUser?> restoreSession() async {
    final user = await _storage.getUser();
    if (user == null) return null;
    final token = await _storage.getToken();
    if (token == null) return null;
    return AuthUser(
      id: user['id'] as String? ?? user['sub'] as String,
      email: user['email'] as String,
      role: user['role'] as String,
      tenantId: user['tenantId'] as String? ?? '',
    );
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
    await _storage.clear();
  }
}

@riverpod
AuthRepository authRepository(Ref ref) {
  return AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(secureStorageProvider),
  );
}
