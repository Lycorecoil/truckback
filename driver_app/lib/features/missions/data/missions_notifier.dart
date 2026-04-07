import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../domain/shipment.dart';
import 'missions_repository.dart';

part 'missions_notifier.g.dart';

@riverpod
Future<List<Shipment>> missions(Ref ref) async {
  return ref.watch(missionsRepositoryProvider).getMissions();
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
      ref.invalidate(missionsProvider);
    }
  }
}
