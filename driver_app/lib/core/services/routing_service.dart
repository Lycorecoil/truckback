import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

class RouteInfo {
  const RouteInfo({
    required this.distanceKm,
    required this.duration,
    required this.waypoints,
  });
  final double       distanceKm;
  final Duration     duration;
  final List<LatLng> waypoints; // tracé complet pour la carte
}

class RoutingService {
  final _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 8),
    receiveTimeout: const Duration(seconds: 10),
    headers: {'User-Agent': 'elimmekatruck-driver-app/1.0'},
  ));

  // Géocode un nom de ville → coordonnées GPS via OpenStreetMap Nominatim
  Future<LatLng?> geocode(String city, String country) async {
    try {
      final res = await _dio.get<List<dynamic>>(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': '$city, $country',
          'format': 'json',
          'limit': 1,
        },
      );
      final data = res.data;
      if (data == null || data.isEmpty) return null;
      final item = data.first as Map<String, dynamic>;
      return LatLng(
        double.parse(item['lat'] as String),
        double.parse(item['lon'] as String),
      );
    } catch (_) {
      return null;
    }
  }

  // Calcule le trajet routier entre deux points via OSRM (gratuit, sans clé)
  Future<RouteInfo?> getRoute(LatLng from, LatLng to) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        'https://router.project-osrm.org/route/v1/driving/'
        '${from.longitude},${from.latitude};'
        '${to.longitude},${to.latitude}',
        queryParameters: {
          'overview': 'full',
          'geometries': 'geojson',
        },
      );
      final data = res.data;
      if (data == null) return null;

      final routes = data['routes'] as List<dynamic>;
      if (routes.isEmpty) return null;

      final route    = routes.first as Map<String, dynamic>;
      final geometry = route['geometry'] as Map<String, dynamic>;
      final coords   = geometry['coordinates'] as List<dynamic>;

      final waypoints = coords.map((c) {
        final pair = c as List<dynamic>;
        return LatLng((pair[1] as num).toDouble(), (pair[0] as num).toDouble());
      }).toList();

      return RouteInfo(
        distanceKm: (route['distance'] as num) / 1000,
        duration:   Duration(seconds: (route['duration'] as num).toInt()),
        waypoints:  waypoints,
      );
    } catch (_) {
      return null;
    }
  }
}

final routingServiceProvider = Provider<RoutingService>((_) => RoutingService());
