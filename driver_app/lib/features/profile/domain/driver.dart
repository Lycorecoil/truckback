import 'package:freezed_annotation/freezed_annotation.dart';

part 'driver.freezed.dart';
part 'driver.g.dart';

@freezed
class Driver with _$Driver {
  const factory Driver({
    required String id,
    required String nom,
    required String prenom,
    required String email,
    required String telephone,
    required String numeroPermis,
    required String statut,
    required String tenantId,
  }) = _Driver;

  factory Driver.fromJson(Map<String, dynamic> json) => _$DriverFromJson(json);
}

class Truck {
  const Truck({
    required this.id,
    required this.immatriculation,
    required this.marque,
    required this.modele,
    required this.capacite,
    required this.statut,
  });

  final String id;
  final String immatriculation;
  final String marque;
  final String modele;
  final double capacite;
  final String statut;

  factory Truck.fromJson(Map<String, dynamic> json) => Truck(
    id:             json['id'] as String,
    immatriculation: json['immatriculation'] as String,
    marque:         json['marque'] as String,
    modele:         json['modele'] as String,
    capacite:       ((json['capaciteMax'] ?? json['capacite']) as num).toDouble(),
    statut:         json['statut'] as String,
  );

  Map<String, dynamic> toJson() => {
    'id':             id,
    'immatriculation': immatriculation,
    'marque':         marque,
    'modele':         modele,
    'capaciteMax':    capacite,
    'statut':         statut,
  };
}
