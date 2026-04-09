import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../domain/shipment.dart';
import 'missions_repository.dart';
import '../../../core/services/offline_cache_service.dart';
import '../../../core/services/gps_queue_service.dart';
import '../../../core/services/gps_tracking_notifier.dart';

part 'missions_notifier.g.dart';

@Riverpod(keepAlive: true)
Future<List<Shipment>> missions(Ref ref) async {
  final cache = ref.read(offlineCacheProvider);
  try {
    final list = await ref.read(missionsRepositoryProvider).getMissions();
    // Persist pour consultation offline
    await cache.saveMissions(list.map((s) => s.toJson()).toList());
    return list;
  } catch (_) {
    // Réseau indispo → fallback cache local
    final cached = await cache.getMissions();
    if (cached != null) return cached.map(Shipment.fromJson).toList();
    rethrow;
  }
}

@riverpod
Future<Shipment> missionDetail(Ref ref, String id) async {
  try {
    return await ref.read(missionsRepositoryProvider).getMission(id);
  } catch (_) {
    // Fallback 1 : missions déjà en mémoire (keepAlive)
    final inMemory = ref.read(missionsProvider).valueOrNull
        ?.where((s) => s.id == id)
        .firstOrNull;
    if (inMemory != null) return inMemory;

    // Fallback 2 : cache SharedPreferences
    final cached = await ref.read(offlineCacheProvider).getMissions();
    final found = cached
        ?.map(Shipment.fromJson)
        .where((s) => s.id == id)
        .firstOrNull;
    if (found != null) return found;

    rethrow;
  }
}

@riverpod
class MissionActionNotifier extends _$MissionActionNotifier {
  @override
  AsyncValue<Shipment?> build() => const AsyncValue.data(null);

  Future<void> start(String id) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(missionsRepositoryProvider).startMission(id),
    );
    if (!state.hasError) {
      ref.invalidate(missionsProvider);
    }
  }

  Future<void> deliver(String id) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(missionsRepositoryProvider).deliverMission(id),
    );
    if (!state.hasError) {
      // Nettoyage offline : cache mission + file GPS
      await ref.read(offlineCacheProvider).clearMissionData(id);
      await ref.read(gpsQueueProvider).clear();
      ref.read(gpsTrackingProvider.notifier).stopTracking();
      ref.invalidate(missionsProvider);
    }
  }
}
