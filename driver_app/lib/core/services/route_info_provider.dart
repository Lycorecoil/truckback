import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'routing_service.dart';
import 'gps_tracking_notifier.dart';
import 'offline_cache_service.dart';
import '../../features/missions/data/missions_notifier.dart';

// Calcule le trajet planifié (départ → arrivée) pour la mission en cours.
// Priorité : appel OSRM si réseau dispo → cache sinon.
final routeInfoProvider = FutureProvider<RouteInfo?>((ref) async {
  final missions = await ref.watch(missionsProvider.future);
  final active = missions.where((m) => m.statut == 'IN_PROGRESS').firstOrNull;
  if (active == null) return null;

  final service      = ref.read(routingServiceProvider);
  final offlineCache = ref.read(offlineCacheProvider);
  final tracking     = ref.read(gpsTrackingProvider);

  // Point de départ : position GPS actuelle si dispo, sinon ville de départ
  LatLng? from;
  if (tracking.lastPosition != null) {
    from = LatLng(tracking.lastPosition!.latitude, tracking.lastPosition!.longitude);
  } else {
    from = await service.geocode(active.villeDepart, active.paysDepart);
  }

  final to = await service.geocode(active.villeArrivee, active.paysArrivee);

  if (from != null && to != null) {
    try {
      final route = await service.getRoute(from, to);
      if (route != null) {
        // Mettre en cache pour usage offline
        await offlineCache.saveRoute(
          active.id,
          route.waypoints.map((wp) => [wp.latitude, wp.longitude]).toList(),
        );
        return route;
      }
    } catch (_) {
      // Réseau indispo — on tombe dans le cache ci-dessous
    }
  }

  // Fallback : itinéraire mis en cache (pas de distance/ETA à jour)
  final cachedWaypoints = await offlineCache.getRoute(active.id);
  if (cachedWaypoints != null) {
    return RouteInfo(
      distanceKm: 0,   // inconnu en mode offline
      duration:   Duration.zero,
      waypoints:  cachedWaypoints
          .map((wp) => LatLng(wp[0], wp[1]))
          .toList(),
    );
  }

  return null;
});
