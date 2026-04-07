// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shipment.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ShipmentImpl _$$ShipmentImplFromJson(Map<String, dynamic> json) =>
    _$ShipmentImpl(
      id: json['id'] as String,
      marchandise: json['marchandise'] as String,
      poids: (json['poids'] as num).toDouble(),
      villeDepart: json['villeDepart'] as String,
      paysDepart: json['paysDepart'] as String,
      villeArrivee: json['villeArrivee'] as String,
      paysArrivee: json['paysArrivee'] as String,
      statut: json['statut'] as String,
      dateAnnonce: json['dateAnnonce'] as String,
      heureAnnonce: json['heureAnnonce'] as String,
      quantite: (json['quantite'] as num?)?.toInt(),
      emballage: json['emballage'] as String?,
      prixTransport: (json['prixTransport'] as num?)?.toDouble(),
      companyId: json['companyId'] as String?,
      transporterId: json['transporterId'] as String?,
      truckId: json['truckId'] as String?,
      driverId: json['driverId'] as String?,
      commentaireGeneral: json['commentaireGeneral'] as String?,
    );

Map<String, dynamic> _$$ShipmentImplToJson(_$ShipmentImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'marchandise': instance.marchandise,
      'poids': instance.poids,
      'villeDepart': instance.villeDepart,
      'paysDepart': instance.paysDepart,
      'villeArrivee': instance.villeArrivee,
      'paysArrivee': instance.paysArrivee,
      'statut': instance.statut,
      'dateAnnonce': instance.dateAnnonce,
      'heureAnnonce': instance.heureAnnonce,
      'quantite': instance.quantite,
      'emballage': instance.emballage,
      'prixTransport': instance.prixTransport,
      'companyId': instance.companyId,
      'transporterId': instance.transporterId,
      'truckId': instance.truckId,
      'driverId': instance.driverId,
      'commentaireGeneral': instance.commentaireGeneral,
    };
