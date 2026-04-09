import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage.dart';

// En dev : ngrok tunnel. En prod : ton domaine.
const _baseUrl = 'https://e5d6-102-180-70-102.ngrok-free.app/v1';

class ApiClient {
  late final Dio _dio;
  final SecureStorage _storage;

  ApiClient(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    ));

    // ── Intercepteur 1 : injecte le token JWT sur chaque requête ────────────
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },

      // ── Intercepteur 2 : auto-refresh sur 401 ───────────────────────────
      onError: (error, handler) async {
        if (error.response?.statusCode != 401) {
          return handler.next(error);
        }

        // Évite une boucle infinie si c'est l'endpoint refresh lui-même qui échoue
        final path = error.requestOptions.path;
        if (path.contains('/auth/refresh') || path.contains('/auth/login')) {
          return handler.next(error);
        }

        final refreshToken = await _storage.getRefreshToken();
        if (refreshToken == null || refreshToken.isEmpty) {
          return handler.next(error);
        }

        try {
          // Appel au endpoint refresh (sans passer par l'intercepteur JWT)
          final refreshDio = Dio(BaseOptions(
            baseUrl: _baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          ));
          final refreshRes = await refreshDio.post<Map<String, dynamic>>(
            '/auth/refresh',
            data: {'refreshToken': refreshToken},
          );

          final newAccessToken  = refreshRes.data!['accessToken']  as String;
          final newRefreshToken = refreshRes.data!['refreshToken'] as String;

          // Persiste les nouveaux tokens
          await _storage.saveToken(newAccessToken);
          await _storage.saveRefreshToken(newRefreshToken);

          // Relance la requête originale avec le nouveau token
          final opts = error.requestOptions;
          opts.headers['Authorization'] = 'Bearer $newAccessToken';
          final retryResponse = await _dio.fetch(opts);
          return handler.resolve(retryResponse);
        } catch (_) {
          // Le refresh a échoué (token expiré/révoqué) → laisser le 401 remonter
          // L'app redirigera vers le login via authNotifier
          return handler.next(error);
        }
      },
    ));
  }

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? params}) =>
      _dio.get<T>(path, queryParameters: params);

  Future<Response<T>> post<T>(String path, {dynamic data}) =>
      _dio.post<T>(path, data: data);

  Future<Response<T>> put<T>(String path, {dynamic data}) =>
      _dio.put<T>(path, data: data);

  Future<Response<T>> delete<T>(String path) => _dio.delete<T>(path);
}

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage);
});
