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
