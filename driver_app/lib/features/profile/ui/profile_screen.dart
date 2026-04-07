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

    return Scaffold(
      appBar: AppBar(title: const Text('Mon Profil')),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(child: Text('Erreur : $e', style: const TextStyle(color: AppColors.error))),
        data: (driver) => _ProfileContent(driver: driver),
      ),
    );
  }
}

class _ProfileContent extends ConsumerStatefulWidget {
  const _ProfileContent({required this.driver});
  final Driver driver;

  @override
  ConsumerState<_ProfileContent> createState() => _ProfileContentState();
}

class _ProfileContentState extends ConsumerState<_ProfileContent> {
  late final TextEditingController _phoneCtrl;
  bool _editing = false;
  bool _saving = false;

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
    final (statusLabel, statusColor) = switch (widget.driver.statut) {
      'AVAILABLE'  => ('DISPONIBLE', AppColors.primary),
      'BUSY'       => ('EN MISSION', AppColors.warning),
      'SUSPENDED'  => ('SUSPENDU', AppColors.error),
      _            => (widget.driver.statut, AppColors.textSecondary),
    };

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Avatar + nom
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: AppColors.card,
                  child: Text(
                    '${widget.driver.prenom[0]}${widget.driver.nom[0]}'.toUpperCase(),
                    style: const TextStyle(color: AppColors.primary, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                Text('${widget.driver.prenom} ${widget.driver.nom}',
                  style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Infos
          _InfoRow(label: 'Email', value: widget.driver.email, icon: Icons.email_outlined),
          const SizedBox(height: 8),
          _InfoRow(label: 'N° Permis', value: widget.driver.numeroPermis, icon: Icons.badge_outlined),
          const SizedBox(height: 8),

          // Téléphone éditable
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.phone_outlined, color: AppColors.textSecondary, size: 18),
                const SizedBox(width: 12),
                Expanded(
                  child: _editing
                      ? TextField(
                          controller: _phoneCtrl,
                          keyboardType: TextInputType.phone,
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 15),
                          decoration: const InputDecoration(
                            contentPadding: EdgeInsets.zero,
                            isDense: true,
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                          ),
                          autofocus: true,
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Téléphone', style: TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 2),
                            Text(widget.driver.telephone, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15)),
                          ],
                        ),
                ),
                if (_editing) ...[
                  TextButton(
                    onPressed: () => setState(() => _editing = false),
                    child: const Text('Annuler', style: TextStyle(color: AppColors.textSecondary)),
                  ),
                  _saving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                      : TextButton(
                          onPressed: _savePhone,
                          child: const Text('Sauvegarder', style: TextStyle(color: AppColors.primary)),
                        ),
                ] else
                  IconButton(
                    icon: const Icon(Icons.edit_outlined, color: AppColors.textSecondary, size: 18),
                    onPressed: () => setState(() => _editing = true),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Déconnexion
          OutlinedButton.icon(
            onPressed: () => ref.read(authNotifierProvider.notifier).logout(),
            icon: const Icon(Icons.logout, color: AppColors.error),
            label: const Text('Se déconnecter', style: TextStyle(color: AppColors.error)),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 48),
              side: const BorderSide(color: AppColors.error),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value, required this.icon});
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.textSecondary, size: 18),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15)),
            ],
          ),
        ],
      ),
    );
  }
}
