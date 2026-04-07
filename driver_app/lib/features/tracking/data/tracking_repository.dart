import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../core/api/api_client.dart';

part 'tracking_repository.g.dart';

class TrackingRepository {
  const TrackingRepository(this._api);
  final ApiClient _api;

  Future<void> sendPosition({
    required String truckId,
    required String shipmentId,
    required double latitude,
    required double longitude,
    double? vitesse,
  }) async {
    await _api.post('/tracking', data: {
      'truckId': truckId,
      'shipmentId': shipmentId,
      'latitude': latitude,
      'longitude': longitude,
      if (vitesse != null) 'vitesse': vitesse,
    });
  }
}

@riverpod
TrackingRepository trackingRepository(Ref ref) {
  return TrackingRepository(ref.watch(apiClientProvider));
}
