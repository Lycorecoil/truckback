import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../../../core/services/offline_cache_service.dart';
import '../domain/driver.dart';

part 'profile_repository.g.dart';

class ProfileRepository {
  const ProfileRepository(this._api);
  final ApiClient _api;

  Future<Driver> getMyProfile() async {
    final res = await _api.get<Map<String, dynamic>>('/fleet/drivers/me');
    final data = res.data!;
    final raw = data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return Driver.fromJson(raw);
  }

  Future<Driver> updatePhone(String telephone) async {
    final res = await _api.put<Map<String, dynamic>>(
      '/fleet/drivers/me',
      data: {'telephone': telephone},
    );
    final data = res.data!;
    final raw = data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return Driver.fromJson(raw);
  }
}

@riverpod
ProfileRepository profileRepository(Ref ref) {
  return ProfileRepository(ref.watch(apiClientProvider));
}

@Riverpod(keepAlive: true)
Future<Driver> myProfile(Ref ref) async {
  final cache = ref.read(offlineCacheProvider);
  try {
    final driver = await ref.read(profileRepositoryProvider).getMyProfile();
    await cache.saveProfile(driver.toJson());
    return driver;
  } catch (_) {
    final cached = await cache.getProfile();
    if (cached != null) return Driver.fromJson(cached);
    rethrow;
  }
}

@riverpod
Future<Truck?> myTruck(Ref ref) async {
  final cache = ref.read(offlineCacheProvider);
  try {
    final api = ref.read(apiClientProvider);
    final res = await api.get<Map<String, dynamic>>('/fleet/trucks/my');
    if (res.data == null) return null;
    final truck = Truck.fromJson(res.data!);
    await cache.saveTruck(truck.toJson());
    return truck;
  } catch (_) {
    final cached = await cache.getTruck();
    if (cached != null) return Truck.fromJson(cached);
    return null; // Pas de camion assigné → null valide
  }
}
