// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'driver.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$DriverImpl _$$DriverImplFromJson(Map<String, dynamic> json) => _$DriverImpl(
  id: json['id'] as String,
  nom: json['nom'] as String,
  prenom: json['prenom'] as String,
  email: json['email'] as String,
  telephone: json['telephone'] as String,
  numeroPermis: json['numeroPermis'] as String,
  statut: json['statut'] as String,
  tenantId: json['tenantId'] as String,
);

Map<String, dynamic> _$$DriverImplToJson(_$DriverImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'nom': instance.nom,
      'prenom': instance.prenom,
      'email': instance.email,
      'telephone': instance.telephone,
      'numeroPermis': instance.numeroPermis,
      'statut': instance.statut,
      'tenantId': instance.tenantId,
    };
