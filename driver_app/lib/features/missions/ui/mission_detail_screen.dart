import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../data/missions_notifier.dart';
import '../data/missions_repository.dart';
import '../domain/shipment.dart';

class MissionDetailScreen extends ConsumerWidget {
  const MissionDetailScreen({super.key, required this.missionId});
  final String missionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final missionAsync = ref.watch(
      FutureProvider((ref) => ref.watch(missionsRepositoryProvider).getMission(missionId)),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Détail Mission'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: missionAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(child: Text('Erreur : $e', style: const TextStyle(color: AppColors.error))),
        data: (s) => _MissionDetail(shipment: s),
      ),
    );
  }
}

class _MissionDetail extends ConsumerWidget {
  const _MissionDetail({required this.shipment});
  final Shipment shipment;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final actionState = ref.watch(missionActionNotifierProvider);
    final isLoading = actionState.isLoading;
    final isInProgress = shipment.statut == 'IN_PROGRESS';
    final canAct = shipment.statut == 'ACCEPTED' || shipment.statut == 'IN_PROGRESS';

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Banner Mission en cours
                if (isInProgress)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.local_shipping, color: AppColors.primary, size: 16),
                        const SizedBox(width: 8),
                        Text('Mission en cours', style: TextStyle(
                          color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 13)),
                      ],
                    ),
                  ),

                // Route card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('ORIGINE', style: TextStyle(
                                  color: AppColors.textSecondary, fontSize: 10,
                                  fontWeight: FontWeight.w700, letterSpacing: 1)),
                                const SizedBox(height: 4),
                                Text(shipment.villeDepart,
                                  style: Theme.of(context).textTheme.headlineMedium),
                                Text(shipment.paysDepart,
                                  style: Theme.of(context).textTheme.bodyMedium),
                              ],
                            ),
                          ),
                          Column(
                            children: [
                              const Icon(Icons.arrow_forward, color: AppColors.textSecondary),
                              Container(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                width: 32, height: 1,
                                color: AppColors.border,
                              ),
                            ],
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('DESTINATION', style: TextStyle(
                                  color: AppColors.textSecondary, fontSize: 10,
                                  fontWeight: FontWeight.w700, letterSpacing: 1)),
                                const SizedBox(height: 4),
                                Text(shipment.villeArrivee,
                                  style: Theme.of(context).textTheme.headlineMedium,
                                  textAlign: TextAlign.end),
                                Text(shipment.paysArrivee,
                                  style: Theme.of(context).textTheme.bodyMedium,
                                  textAlign: TextAlign.end),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Infos cargo
                Row(
                  children: [
                    Expanded(child: _InfoCard(label: 'POIDS', value: '${shipment.poids} T', icon: Icons.scale_outlined)),
                    const SizedBox(width: 12),
                    Expanded(child: _InfoCard(label: 'TYPE', value: shipment.marchandise, icon: Icons.inventory_2_outlined)),
                  ],
                ),

                const SizedBox(height: 12),

                if (shipment.prixTransport != null)
                  _InfoCard(
                    label: 'PRIX TRANSPORT',
                    value: '${shipment.prixTransport!.toStringAsFixed(0)} FCFA',
                    icon: Icons.payments_outlined,
                    fullWidth: true,
                  ),

                if (shipment.commentaireGeneral != null) ...[
                  const SizedBox(height: 12),
                  _InfoCard(
                    label: 'COMMENTAIRE',
                    value: shipment.commentaireGeneral!,
                    icon: Icons.notes_outlined,
                    fullWidth: true,
                  ),
                ],
              ],
            ),
          ),
        ),

        // Bouton action
        if (canAct)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: SafeArea(
              top: false,
              child: ElevatedButton.icon(
                onPressed: isLoading ? null : () => _handleAction(ref, context),
                icon: isLoading
                    ? const SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Icon(isInProgress ? Icons.check_circle : Icons.play_arrow),
                label: Text(isInProgress ? 'CONFIRMER LA LIVRAISON' : 'DÉMARRER LA MISSION'),
              ),
            ),
          ),
      ],
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
    } else if (!state.hasError && context.mounted) {
      context.pop();
    }
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.label, required this.value, required this.icon, this.fullWidth = false});
  final String label;
  final String value;
  final IconData icon;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.textSecondary, size: 18),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: .8)),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15)),
            ],
          ),
        ],
      ),
    );
  }
}
