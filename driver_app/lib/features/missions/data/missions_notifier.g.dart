// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'missions_notifier.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$missionsHash() => r'09017d9f425b5da7ee0cc5525bbe215b06a75342';

/// See also [missions].
@ProviderFor(missions)
final missionsProvider = FutureProvider<List<Shipment>>.internal(
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
typedef MissionsRef = FutureProviderRef<List<Shipment>>;
String _$missionDetailHash() => r'cdf7f72fff3236c0846b91c1956ed24d35c66f59';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// See also [missionDetail].
@ProviderFor(missionDetail)
const missionDetailProvider = MissionDetailFamily();

/// See also [missionDetail].
class MissionDetailFamily extends Family<AsyncValue<Shipment>> {
  /// See also [missionDetail].
  const MissionDetailFamily();

  /// See also [missionDetail].
  MissionDetailProvider call(String id) {
    return MissionDetailProvider(id);
  }

  @override
  MissionDetailProvider getProviderOverride(
    covariant MissionDetailProvider provider,
  ) {
    return call(provider.id);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'missionDetailProvider';
}

/// See also [missionDetail].
class MissionDetailProvider extends AutoDisposeFutureProvider<Shipment> {
  /// See also [missionDetail].
  MissionDetailProvider(String id)
    : this._internal(
        (ref) => missionDetail(ref as MissionDetailRef, id),
        from: missionDetailProvider,
        name: r'missionDetailProvider',
        debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
            ? null
            : _$missionDetailHash,
        dependencies: MissionDetailFamily._dependencies,
        allTransitiveDependencies:
            MissionDetailFamily._allTransitiveDependencies,
        id: id,
      );

  MissionDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.id,
  }) : super.internal();

  final String id;

  @override
  Override overrideWith(
    FutureOr<Shipment> Function(MissionDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MissionDetailProvider._internal(
        (ref) => create(ref as MissionDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<Shipment> createElement() {
    return _MissionDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MissionDetailProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin MissionDetailRef on AutoDisposeFutureProviderRef<Shipment> {
  /// The parameter `id` of this provider.
  String get id;
}

class _MissionDetailProviderElement
    extends AutoDisposeFutureProviderElement<Shipment>
    with MissionDetailRef {
  _MissionDetailProviderElement(super.provider);

  @override
  String get id => (origin as MissionDetailProvider).id;
}

String _$missionActionNotifierHash() =>
    r'1d6c35d8394b2cd4d7195b6d6d4521134309af56';

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
