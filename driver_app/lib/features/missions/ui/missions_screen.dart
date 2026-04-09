import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../data/missions_notifier.dart';
import '../domain/shipment.dart';

// ── Définition des filtres ────────────────────────────────────────────────────

class _Filter {
  const _Filter(this.label, this.statut, this.icon, this.color);
  final String   label;
  final String?  statut; // null = Tout
  final IconData icon;
  final Color    color;
}

const _filters = [
  _Filter('Tout',       null,          Icons.apps_rounded,                AppColors.textPrimary),
  _Filter('En cours',   'IN_PROGRESS', Icons.directions_car_rounded,      AppColors.statusInProgress),
  _Filter('Acceptées',  'ACCEPTED',    Icons.check_circle_outline_rounded, AppColors.info),
  _Filter('En attente', 'PENDING',     Icons.hourglass_top_rounded,       AppColors.warning),
  _Filter('Livrées',    'DELIVERED',   Icons.flag_rounded,                AppColors.success),
];

// ── Écran principal ───────────────────────────────────────────────────────────

class MissionsScreen extends ConsumerStatefulWidget {
  const MissionsScreen({super.key});

  @override
  ConsumerState<MissionsScreen> createState() => _MissionsScreenState();
}

class _MissionsScreenState extends ConsumerState<MissionsScreen> {
  int _selected = 0;

  @override
  Widget build(BuildContext context) {
    final missionsAsync = ref.watch(missionsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // ── Header ─────────────────────────────────────────────────────────
          _Header(missionsAsync: missionsAsync),

          // ── Chips filtre ───────────────────────────────────────────────────
          missionsAsync.when(
            loading: () => const _FilterChipsRow(missions: [], selected: 0, onSelect: null),
            error: (_, __) => const SizedBox.shrink(),
            data: (missions) => _FilterChipsRow(
              missions:  missions,
              selected:  _selected,
              onSelect:  (i) => setState(() => _selected = i),
            ),
          ),

          // ── Liste ──────────────────────────────────────────────────────────
          Expanded(
            child: missionsAsync.when(
              loading: () => const _SkeletonMissionList(),
              error: (e, _) => _ErrorView(error: e, onRetry: () => ref.invalidate(missionsProvider)),
              data: (missions) {
                final statut   = _filters[_selected].statut;
                final filtered = statut == null
                    ? missions
                    : missions.where((m) => m.statut == statut).toList();
                return _MissionList(
                  missions:  filtered,
                  onRefresh: () async => ref.invalidate(missionsProvider),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.missionsAsync});
  final AsyncValue<List<Shipment>> missionsAsync;

  @override
  Widget build(BuildContext context) {
    final total     = missionsAsync.valueOrNull?.length ?? 0;
    final inProgress = missionsAsync.valueOrNull?.where((m) => m.statut == 'IN_PROGRESS').length ?? 0;

    return Container(
      color: AppColors.surface,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16,
        left: 20, right: 20, bottom: 16,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Mes Missions',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 2),
                Text(
                  inProgress > 0
                      ? '$total missions · $inProgress en cours'
                      : '$total missions',
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Chips filtre ──────────────────────────────────────────────────────────────

class _FilterChipsRow extends StatelessWidget {
  const _FilterChipsRow({required this.missions, required this.selected, required this.onSelect});
  final List<Shipment> missions;
  final int selected;
  final void Function(int)? onSelect;

  int _count(String? statut) => statut == null
      ? missions.length
      : missions.where((m) => m.statut == statut).length;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.only(bottom: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: List.generate(_filters.length, (i) {
            final f       = _filters[i];
            final isActive = i == selected;
            final count   = _count(f.statut);
            final color   = f.color == AppColors.textPrimary ? AppColors.primary : f.color;

            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: onSelect != null ? () => onSelect!(i) : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: isActive ? color : Colors.transparent,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isActive ? color : AppColors.border,
                      width: isActive ? 0 : 1.5,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        f.icon,
                        size: 14,
                        color: isActive ? Colors.white : AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        f.label,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isActive ? Colors.white : AppColors.textSecondary,
                        ),
                      ),
                      if (count > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: isActive
                                ? Colors.white.withValues(alpha: .25)
                                : color.withValues(alpha: .12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '$count',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isActive ? Colors.white : color,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

// ── Liste ─────────────────────────────────────────────────────────────────────

class _MissionList extends StatelessWidget {
  const _MissionList({required this.missions, required this.onRefresh});
  final List<Shipment> missions;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    if (missions.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: AppColors.textSecondary.withValues(alpha: .06),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.local_shipping_outlined, size: 38,
                color: AppColors.textSecondary.withValues(alpha: .4)),
            ),
            const SizedBox(height: 16),
            const Text('Aucune mission', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            const Text('Rien ici pour le moment', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        itemCount: missions.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) => _MissionCard(mission: missions[i]),
      ),
    );
  }
}

// ── Skeleton chargement ───────────────────────────────────────────────────────

class _SkeletonMissionList extends StatefulWidget {
  const _SkeletonMissionList();

  @override
  State<_SkeletonMissionList> createState() => _SkeletonMissionListState();
}

class _SkeletonMissionListState extends State<_SkeletonMissionList>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _opacity = Tween<double>(begin: .35, end: .75).animate(_ctrl);
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  Widget _box(double w, double h, {double radius = 8}) => Container(
    width: w, height: h,
    decoration: BoxDecoration(
      color: AppColors.surfaceAlt,
      borderRadius: BorderRadius.circular(radius),
    ),
  );

  Widget _skeletonCard() => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _box(44, 44, radius: 12),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _box(120, 14),
          const SizedBox(height: 6),
          _box(80, 11),
        ])),
        const SizedBox(width: 8),
        _box(64, 24, radius: 20),
      ]),
      const SizedBox(height: 14),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _box(40, 10), const SizedBox(height: 5), _box(70, 13), const SizedBox(height: 3), _box(50, 10),
          ])),
          const SizedBox(width: 16),
          _box(40, 14),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            _box(40, 10), const SizedBox(height: 5), _box(70, 13), const SizedBox(height: 3), _box(50, 10),
          ])),
        ]),
      ),
    ]),
  );

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: _opacity,
    child: ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      itemCount: 4,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => _skeletonCard(),
    ),
  );
}

// ── Error view ────────────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});
  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 48),
            const SizedBox(height: 12),
            Text('$error', style: const TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(minimumSize: const Size(160, 44)),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Card mission ──────────────────────────────────────────────────────────────

class _MissionCard extends ConsumerWidget {
  const _MissionCard({required this.mission});
  final Shipment mission;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final color       = statusColor(mission.statut);
    final label       = statusLabel(mission.statut);
    final actionState = ref.watch(missionActionNotifierProvider);

    return GestureDetector(
      onTap: () => context.push('/missions/${mission.id}'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // En-tête
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(color: color.withValues(alpha: .1), borderRadius: BorderRadius.circular(12)),
                  child: Icon(Icons.local_shipping_outlined, color: color, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(mission.marchandise,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                        overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 2),
                      Text('${mission.poids} T · ${mission.emballage ?? ""}',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: color.withValues(alpha: .1), borderRadius: BorderRadius.circular(20)),
                  child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 14),
            // Route
            _RouteRow(mission: mission),

            // Boutons action
            if (mission.statut == 'ACCEPTED' || mission.statut == 'IN_PROGRESS') ...[
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Row(
                children: [
                  if (mission.statut == 'IN_PROGRESS') ...[
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.go('/tracking'),
                        icon: const Icon(Icons.location_on_rounded, size: 16),
                        label: const Text('Tracking'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 40),
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          textStyle: const TextStyle(fontSize: 13),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: actionState.isLoading ? null : () => _handleAction(ref, context),
                      icon: actionState.isLoading
                          ? const SizedBox(width: 14, height: 14,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Icon(mission.statut == 'IN_PROGRESS'
                              ? Icons.check_circle_outline : Icons.play_arrow_rounded, size: 16),
                      label: Text(mission.statut == 'IN_PROGRESS' ? 'Livrer' : 'Démarrer'),
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(0, 40),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        backgroundColor: mission.statut == 'IN_PROGRESS' ? AppColors.success : AppColors.primary,
                        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _handleAction(WidgetRef ref, BuildContext context) async {
    final notifier = ref.read(missionActionNotifierProvider.notifier);
    if (mission.statut == 'IN_PROGRESS') {
      await notifier.deliver(mission.id);
    } else {
      await notifier.start(mission.id);
    }
    final s = ref.read(missionActionNotifierProvider);
    if (s.hasError && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : ${s.error}'), backgroundColor: AppColors.error),
      );
    }
  }
}

// ── Route row ─────────────────────────────────────────────────────────────────

class _RouteRow extends StatelessWidget {
  const _RouteRow({required this.mission});
  final Shipment mission;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // Départ
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(width: 8, height: 8, decoration: BoxDecoration(color: AppColors.success, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1.5))),
                  const SizedBox(width: 5),
                  const Text('Départ', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                ]),
                const SizedBox(height: 3),
                Text(mission.villeDepart,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary),
                  overflow: TextOverflow.ellipsis),
                Text(mission.paysDepart,
                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          // Flèche centrale
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Column(
              children: [
                Container(height: 1, width: 32, color: AppColors.border),
                const SizedBox(height: 4),
                const Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.textSecondary),
              ],
            ),
          ),
          // Arrivée
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                  const Text('Arrivée', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                  const SizedBox(width: 5),
                  Container(width: 8, height: 8, decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1.5))),
                ]),
                const SizedBox(height: 3),
                Text(mission.villeArrivee,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary),
                  overflow: TextOverflow.ellipsis, textAlign: TextAlign.end),
                Text(mission.paysArrivee,
                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  overflow: TextOverflow.ellipsis, textAlign: TextAlign.end),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
