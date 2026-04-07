// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'missions_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$missionsHash() => r'c8533dd1031e67a81025d19f08da556879c0af43';

/// See also [missions].
@ProviderFor(missions)
final missionsProvider = AutoDisposeFutureProvider<List<Shipment>>.internal(
  missions,
  name: r'missionsProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$missionsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef MissionsRef = AutoDisposeFutureProviderRef<List<Shipment>>;
String _$missionActionNotifierHash() =>
    r'5d4a58a9de04fd2bf33be80b6a6e0875168501df';

/// See also [MissionActionNotifier].
@ProviderFor(MissionActionNotifier)
final missionActionNotifierProvider =
    AutoDisposeNotifierProvider<
      MissionActionNotifier,
      AsyncValue<Shipment?>
    >.internal(
      MissionActionNotifier.new,
      name: r'missionActionNotifierProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$missionActionNotifierHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$MissionActionNotifier = AutoDisposeNotifier<AsyncValue<Shipment?>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
