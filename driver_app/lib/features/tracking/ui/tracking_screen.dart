import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/theme/app_theme.dart';
import '../../missions/data/missions_notifier.dart';
import '../../missions/domain/shipment.dart';
import '../data/tracking_repository.dart';

class TrackingScreen extends ConsumerStatefulWidget {
  const TrackingScreen({super.key});

  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  bool _sharing = false;
  Timer? _timer;
  Position? _lastPosition;
  String? _error;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _toggleSharing(Shipment? activeMission) async {
    if (_sharing) {
      _timer?.cancel();
      setState(() => _sharing = false);
      return;
    }

    if (activeMission == null) {
      setState(() => _error = 'Aucune mission en cours');
      return;
    }

    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      final req = await Geolocator.requestPermission();
      if (req == LocationPermission.denied || req == LocationPermission.deniedForever) {
        setState(() => _error = 'Permission GPS refusée');
        return;
      }
    }

    setState(() { _sharing = true; _error = null; });

    // Envoi toutes les 30 secondes
    _timer = Timer.periodic(const Duration(seconds: 30), (_) async {
      try {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
        );
        setState(() => _lastPosition = pos);
        await ref.read(trackingRepositoryProvider).sendPosition(
          truckId: activeMission.truckId ?? '',
          shipmentId: activeMission.id,
          latitude: pos.latitude,
          longitude: pos.longitude,
          vitesse: pos.speed >= 0 ? pos.speed * 3.6 : null, // m/s → km/h
        );
      } catch (e) {
        if (mounted) setState(() => _error = 'Erreur GPS : $e');
      }
    });

    // Premier envoi immédiat
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      setState(() => _lastPosition = pos);
      await ref.read(trackingRepositoryProvider).sendPosition(
        truckId: activeMission.truckId ?? '',
        shipmentId: activeMission.id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        vitesse: pos.speed >= 0 ? pos.speed * 3.6 : null,
      );
    } catch (e) {
      setState(() => _error = 'Erreur GPS : $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final missionsAsync = ref.watch(missionsProvider);
    final activeMission = missionsAsync.valueOrNull?.firstWhere(
      (s) => s.statut == 'IN_PROGRESS',
      orElse: () => const Shipment(
        id: '', marchandise: '', poids: 0,
        villeDepart: '', paysDepart: '', villeArrivee: '', paysArrivee: '',
        statut: '', dateAnnonce: '', heureAnnonce: '',
      ),
    );
    final hasActive = activeMission != null && activeMission.id.isNotEmpty;

    return Scaffold(
      appBar: AppBar(title: const Text('Tracking GPS')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (!hasActive)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: AppColors.warning),
                    const SizedBox(width: 12),
                    const Expanded(child: Text('Aucune mission en cours. Démarrez une mission pour activer le tracking.',
                      style: TextStyle(color: AppColors.warning))),
                  ],
                ),
              )
            else
              _MissionBanner(mission: activeMission),

            const SizedBox(height: 20),

            // Position actuelle
            if (_lastPosition != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('POSITION ACTUELLE', style: TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: AppColors.primary, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          '${_lastPosition!.latitude.toStringAsFixed(5)}, ${_lastPosition!.longitude.toStringAsFixed(5)}',
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    if (_lastPosition!.speed >= 0) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.speed, color: AppColors.info, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            '${(_lastPosition!.speed * 3.6).toStringAsFixed(0)} km/h',
                            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
            ],

            const Spacer(),

            // Toggle partage
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  Icon(
                    _sharing ? Icons.location_on : Icons.location_off,
                    color: _sharing ? AppColors.primary : AppColors.textSecondary,
                    size: 22,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _sharing ? 'Partage actif' : 'Partager ma position',
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                        ),
                        Text(
                          _sharing ? 'En direct avec le centre' : 'Désactivé',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _sharing,
                    activeThumbColor: AppColors.primary,
                    onChanged: hasActive ? (_) => _toggleSharing(activeMission) : null,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _MissionBanner extends StatelessWidget {
  const _MissionBanner({required this.mission});
  final Shipment mission;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.local_shipping, color: AppColors.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${mission.villeDepart} → ${mission.villeArrivee}',
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                Text(mission.marchandise,
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text('EN COURS', style: TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}
