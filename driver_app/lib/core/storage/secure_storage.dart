import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _tokenKey        = 'cu_token';
const _refreshTokenKey = 'cu_refresh_token';
const _userKey         = 'cu_user';

class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> saveSession(String token, String refreshToken, Map<String, dynamic> user) async {
    await Future.wait([
      _storage.write(key: _tokenKey,        value: token),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
      _storage.write(key: _userKey,         value: jsonEncode(user)),
    ]);
  }

  Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  Future<void> saveRefreshToken(String refreshToken) =>
      _storage.write(key: _refreshTokenKey, value: refreshToken);

  Future<String?> getToken()        => _storage.read(key: _tokenKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<Map<String, dynamic>?> getUser() async {
    final raw = await _storage.read(key: _userKey);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  Future<void> clear() async {
    await Future.wait([
      _storage.delete(key: _tokenKey),
      _storage.delete(key: _refreshTokenKey),
      _storage.delete(key: _userKey),
    ]);
  }
}

final secureStorageProvider = Provider<SecureStorage>((ref) => SecureStorage());
