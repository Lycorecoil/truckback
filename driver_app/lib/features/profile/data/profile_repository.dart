import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
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

@riverpod
Future<Driver> myProfile(Ref ref) async {
  return ref.watch(profileRepositoryProvider).getMyProfile();
}
