import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_client.dart';

const _kGpsQueue = 'gps_position_queue';

class _QueuedPosition {
  const _QueuedPosition({
    required this.truckId,
    required this.shipmentId,
    required this.latitude,
    required this.longitude,
    required this.vitesse,
    required this.timestamp,
  });

  final String  truckId;
  final String  shipmentId;
  final double  latitude;
  final double  longitude;
  final double? vitesse;
  final String  timestamp;

  Map<String, dynamic> toJson() => {
    'truckId':    truckId,
    'shipmentId': shipmentId,
    'latitude':   latitude,
    'longitude':  longitude,
    'vitesse':    vitesse,
    'timestamp':  timestamp,
  };

  factory _QueuedPosition.fromJson(Map<String, dynamic> j) => _QueuedPosition(
    truckId:    j['truckId']    as String,
    shipmentId: j['shipmentId'] as String,
    latitude:   (j['latitude']  as num).toDouble(),
    longitude:  (j['longitude'] as num).toDouble(),
    vitesse:    j['vitesse']    != null ? (j['vitesse'] as num).toDouble() : null,
    timestamp:  j['timestamp']  as String,
  );
}

class GpsQueueService {
  final ApiClient _api;
  GpsQueueService(this._api);

  // Ajoute une position à la file locale
  Future<void> enqueue({
    required String truckId,
    required String shipmentId,
    required double latitude,
    required double longitude,
    double? vitesse,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final raw   = prefs.getString(_kGpsQueue);
    final list  = raw != null ? (jsonDecode(raw) as List<dynamic>) : <dynamic>[];

    // Limite à 500 positions max (~50KB) pour éviter de saturer le stockage
    if (list.length >= 500) list.removeAt(0);

    list.add(_QueuedPosition(
      truckId:    truckId,
      shipmentId: shipmentId,
      latitude:   latitude,
      longitude:  longitude,
      vitesse:    vitesse,
      timestamp:  DateTime.now().toIso8601String(),
    ).toJson());

    await prefs.setString(_kGpsQueue, jsonEncode(list));
  }

  // Tente d'envoyer toutes les positions en attente
  Future<void> flush() async {
    final prefs = await SharedPreferences.getInstance();
    final raw   = prefs.getString(_kGpsQueue);
    if (raw == null) return;

    final list = (jsonDecode(raw) as List<dynamic>)
        .map((e) => _QueuedPosition.fromJson(e as Map<String, dynamic>))
        .toList();

    if (list.isEmpty) return;

    final sent = <int>[];
    for (var i = 0; i < list.length; i++) {
      try {
        final p = list[i];
        await _api.post('/tracking', data: {
          'truckId':    p.truckId,
          'shipmentId': p.shipmentId,
          'latitude':   p.latitude,
          'longitude':  p.longitude,
          if (p.vitesse != null) 'vitesse': p.vitesse,
          'timestamp':  p.timestamp,
        });
        sent.add(i);
      } catch (_) {
        // Réseau toujours indispo — on arrête et on garde le reste
        break;
      }
    }

    if (sent.isNotEmpty) {
      final remaining = list
          .asMap()
          .entries
          .where((e) => !sent.contains(e.key))
          .map((e) => e.value.toJson())
          .toList();
      await prefs.setString(_kGpsQueue, jsonEncode(remaining));
    }
  }

  // Vide la file (après livraison)
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kGpsQueue);
  }

  Future<int> pendingCount() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kGpsQueue);
    if (raw == null) return 0;
    return (jsonDecode(raw) as List<dynamic>).length;
  }
}

final gpsQueueProvider = Provider<GpsQueueService>((ref) {
  return GpsQueueService(ref.watch(apiClientProvider));
});
