import 'package:freezed_annotation/freezed_annotation.dart';

part 'shipment.freezed.dart';
part 'shipment.g.dart';

@freezed
class Shipment with _$Shipment {
  const factory Shipment({
    required String id,
    required String marchandise,
    required double poids,
    required String villeDepart,
    required String paysDepart,
    required String villeArrivee,
    required String paysArrivee,
    required String statut,
    required String dateAnnonce,
    required String heureAnnonce,
    int? quantite,
    String? emballage,
    double? prixTransport,
    String? companyId,
    String? transporterId,
    String? truckId,
    String? driverId,
    String? commentaireGeneral,
  }) = _Shipment;

  factory Shipment.fromJson(Map<String, dynamic> json) => _$ShipmentFromJson(json);
}
