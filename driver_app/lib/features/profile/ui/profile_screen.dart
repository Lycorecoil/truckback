import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/data/auth_notifier.dart';
import '../data/profile_repository.dart';
import '../domain/driver.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myProfileProvider);
    final truckAsync   = ref.watch(myTruckProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mon Profil'),
        backgroundColor: AppColors.surface,
      ),
      body: profileAsync.when(
        loading: () => const _ProfileSkeleton(),
        error:   (e, _) => _ProfileError(onRetry: () => ref.invalidate(myProfileProvider)),
        data:    (d) => _ProfileContent(driver: d, truck: truckAsync.valueOrNull),
      ),
    );
  }
}

class _ProfileContent extends ConsumerStatefulWidget {
  const _ProfileContent({required this.driver, this.truck});
  final Driver driver;
  final Truck? truck;

  @override
  ConsumerState<_ProfileContent> createState() => _ProfileContentState();
}

class _ProfileContentState extends ConsumerState<_ProfileContent> {
  late final TextEditingController _phoneCtrl;
  bool _editing = false;
  bool _saving  = false;

  @override
  void initState() {
    super.initState();
    _phoneCtrl = TextEditingController(text: widget.driver.telephone);
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _savePhone() async {
    setState(() => _saving = true);
    try {
      await ref.read(profileRepositoryProvider).updatePhone(_phoneCtrl.text.trim());
      ref.invalidate(myProfileProvider);
      setState(() => _editing = false);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur : $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.driver;
    final (driverStatusLabel, driverStatusColor) = switch (d.statut) {
      'AVAILABLE' => ('Disponible', AppColors.success),
      'BUSY'      => ('En mission', AppColors.primary),
      'SUSPENDED' => ('Suspendu',   AppColors.error),
      _           => (d.statut,     AppColors.textSecondary),
    };

    return SingleChildScrollView(
      child: Column(
        children: [
          // ── Header orange ────────────────────────────────────────────
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primaryDark, AppColors.primary],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
            ),
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
            child: Column(
              children: [
                // Avatar
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .15), blurRadius: 16)],
                  ),
                  child: Center(
                    child: Text(
                      '${d.prenom.isNotEmpty ? d.prenom[0] : ''}${d.nom.isNotEmpty ? d.nom[0] : ''}'.toUpperCase(),
                      style: const TextStyle(color: AppColors.primary, fontSize: 28, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text('${d.prenom} ${d.nom}',
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(width: 7, height: 7, decoration: BoxDecoration(color: driverStatusColor, shape: BoxShape.circle)),
                      const SizedBox(width: 7),
                      Text(driverStatusLabel, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Infos ────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('INFORMATIONS', style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .8)),
                const SizedBox(height: 10),

                Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      _InfoTile(icon: Icons.email_outlined, label: 'Email', value: d.email),
                      const Divider(height: 1, indent: 56),
                      _InfoTile(icon: Icons.badge_outlined, label: 'N° Permis', value: d.numeroPermis),
                      const Divider(height: 1, indent: 56),

                      // Téléphone éditable
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Row(
                          children: [
                            Container(
                              width: 36, height: 36,
                              decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: .1), borderRadius: BorderRadius.circular(8)),
                              child: const Icon(Icons.phone_outlined, color: AppColors.primary, size: 18),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _editing
                                  ? TextField(
                                      controller: _phoneCtrl,
                                      keyboardType: TextInputType.phone,
                                      autofocus: true,
                                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w500),
                                      decoration: const InputDecoration(
                                        contentPadding: EdgeInsets.zero,
                                        isDense: true,
                                        border: InputBorder.none,
                                        enabledBorder: InputBorder.none,
                                        focusedBorder: InputBorder.none,
                                        filled: false,
                                      ),
                                    )
                                  : Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Téléphone', style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                                        const SizedBox(height: 1),
                                        Text(d.telephone, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15)),
                                      ],
                                    ),
                            ),
                            if (_editing) ...[
                              TextButton(
                                onPressed: () => setState(() => _editing = false),
                                child: const Text('Annuler', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                              ),
                              _saving
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                                  : TextButton(
                                      onPressed: _savePhone,
                                      child: const Text('OK', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                                    ),
                            ] else
                              IconButton(
                                icon: const Icon(Icons.edit_outlined, color: AppColors.textSecondary, size: 18),
                                onPressed: () => setState(() => _editing = true),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),
                const Text('MON CAMION', style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .8)),
                const SizedBox(height: 10),
                widget.truck != null
                    ? Container(
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            _InfoTile(icon: Icons.local_shipping_rounded, label: 'Immatriculation', value: widget.truck!.immatriculation),
                            const Divider(height: 1, indent: 56),
                            _InfoTile(icon: Icons.directions_car_rounded, label: 'Véhicule', value: '${widget.truck!.marque} ${widget.truck!.modele}'),
                            const Divider(height: 1, indent: 56),
                            _InfoTile(icon: Icons.scale_rounded, label: 'Capacité', value: '${widget.truck!.capacite.toStringAsFixed(0)} T'),
                            const Divider(height: 1, indent: 56),
                            _InfoTile(
                              icon: Icons.circle,
                              label: 'Statut',
                              value: switch (widget.truck!.statut) {
                                'AVAILABLE'   => 'Disponible',
                                'BUSY'        => 'En mission',
                                'MAINTENANCE' => 'En maintenance',
                                _             => widget.truck!.statut,
                              },
                            ),
                          ],
                        ),
                      )
                    : Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.local_shipping_outlined, color: AppColors.textSecondary, size: 20),
                            SizedBox(width: 10),
                            Text('Aucun camion assigné', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                          ],
                        ),
                      ),

                const SizedBox(height: 24),
                const Text('COMPTE', style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .8)),
                const SizedBox(height: 10),

                // Déconnexion
                GestureDetector(
                  onTap: () => _confirmLogout(context, ref),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(color: AppColors.error.withValues(alpha: .1), borderRadius: BorderRadius.circular(8)),
                          child: const Icon(Icons.logout_rounded, color: AppColors.error, size: 18),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(child: Text('Se déconnecter', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600, fontSize: 15))),
                        const Icon(Icons.chevron_right_rounded, color: AppColors.error, size: 20),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Se déconnecter ?', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        content: const Text('Vous serez redirigé vers l\'écran de connexion.', style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(authNotifierProvider.notifier).logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              minimumSize: const Size(80, 38),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Déconnexion'),
          ),
        ],
      ),
    );
  }
}

// ── Skeleton profil ───────────────────────────────────────────────────────────

class _ProfileSkeleton extends StatefulWidget {
  const _ProfileSkeleton();

  @override
  State<_ProfileSkeleton> createState() => _ProfileSkeletonState();
}

class _ProfileSkeletonState extends State<_ProfileSkeleton>
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
      color: Colors.white.withValues(alpha: .4),
      borderRadius: BorderRadius.circular(radius),
    ),
  );

  Widget _boxGrey(double w, double h, {double radius = 8}) => Container(
    width: w, height: h,
    decoration: BoxDecoration(
      color: AppColors.surfaceAlt,
      borderRadius: BorderRadius.circular(radius),
    ),
  );

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: _opacity,
    child: SingleChildScrollView(
      child: Column(children: [
        // Header
        Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [AppColors.primaryDark, AppColors.primary],
              begin: Alignment.topLeft, end: Alignment.bottomRight,
            ),
          ),
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
          child: Column(children: [
            Container(width: 80, height: 80,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: .3), shape: BoxShape.circle)),
            const SizedBox(height: 14),
            _box(130, 18, radius: 6),
            const SizedBox(height: 10),
            _box(80, 26, radius: 20),
          ]),
        ),
        // Info tiles
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _boxGrey(60, 11),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
              child: Column(children: List.generate(3, (i) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(children: [
                  _boxGrey(36, 36, radius: 8),
                  const SizedBox(width: 12),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    _boxGrey(50, 10), const SizedBox(height: 5), _boxGrey(110, 13),
                  ]),
                ]),
              ))),
            ),
          ]),
        ),
      ]),
    ),
  );
}

// ── Erreur profil ─────────────────────────────────────────────────────────────

class _ProfileError extends StatelessWidget {
  const _ProfileError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 72, height: 72,
          decoration: BoxDecoration(color: AppColors.error.withValues(alpha: .08), shape: BoxShape.circle),
          child: const Icon(Icons.cloud_off_rounded, color: AppColors.error, size: 34),
        ),
        const SizedBox(height: 16),
        const Text('Impossible de charger le profil',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          textAlign: TextAlign.center),
        const SizedBox(height: 6),
        const Text('Vérifie ta connexion et réessaie.',
          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          textAlign: TextAlign.center),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh_rounded, size: 18),
          label: const Text('Réessayer'),
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(160, 44),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ]),
    ),
  );
}

// ── Tuile info ────────────────────────────────────────────────────────────────

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.icon, required this.label, required this.value});
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: .1), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: AppColors.primary, size: 18),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
              const SizedBox(height: 1),
              Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15)),
            ],
          ),
        ],
      ),
    );
  }
}
