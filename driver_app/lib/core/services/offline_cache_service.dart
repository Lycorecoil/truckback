import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ── Clés de stockage ──────────────────────────────────────────────────────────
const _kMissions  = 'cache_missions';
const _kProfile   = 'cache_profile';
const _kTruck     = 'cache_truck';
const _kRoutePrefix = 'cache_route_'; // + missionId

class OfflineCacheService {
  // ── Missions ────────────────────────────────────────────────────────────────

  Future<void> saveMissions(List<Map<String, dynamic>> missions) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kMissions, jsonEncode(missions));
  }

  Future<List<Map<String, dynamic>>?> getMissions() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kMissions);
    if (raw == null) return null;
    final list = jsonDecode(raw) as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  // ── Profil chauffeur ─────────────────────────────────────────────────────────

  Future<void> saveProfile(Map<String, dynamic> profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kProfile, jsonEncode(profile));
  }

  Future<Map<String, dynamic>?> getProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kProfile);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  // ── Camion assigné ───────────────────────────────────────────────────────────

  Future<void> saveTruck(Map<String, dynamic>? truck) async {
    final prefs = await SharedPreferences.getInstance();
    if (truck == null) {
      await prefs.remove(_kTruck);
    } else {
      await prefs.setString(_kTruck, jsonEncode(truck));
    }
  }

  Future<Map<String, dynamic>?> getTruck() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_kTruck);
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  // ── Itinéraire OSRM (liste de [lat, lon]) ────────────────────────────────────

  Future<void> saveRoute(String missionId, List<List<double>> waypoints) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_kRoutePrefix$missionId', jsonEncode(waypoints));
  }

  Future<List<List<double>>?> getRoute(String missionId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$_kRoutePrefix$missionId');
    if (raw == null) return null;
    final list = jsonDecode(raw) as List<dynamic>;
    return list.map((e) => (e as List<dynamic>).cast<double>()).toList();
  }

  Future<void> clearRoute(String missionId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('$_kRoutePrefix$missionId');
  }

  // ── Nettoyage complet d'une mission livrée ────────────────────────────────────

  Future<void> clearMissionData(String missionId) async {
    await clearRoute(missionId);
    // Mettre à jour le statut dans le cache missions
    final cached = await getMissions();
    if (cached != null) {
      final updated = cached.map((m) {
        if (m['id'] == missionId) {
          return {...m, 'statut': 'DELIVERED'};
        }
        return m;
      }).toList();
      await saveMissions(updated);
    }
  }
}

final offlineCacheProvider = Provider<OfflineCacheService>((_) => OfflineCacheService());
