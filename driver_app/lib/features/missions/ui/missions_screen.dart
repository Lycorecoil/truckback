import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../data/missions_notifier.dart';
import '../domain/shipment.dart';

class MissionsScreen extends ConsumerWidget {
  const MissionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final missionsAsync = ref.watch(missionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes Missions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(missionsProvider),
          ),
        ],
      ),
      body: missionsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: AppColors.error, size: 48),
              const SizedBox(height: 12),
              Text('Erreur de chargement', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(missionsProvider),
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (missions) {
          final myMissions = missions.where((s) =>
            s.statut == 'ACCEPTED' || s.statut == 'IN_PROGRESS'
          ).toList();

          if (myMissions.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.inbox_outlined, color: AppColors.textSecondary, size: 64),
                  const SizedBox(height: 16),
                  Text('Aucune mission assignée', style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: myMissions.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (ctx, i) => _MissionCard(shipment: myMissions[i]),
          );
        },
      ),
    );
  }
}

class _MissionCard extends ConsumerWidget {
  const _MissionCard({required this.shipment});
  final Shipment shipment;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final actionState = ref.watch(missionActionNotifierProvider);
    final isLoading = actionState.isLoading;
    final isInProgress = shipment.statut == 'IN_PROGRESS';

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/missions/${shipment.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${shipment.villeDepart} → ${shipment.villeArrivee}',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  _StatusBadge(statut: shipment.statut),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _InfoChip(label: shipment.marchandise, icon: Icons.inventory_2_outlined),
                  const SizedBox(width: 8),
                  _InfoChip(label: '${shipment.poids} T', icon: Icons.scale_outlined),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _formatDate(shipment.dateAnnonce),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: isLoading ? null : () => _handleAction(ref, context),
                  icon: isLoading
                      ? const SizedBox(width: 16, height: 16,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Icon(isInProgress ? Icons.check_circle_outline : Icons.play_arrow),
                  label: Text(isInProgress ? 'Confirmer la livraison' : 'Démarrer'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isInProgress ? AppColors.primary : AppColors.card,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleAction(WidgetRef ref, BuildContext context) async {
    final notifier = ref.read(missionActionNotifierProvider.notifier);
    if (shipment.statut == 'IN_PROGRESS') {
      await notifier.deliver(shipment.id);
    } else {
      await notifier.start(shipment.id);
    }
    final state = ref.read(missionActionNotifierProvider);
    if (state.hasError && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : ${state.error}'), backgroundColor: AppColors.error),
      );
    }
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.statut});
  final String statut;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (statut) {
      'ACCEPTED'    => ('ACCEPTÉE', AppColors.info),
      'IN_PROGRESS' => ('EN COURS', AppColors.primary),
      'DELIVERED'   => ('LIVRÉE', AppColors.textSecondary),
      'CANCELLED'   => ('ANNULÉE', AppColors.error),
      _             => ('PENDING', AppColors.warning),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label, required this.icon});
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}
