import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme/app_theme.dart';
import '../data/missions_notifier.dart';
import '../domain/shipment.dart';

// Coordonnées approximatives par ville (pour la mini-carte)
const _cityCoords = <String, LatLng>{
  'Ouaga':        LatLng(12.3569, -1.5352),
  'Ouagadougou':  LatLng(12.3569, -1.5352),
  'Abidjan':      LatLng(5.3600, -4.0083),
  'Dakar':        LatLng(14.7167, -17.4677),
  'Bamako':       LatLng(12.6392, -8.0029),
  'Lomé':         LatLng(6.1375,   1.2123),
  'Cotonou':      LatLng(6.3703,   2.3912),
  'Niamey':       LatLng(13.5137,   2.1098),
  'Accra':        LatLng(5.6037,  -0.1870),
};

LatLng _coordsFor(String city) =>
    _cityCoords[city] ?? const LatLng(12.3569, -1.5352);

class MissionDetailScreen extends ConsumerWidget {
  const MissionDetailScreen({super.key, required this.missionId});
  final String missionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final missionAsync = ref.watch(missionDetailProvider(missionId));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: missionAsync.when(
        loading: () => const _DetailSkeleton(),
        error:   (e, _) => _DetailError(onBack: () => context.pop()),
        data:    (s) => _MissionDetail(shipment: s),
      ),
    );
  }
}

class _MissionDetail extends ConsumerWidget {
  const _MissionDetail({required this.shipment});
  final Shipment shipment;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final actionState  = ref.watch(missionActionNotifierProvider);
    final isInProgress = shipment.statut == 'IN_PROGRESS';
    final canAct       = shipment.statut == 'ACCEPTED' || shipment.statut == 'IN_PROGRESS';

    final departCoords  = _coordsFor(shipment.villeDepart);
    final arriveeCoords = _coordsFor(shipment.villeArrivee);
    final centerLat     = (departCoords.latitude  + arriveeCoords.latitude)  / 2;
    final centerLng     = (departCoords.longitude + arriveeCoords.longitude) / 2;

    return Column(
      children: [
        // ── Carte mini (250px) ──────────────────────────────────────────
        SizedBox(
          height: 240,
          child: Stack(
            children: [
              FlutterMap(
                options: MapOptions(
                  initialCenter: LatLng(centerLat, centerLng),
                  initialZoom: 5,
                  interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                    subdomains: const ['a', 'b', 'c', 'd'],
                    userAgentPackageName: 'com.elimmekatruck.driver_app',
                    retinaMode: RetinaMode.isHighDensity(context),
                  ),
                  PolylineLayer(polylines: [
                    Polyline<Object>(
                      points: [departCoords, arriveeCoords],
                      color: AppColors.primary,
                      strokeWidth: 3,
                      pattern: StrokePattern.dashed(segments: [12, 6]),
                    ),
                  ]),
                  MarkerLayer(markers: [
                    Marker(
                      point: departCoords,
                      width: 32, height: 32,
                      child: Container(
                        decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
                        child: const Icon(Icons.trip_origin_rounded, color: Colors.white, size: 18),
                      ) as Widget,
                    ),
                    Marker(
                      point: arriveeCoords,
                      width: 32, height: 32,
                      child: Container(
                        decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                        child: const Icon(Icons.location_on_rounded, color: Colors.white, size: 18),
                      ) as Widget,
                    ),
                  ]),
                ],
              ),
              // Bouton retour
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
                left: 12,
                child: GestureDetector(
                  onTap: () => context.pop(),
                  child: Container(
                    width: 38, height: 38,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .12), blurRadius: 8)],
                    ),
                    child: const Icon(Icons.arrow_back_rounded, size: 20, color: AppColors.textPrimary),
                  ),
                ),
              ),
              // Badge statut
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .1), blurRadius: 8)],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 7, height: 7,
                        margin: const EdgeInsets.only(right: 6),
                        decoration: BoxDecoration(color: statusColor(shipment.statut), shape: BoxShape.circle),
                      ),
                      Text(statusLabel(shipment.statut),
                        style: TextStyle(color: statusColor(shipment.statut), fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // ── Infos scrollables ────────────────────────────────────────────
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ID mission
                Text(
                  'Mission #${shipment.id.substring(0, 8).toUpperCase()}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: .5),
                ),
                const SizedBox(height: 6),
                Text(shipment.marchandise,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 16),

                // Carte route
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      _RouteRow(
                        icon: Icons.trip_origin_rounded,
                        color: AppColors.success,
                        label: 'Départ',
                        city: shipment.villeDepart,
                        country: shipment.paysDepart,
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        child: Row(children: [
                          Container(width: 2, height: 24, margin: const EdgeInsets.only(left: 9), color: AppColors.border),
                        ]),
                      ),
                      _RouteRow(
                        icon: Icons.location_on_rounded,
                        color: AppColors.primary,
                        label: 'Arrivée',
                        city: shipment.villeArrivee,
                        country: shipment.paysArrivee,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Grille infos
                Row(children: [
                  Expanded(child: _InfoTile(icon: Icons.scale_outlined, label: 'Poids', value: '${shipment.poids} T')),
                  const SizedBox(width: 10),
                  Expanded(child: _InfoTile(icon: Icons.inventory_2_outlined, label: 'Emballage', value: shipment.emballage ?? '—')),
                ]),
                const SizedBox(height: 10),
                if (shipment.quantite != null)
                  Row(children: [
                    Expanded(child: _InfoTile(icon: Icons.numbers_outlined, label: 'Quantité', value: '${shipment.quantite}')),
                    const SizedBox(width: 10),
                    Expanded(child: _InfoTile(icon: Icons.calendar_today_outlined, label: 'Date', value: _fmtDate(shipment.dateAnnonce))),
                  ]),
                if (shipment.commentaireGeneral != null) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('NOTE', style: TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: .8)),
                        const SizedBox(height: 6),
                        Text(shipment.commentaireGeneral!, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, height: 1.4)),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 80),
              ],
            ),
          ),
        ),

        // ── Bouton action ────────────────────────────────────────────────
        if (canAct)
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: const Border(top: BorderSide(color: AppColors.border)),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .06), blurRadius: 12, offset: const Offset(0, -4))],
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  if (isInProgress) ...[
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () { context.pop(); context.go('/tracking'); },
                        icon: const Icon(Icons.location_on_rounded, size: 18),
                        label: const Text('Tracking'),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    flex: isInProgress ? 2 : 1,
                    child: ElevatedButton.icon(
                      onPressed: actionState.isLoading ? null : () => _handleAction(ref, context),
                      icon: actionState.isLoading
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Icon(isInProgress ? Icons.check_circle_rounded : Icons.play_arrow_rounded, size: 20),
                      label: Text(isInProgress ? 'Confirmer la livraison' : 'Démarrer la mission'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isInProgress ? AppColors.success : AppColors.primary,
                      ),
                    ),
                  ),
                ],
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
    final s = ref.read(missionActionNotifierProvider);
    if (s.hasError && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur : ${s.error}'), backgroundColor: AppColors.error),
      );
    } else if (!s.hasError && context.mounted) {
      context.pop();
    }
  }

  String _fmtDate(String d) {
    try {
      final dt = DateTime.parse(d);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) { return d; }
  }
}

// ── Skeleton détail ───────────────────────────────────────────────────────────

class _DetailSkeleton extends StatefulWidget {
  const _DetailSkeleton();
  @override
  State<_DetailSkeleton> createState() => _DetailSkeletonState();
}

class _DetailSkeletonState extends State<_DetailSkeleton>
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

  Widget _box(double w, double h, {double r = 8, Color? color}) => Container(
    width: w, height: h,
    decoration: BoxDecoration(
      color: color ?? AppColors.surfaceAlt,
      borderRadius: BorderRadius.circular(r),
    ),
  );

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: _opacity,
    child: Column(children: [
      // Carte placeholder
      _box(double.infinity, 240, r: 0, color: AppColors.surfaceAlt),
      Expanded(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _box(80, 11), const SizedBox(height: 8),
            _box(200, 22),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
              child: Column(children: [
                Row(children: [_box(20, 20, r: 10), const SizedBox(width: 12), Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_box(40, 10), const SizedBox(height: 5), _box(100, 14), const SizedBox(height: 3), _box(70, 11)])]),
                const SizedBox(height: 12),
                Row(children: [_box(20, 20, r: 10), const SizedBox(width: 12), Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_box(40, 10), const SizedBox(height: 5), _box(100, 14), const SizedBox(height: 3), _box(70, 11)])]),
              ]),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _box(double.infinity, 70, r: 14)),
              const SizedBox(width: 10),
              Expanded(child: _box(double.infinity, 70, r: 14)),
            ]),
          ]),
        ),
      ),
    ]),
  );
}

// ── Erreur détail ─────────────────────────────────────────────────────────────

class _DetailError extends StatelessWidget {
  const _DetailError({required this.onBack});
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    body: SafeArea(
      child: Column(children: [
        // Bouton retour
        Align(
          alignment: Alignment.centerLeft,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: GestureDetector(
              onTap: onBack,
              child: Container(
                width: 38, height: 38,
                decoration: BoxDecoration(color: AppColors.surface, shape: BoxShape.circle, border: Border.all(color: AppColors.border)),
                child: const Icon(Icons.arrow_back_rounded, size: 20, color: AppColors.textPrimary),
              ),
            ),
          ),
        ),
        Expanded(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  width: 72, height: 72,
                  decoration: BoxDecoration(color: AppColors.textSecondary.withValues(alpha: .08), shape: BoxShape.circle),
                  child: const Icon(Icons.cloud_off_rounded, size: 34, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 16),
                const Text('Détail indisponible',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 6),
                const Text('Cette mission n\'est pas disponible hors connexion.',
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
                  textAlign: TextAlign.center),
                const SizedBox(height: 24),
                OutlinedButton.icon(
                  onPressed: onBack,
                  icon: const Icon(Icons.arrow_back_rounded, size: 16),
                  label: const Text('Retour'),
                  style: OutlinedButton.styleFrom(minimumSize: const Size(140, 44)),
                ),
              ]),
            ),
          ),
        ),
      ]),
    ),
  );
}

// ── Route row ─────────────────────────────────────────────────────────────────

class _RouteRow extends StatelessWidget {
  const _RouteRow({required this.icon, required this.color, required this.label, required this.city, required this.country});
  final IconData icon;
  final Color color;
  final String label;
  final String city;
  final String country;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 20, height: 20, decoration: BoxDecoration(color: color.withValues(alpha: .15), shape: BoxShape.circle),
          child: Icon(icon, color: color, size: 12)),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: .6)),
            Text(city, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
            Text(country, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
        ),
      ],
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(width: 34, height: 34, decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: .08), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: AppColors.primary, size: 18)),
          const SizedBox(width: 10),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w600)),
              Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 13), overflow: TextOverflow.ellipsis),
            ],
          )),
        ],
      ),
    );
  }
}
