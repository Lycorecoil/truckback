import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../missions/data/missions_notifier.dart';
import '../missions/domain/shipment.dart';
import '../profile/data/profile_repository.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final missionsAsync = ref.watch(missionsProvider);
    final profileAsync  = ref.watch(myProfileProvider);

    final prenom = profileAsync.valueOrNull?.prenom ?? '';
    final nom    = profileAsync.valueOrNull?.nom    ?? '';

    final missions = missionsAsync.valueOrNull ?? [];
    final activeMission = missions.where((s) => s.statut == 'IN_PROGRESS').firstOrNull;
    final recentMissions = missions.where((s) => s.statut != 'PENDING').take(3).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async => ref.invalidate(missionsProvider),
        child: CustomScrollView(
          slivers: [
            // ── AppBar personnalisé ──────────────────────────────────────
            SliverAppBar(
              expandedHeight: 160,
              floating: false,
              pinned: true,
              backgroundColor: AppColors.primary,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primaryDark, AppColors.primary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _greeting(),
                                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      prenom.isNotEmpty ? '$prenom $nom' : 'Chauffeur',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Avatar
                              Container(
                                width: 44, height: 44,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: .2),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.person_rounded, color: Colors.white, size: 24),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    // ── Raccourcis rapides ─────────────────────────────
                    Row(
                      children: [
                        _QuickAction(
                          icon: Icons.local_shipping_rounded,
                          label: 'Mes Missions',
                          color: AppColors.info,
                          onTap: () => context.go('/missions'),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.location_on_rounded,
                          label: 'Tracking GPS',
                          color: AppColors.primary,
                          onTap: () => context.go('/tracking'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ── Mission active ─────────────────────────────────
                    const Text('Mission en cours',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 10),

                    missionsAsync.when(
                      loading: () => const _SkeletonCard(),
                      error:   (e, _) => _EmptyCard(
                        icon: Icons.error_outline,
                        message: 'Erreur de chargement',
                        color: AppColors.error,
                      ),
                      data: (_) => activeMission != null
                          ? _ActiveMissionCard(mission: activeMission)
                          : const _EmptyCard(
                              icon: Icons.inbox_outlined,
                              message: 'Aucune mission en cours',
                              color: AppColors.textSecondary,
                            ),
                    ),

                    const SizedBox(height: 24),

                    // ── Missions récentes ──────────────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Missions récentes',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        TextButton(
                          onPressed: () => context.go('/missions'),
                          child: const Text('Voir tout', style: TextStyle(color: AppColors.primary, fontSize: 13)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    if (missionsAsync.isLoading)
                      Column(children: List.generate(2, (_) => const Padding(
                        padding: EdgeInsets.only(bottom: 10),
                        child: _SkeletonCard(height: 72),
                      )))
                    else if (recentMissions.isEmpty)
                      const _EmptyCard(icon: Icons.history, message: 'Aucune mission récente', color: AppColors.textSecondary)
                    else
                      ...recentMissions.map((m) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _RecentMissionCard(mission: m),
                      )),

                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Bonjour 👋';
    if (h < 18) return 'Bon après-midi 👋';
    return 'Bonsoir 👋';
  }
}

// ── Raccourci rapide ─────────────────────────────────────────────────────────

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .04), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(color: color.withValues(alpha: .12), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: 12),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary)),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Mission active ───────────────────────────────────────────────────────────

class _ActiveMissionCard extends StatelessWidget {
  const _ActiveMissionCard({required this.mission});
  final Shipment mission;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/missions/${mission.id}'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primary, AppColors.primaryLight],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: .3), blurRadius: 16, offset: const Offset(0, 6))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .25),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                      const SizedBox(width: 6),
                      const Text('EN COURS', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 14),
              ],
            ),
            const SizedBox(height: 14),

            // Marchandise
            Text(mission.marchandise,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),

            // Route
            Row(
              children: [
                const Icon(Icons.circle, color: Colors.white, size: 8),
                const SizedBox(width: 8),
                Expanded(
                  child: Text('${mission.villeDepart}, ${mission.paysDepart}',
                    style: const TextStyle(color: Colors.white70, fontSize: 13), overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            Container(
              margin: const EdgeInsets.only(left: 4),
              width: 1, height: 16,
              color: Colors.white38,
            ),
            Row(
              children: [
                const Icon(Icons.location_on_rounded, color: Colors.white, size: 10),
                const SizedBox(width: 6),
                Expanded(
                  child: Text('${mission.villeArrivee}, ${mission.paysArrivee}',
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Info poids
            Row(
              children: [
                const Icon(Icons.scale_outlined, color: Colors.white70, size: 14),
                const SizedBox(width: 6),
                Text('${mission.poids} T · ${mission.marchandise}',
                  style: const TextStyle(color: Colors.white70, fontSize: 12)),
                const Spacer(),
                TextButton(
                  onPressed: () => context.go('/tracking'),
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.white.withValues(alpha: .2),
                    minimumSize: Size.zero,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: const Text('Tracking', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Carte mission récente ────────────────────────────────────────────────────

class _RecentMissionCard extends StatelessWidget {
  const _RecentMissionCard({required this.mission});
  final Shipment mission;

  @override
  Widget build(BuildContext context) {
    final color = statusColor(mission.statut);
    return GestureDetector(
      onTap: () => context.push('/missions/${mission.id}'),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .04), blurRadius: 6)],
        ),
        child: Row(
          children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(color: color.withValues(alpha: .1), borderRadius: BorderRadius.circular(10)),
              child: Icon(Icons.local_shipping_outlined, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(mission.marchandise,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary),
                    overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text('${mission.villeDepart} → ${mission.villeArrivee}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary), overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: color.withValues(alpha: .1), borderRadius: BorderRadius.circular(20)),
              child: Text(statusLabel(mission.statut),
                style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Vide / Erreur ────────────────────────────────────────────────────────────

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.icon, required this.message, required this.color});
  final IconData icon;
  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(icon, color: color.withValues(alpha: .5), size: 36),
          const SizedBox(height: 10),
          Text(message, style: TextStyle(color: color.withValues(alpha: .8), fontSize: 14)),
        ],
      ),
    );
  }
}

// ── Skeleton loader ──────────────────────────────────────────────────────────

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard({this.height = 140});
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt,
        borderRadius: BorderRadius.circular(16),
      ),
    );
  }
}
