import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';
import '../domain/shipment.dart';

part 'missions_repository.g.dart';

class MissionsRepository {
  const MissionsRepository(this._api);
  final ApiClient _api;

  Future<List<Shipment>> getMissions() async {
    final res = await _api.get<List<dynamic>>('/shipments');
    final list = res.data ?? [];
    return list
        .map((e) => Shipment.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Shipment> getMission(String id) async {
    final res = await _api.get<Map<String, dynamic>>('/shipments/$id');
    final data = res.data!;
    // GenericService wraps in { data: ... }
    final raw = data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return Shipment.fromJson(raw);
  }

  Future<Shipment> startMission(String id) async {
    final res = await _api.post<Map<String, dynamic>>('/shipments/$id/start', data: {});
    final data = res.data!;
    final raw = data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return Shipment.fromJson(raw);
  }

  Future<Shipment> deliverMission(String id) async {
    final res = await _api.post<Map<String, dynamic>>('/shipments/$id/deliver', data: {});
    final data = res.data!;
    final raw = data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return Shipment.fromJson(raw);
  }
}

@riverpod
MissionsRepository missionsRepository(Ref ref) {
  return MissionsRepository(ref.watch(apiClientProvider));
}
