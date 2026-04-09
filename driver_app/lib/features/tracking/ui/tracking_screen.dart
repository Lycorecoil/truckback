import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/gps_tracking_notifier.dart';
import '../../../core/services/route_info_provider.dart';
import '../../missions/data/missions_notifier.dart';

class TrackingScreen extends ConsumerStatefulWidget {
  const TrackingScreen({super.key});

  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  final MapController _mapCtrl = MapController();
  bool _mapReady   = false;
  bool _followMode = true; // true = carte suit le chauffeur

  String _formatDuration(Duration d) {
    if (d.inHours >= 1) {
      final h = d.inHours;
      final m = d.inMinutes.remainder(60);
      return m > 0 ? '~${h}h${m.toString().padLeft(2, '0')}' : '~${h}h';
    }
    return '~${d.inMinutes} min';
  }

  void _recenter(Position pos) {
    setState(() => _followMode = true);
    _mapCtrl.move(LatLng(pos.latitude, pos.longitude), 15);
  }

  @override
  Widget build(BuildContext context) {
    final missions = ref.watch(missionsProvider).valueOrNull ?? [];
    final active   = missions.where((s) => s.statut == 'IN_PROGRESS').firstOrNull;
    final tracking = ref.watch(gpsTrackingProvider);
    final lastPos  = tracking.lastPosition;

    // Suivre le chauffeur automatiquement si le mode suivi est actif
    if (lastPos != null && _mapReady && _followMode) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_followMode && mounted) {
          _mapCtrl.move(LatLng(lastPos.latitude, lastPos.longitude), 15);
        }
      });
    }

    final routeAsync = ref.watch(routeInfoProvider);
    final routeInfo  = routeAsync.valueOrNull;

    final speedKmh = lastPos != null && lastPos.speed >= 0
        ? (lastPos.speed * 3.6).toStringAsFixed(0)
        : '0';

    final eta = routeInfo != null ? _formatDuration(routeInfo.duration) : null;

    // Angle de rotation de la flèche (heading en radians)
    // On n'oriente que si vitesse > 2 km/h (heading fiable)
    final heading     = lastPos?.heading ?? 0.0;
    final speed       = lastPos != null && lastPos.speed >= 0 ? lastPos.speed * 3.6 : 0.0;
    final showHeading = speed > 2.0;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // ── Carte plein écran ──────────────────────────────────────────────
          FlutterMap(
            mapController: _mapCtrl,
            options: MapOptions(
              initialCenter: lastPos != null
                  ? LatLng(lastPos.latitude, lastPos.longitude)
                  : const LatLng(12.3569, -1.5352),
              initialZoom: 15,
              onMapReady: () => setState(() => _mapReady = true),
              // Dès que l'utilisateur touche la carte → désactive le suivi auto
              onPositionChanged: (_, hasGesture) {
                if (hasGesture && _followMode) {
                  setState(() => _followMode = false);
                }
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
                userAgentPackageName: 'com.elimmekatruck.driver_app',
                retinaMode: RetinaMode.isHighDensity(context),
              ),
              // Tracé planifié (OSRM) — gris pointillé
              if (routeInfo != null && routeInfo.waypoints.length >= 2)
                PolylineLayer(polylines: [
                  Polyline(
                    points:      routeInfo.waypoints,
                    color:       Colors.grey.shade400,
                    strokeWidth: 5,
                    pattern:     StrokePattern.dashed(segments: [12, 6]),
                  ),
                ]),
              // Tracé parcouru — orange
              if (tracking.route.length >= 2)
                PolylineLayer(polylines: [
                  Polyline(
                    points:      tracking.route,
                    color:       AppColors.primary,
                    strokeWidth: 4,
                  ),
                ]),
              // Marqueur chauffeur — flèche directionnelle
              if (lastPos != null)
                MarkerLayer(markers: [
                  Marker(
                    point:  LatLng(lastPos.latitude, lastPos.longitude),
                    width:  56,
                    height: 56,
                    child: Transform.rotate(
                      // Oriente selon le cap réel si vitesse suffisante,
                      // sinon pointe vers le nord (0°)
                      angle: showHeading ? heading * math.pi / 180 : 0,
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color:       AppColors.primary.withValues(alpha: .4),
                              blurRadius:  14,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        // Icons.navigation_rounded = flèche pleine pointant vers le haut (nord)
                        child: const Icon(
                          Icons.navigation_rounded,
                          color: Colors.white,
                          size:  28,
                        ),
                      ),
                    ),
                  ),
                ]),
            ],
          ),

          // ── Alerte GPS inactif ─────────────────────────────────────────────
          if (!tracking.isTracking)
            Center(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 40),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .15), blurRadius: 24, offset: const Offset(0, 8))],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 60, height: 60,
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: .1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.location_off_rounded, color: AppColors.warning, size: 30),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Localisation inactive',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      active != null
                          ? 'Le GPS démarrera automatiquement\ndès le début de ta mission.'
                          : 'Aucune mission en cours.\nDémarre une mission pour activer le tracking.',
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.5),
                      textAlign: TextAlign.center,
                    ),
                    if (active == null) ...[
                      const SizedBox(height: 16),
                      OutlinedButton(
                        onPressed: () => Geolocator.openLocationSettings(),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 42),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Paramètres localisation'),
                      ),
                    ],
                  ],
                ),
              ),
            ),

          // ── Header ────────────────────────────────────────────────────────
          Positioned(
            top: 0, left: 0, right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    // Titre mission
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .1), blurRadius: 12)],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              tracking.isTracking ? Icons.location_on_rounded : Icons.location_off_rounded,
                              color: tracking.isTracking ? AppColors.success : AppColors.textSecondary,
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                active != null
                                    ? '${active.villeDepart} → ${active.villeArrivee}'
                                    : 'Tracking GPS',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Boussole Nord
                    _CompassButton(mapController: _mapCtrl),
                  ],
                ),
              ),
            ),
          ),

          // ── Bouton recentrer (flottant, au-dessus des chips) ──────────────
          if (lastPos != null && !_followMode)
            Positioned(
              bottom: 104, right: 16,
              child: GestureDetector(
                onTap: () => _recenter(lastPos),
                child: Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: .18), blurRadius: 16, offset: const Offset(0, 4)),
                    ],
                  ),
                  child: const Icon(Icons.my_location_rounded, color: AppColors.primary, size: 22),
                ),
              ),
            ),

          // ── Chips infos (bas gauche) ───────────────────────────────────────
          if (tracking.isTracking && lastPos != null)
            Positioned(
              bottom: 32, left: 16, right: 16,
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    _FloatingChip(icon: Icons.speed_rounded,    color: AppColors.primary,       label: '$speedKmh km/h'),
                    const SizedBox(width: 8),
                    if (routeInfo != null) ...[
                      _FloatingChip(icon: Icons.straighten_rounded, color: AppColors.success, label: '${routeInfo.distanceKm.toStringAsFixed(0)} km'),
                      const SizedBox(width: 8),
                      _FloatingChip(icon: Icons.timer_outlined,     color: AppColors.info,    label: eta ?? '...'),
                      const SizedBox(width: 8),
                    ] else if (routeAsync.isLoading) ...[
                      _FloatingChip(icon: Icons.timer_outlined, color: AppColors.textSecondary, label: '...'),
                      const SizedBox(width: 8),
                    ],
                  ],
                ),
              ),
            ),

          // ── Erreur ────────────────────────────────────────────────────────
          if (tracking.error != null)
            Positioned(
              bottom: 90, left: 16, right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(12)),
                child: Text(tracking.error!, style: const TextStyle(color: Colors.white, fontSize: 13)),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Boussole Nord ─────────────────────────────────────────────────────────────

class _CompassButton extends StatefulWidget {
  const _CompassButton({required this.mapController});
  final MapController mapController;

  @override
  State<_CompassButton> createState() => _CompassButtonState();
}

class _CompassButtonState extends State<_CompassButton> {
  double _rotation = 0;

  @override
  void initState() {
    super.initState();
    widget.mapController.mapEventStream.listen((event) {
      if (mounted) setState(() => _rotation = widget.mapController.camera.rotation);
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      // Tap → remet la carte face au nord
      onTap: () => widget.mapController.rotate(0),
      child: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: Colors.white, shape: BoxShape.circle,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .1), blurRadius: 8)],
        ),
        child: Center(
          child: Transform.rotate(
            angle: -_rotation * math.pi / 180,
            child: SizedBox(
              width: 16, height: 24,
              child: CustomPaint(painter: _CompassNeedlePainter()),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Peintre aiguille boussole ─────────────────────────────────────────────────

class _CompassNeedlePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final mid = size.height / 2;

    // Flèche rouge → nord (pointe vers le haut)
    canvas.drawPath(
      ui.Path()
        ..moveTo(cx, 0)
        ..lineTo(cx + 5, mid)
        ..lineTo(cx, mid - 2)
        ..lineTo(cx - 5, mid)
        ..close(),
      Paint()..color = Colors.red..style = PaintingStyle.fill,
    );

    // Flèche grise → sud (pointe vers le bas)
    canvas.drawPath(
      ui.Path()
        ..moveTo(cx, size.height)
        ..lineTo(cx + 5, mid)
        ..lineTo(cx, mid + 2)
        ..lineTo(cx - 5, mid)
        ..close(),
      Paint()..color = Colors.grey.shade400..style = PaintingStyle.fill,
    );
  }

  @override
  bool shouldRepaint(_CompassNeedlePainter old) => false;
}

// ── Chip flottant ─────────────────────────────────────────────────────────────

class _FloatingChip extends StatelessWidget {
  const _FloatingChip({required this.icon, required this.color, required this.label});
  final IconData icon;
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .12), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 15),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}

// ── Pastille pulsante ─────────────────────────────────────────────────────────

class _PulseDot extends StatefulWidget {
  const _PulseDot({required this.color});
  final Color color;

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;
  late Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl    = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
    _scale   = Tween<double>(begin: 1, end: 2.4).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
    _opacity = Tween<double>(begin: .7, end: 0).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 16, height: 16,
      child: Stack(
        alignment: Alignment.center,
        children: [
          AnimatedBuilder(
            animation: _ctrl,
            builder: (_, __) => Transform.scale(
              scale: _scale.value,
              child: Opacity(
                opacity: _opacity.value,
                child: Container(width: 7, height: 7, decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle)),
              ),
            ),
          ),
          Container(width: 7, height: 7, decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle)),
        ],
      ),
    );
  }
}
