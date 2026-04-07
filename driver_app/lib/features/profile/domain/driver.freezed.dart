// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'driver.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

Driver _$DriverFromJson(Map<String, dynamic> json) {
  return _Driver.fromJson(json);
}

/// @nodoc
mixin _$Driver {
  String get id => throw _privateConstructorUsedError;
  String get nom => throw _privateConstructorUsedError;
  String get prenom => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;
  String get telephone => throw _privateConstructorUsedError;
  String get numeroPermis => throw _privateConstructorUsedError;
  String get statut => throw _privateConstructorUsedError;
  String get tenantId => throw _privateConstructorUsedError;

  /// Serializes this Driver to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Driver
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $DriverCopyWith<Driver> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DriverCopyWith<$Res> {
  factory $DriverCopyWith(Driver value, $Res Function(Driver) then) =
      _$DriverCopyWithImpl<$Res, Driver>;
  @useResult
  $Res call({
    String id,
    String nom,
    String prenom,
    String email,
    String telephone,
    String numeroPermis,
    String statut,
    String tenantId,
  });
}

/// @nodoc
class _$DriverCopyWithImpl<$Res, $Val extends Driver>
    implements $DriverCopyWith<$Res> {
  _$DriverCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Driver
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? nom = null,
    Object? prenom = null,
    Object? email = null,
    Object? telephone = null,
    Object? numeroPermis = null,
    Object? statut = null,
    Object? tenantId = null,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            nom: null == nom
                ? _value.nom
                : nom // ignore: cast_nullable_to_non_nullable
                      as String,
            prenom: null == prenom
                ? _value.prenom
                : prenom // ignore: cast_nullable_to_non_nullable
                      as String,
            email: null == email
                ? _value.email
                : email // ignore: cast_nullable_to_non_nullable
                      as String,
            telephone: null == telephone
                ? _value.telephone
                : telephone // ignore: cast_nullable_to_non_nullable
                      as String,
            numeroPermis: null == numeroPermis
                ? _value.numeroPermis
                : numeroPermis // ignore: cast_nullable_to_non_nullable
                      as String,
            statut: null == statut
                ? _value.statut
                : statut // ignore: cast_nullable_to_non_nullable
                      as String,
            tenantId: null == tenantId
                ? _value.tenantId
                : tenantId // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$DriverImplCopyWith<$Res> implements $DriverCopyWith<$Res> {
  factory _$$DriverImplCopyWith(
    _$DriverImpl value,
    $Res Function(_$DriverImpl) then,
  ) = __$$DriverImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String nom,
    String prenom,
    String email,
    String telephone,
    String numeroPermis,
    String statut,
    String tenantId,
  });
}

/// @nodoc
class __$$DriverImplCopyWithImpl<$Res>
    extends _$DriverCopyWithImpl<$Res, _$DriverImpl>
    implements _$$DriverImplCopyWith<$Res> {
  __$$DriverImplCopyWithImpl(
    _$DriverImpl _value,
    $Res Function(_$DriverImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of Driver
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? nom = null,
    Object? prenom = null,
    Object? email = null,
    Object? telephone = null,
    Object? numeroPermis = null,
    Object? statut = null,
    Object? tenantId = null,
  }) {
    return _then(
      _$DriverImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        nom: null == nom
            ? _value.nom
            : nom // ignore: cast_nullable_to_non_nullable
                  as String,
        prenom: null == prenom
            ? _value.prenom
            : prenom // ignore: cast_nullable_to_non_nullable
                  as String,
        email: null == email
            ? _value.email
            : email // ignore: cast_nullable_to_non_nullable
                  as String,
        telephone: null == telephone
            ? _value.telephone
            : telephone // ignore: cast_nullable_to_non_nullable
                  as String,
        numeroPermis: null == numeroPermis
            ? _value.numeroPermis
            : numeroPermis // ignore: cast_nullable_to_non_nullable
                  as String,
        statut: null == statut
            ? _value.statut
            : statut // ignore: cast_nullable_to_non_nullable
                  as String,
        tenantId: null == tenantId
            ? _value.tenantId
            : tenantId // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$DriverImpl implements _Driver {
  const _$DriverImpl({
    required this.id,
    required this.nom,
    required this.prenom,
    required this.email,
    required this.telephone,
    required this.numeroPermis,
    required this.statut,
    required this.tenantId,
  });

  factory _$DriverImpl.fromJson(Map<String, dynamic> json) =>
      _$$DriverImplFromJson(json);

  @override
  final String id;
  @override
  final String nom;
  @override
  final String prenom;
  @override
  final String email;
  @override
  final String telephone;
  @override
  final String numeroPermis;
  @override
  final String statut;
  @override
  final String tenantId;

  @override
  String toString() {
    return 'Driver(id: $id, nom: $nom, prenom: $prenom, email: $email, telephone: $telephone, numeroPermis: $numeroPermis, statut: $statut, tenantId: $tenantId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DriverImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.nom, nom) || other.nom == nom) &&
            (identical(other.prenom, prenom) || other.prenom == prenom) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.telephone, telephone) ||
                other.telephone == telephone) &&
            (identical(other.numeroPermis, numeroPermis) ||
                other.numeroPermis == numeroPermis) &&
            (identical(other.statut, statut) || other.statut == statut) &&
            (identical(other.tenantId, tenantId) ||
                other.tenantId == tenantId));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    nom,
    prenom,
    email,
    telephone,
    numeroPermis,
    statut,
    tenantId,
  );

  /// Create a copy of Driver
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$DriverImplCopyWith<_$DriverImpl> get copyWith =>
      __$$DriverImplCopyWithImpl<_$DriverImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$DriverImplToJson(this);
  }
}

abstract class _Driver implements Driver {
  const factory _Driver({
    required final String id,
    required final String nom,
    required final String prenom,
    required final String email,
    required final String telephone,
    required final String numeroPermis,
    required final String statut,
    required final String tenantId,
  }) = _$DriverImpl;

  factory _Driver.fromJson(Map<String, dynamic> json) = _$DriverImpl.fromJson;

  @override
  String get id;
  @override
  String get nom;
  @override
  String get prenom;
  @override
  String get email;
  @override
  String get telephone;
  @override
  String get numeroPermis;
  @override
  String get statut;
  @override
  String get tenantId;

  /// Create a copy of Driver
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$DriverImplCopyWith<_$DriverImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
