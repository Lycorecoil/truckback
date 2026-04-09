import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../core/theme/app_theme.dart';

class PermissionScreen extends StatefulWidget {
  const PermissionScreen({super.key});

  @override
  State<PermissionScreen> createState() => _PermissionScreenState();
}

class _PermissionScreenState extends State<PermissionScreen> {
  bool _loading = false;
  String? _errorMsg;

  Future<void> _requestPermissions() async {
    setState(() { _loading = true; _errorMsg = null; });

    // Étape 1 : whenInUse (obligatoire avant always sur Android)
    final whenInUse = await Permission.locationWhenInUse.request();

    if (!whenInUse.isGranted) {
      setState(() {
        _loading = false;
        _errorMsg = 'Permission de localisation refusée.\nLe tracking GPS sera indisponible.';
      });
      return;
    }

    // Étape 2 : Always (Android redirige vers les réglages système)
    final always = await Permission.locationAlways.request();

    if (!mounted) return;

    if (always.isGranted) {
      context.go('/home');
    } else {
      // Accordé seulement "en utilisation" : on continue mais avec avertissement
      setState(() {
        _loading = false;
        _errorMsg = 'Localisation "toujours autorisée" non accordée.\nLe tracking en arrière-plan sera limité.';
      });
    }
  }

  void _continueAnyway() => context.go('/home');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // Illustration
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: .1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 60),
              ),
              const SizedBox(height: 32),

              const Text(
                'Accès à votre position',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),

              Text(
                'Pour suivre vos missions en temps réel et partager votre position avec l\'expéditeur, '
                'l\'application a besoin d\'accéder à votre localisation, même lorsqu\'elle est en arrière-plan.',
                style: const TextStyle(
                  fontSize: 15,
                  color: AppColors.textSecondary,
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // Points clés
              _PermissionPoint(
                icon: Icons.shield_outlined,
                color: AppColors.success,
                title: 'Données sécurisées',
                subtitle: 'Position partagée uniquement avec votre expéditeur',
              ),
              const SizedBox(height: 12),
              _PermissionPoint(
                icon: Icons.battery_saver_outlined,
                color: AppColors.info,
                title: 'Optimisé pour la batterie',
                subtitle: 'Envoi toutes les 30 secondes uniquement en mission',
              ),
              const SizedBox(height: 12),
              _PermissionPoint(
                icon: Icons.toggle_on_outlined,
                color: AppColors.primary,
                title: 'Vous gardez le contrôle',
                subtitle: 'Activez / désactivez le tracking à tout moment',
              ),

              if (_errorMsg != null) ...[
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: .1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.warning.withValues(alpha: .4)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: AppColors.warning, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(_errorMsg!, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, height: 1.4)),
                      ),
                    ],
                  ),
                ),
              ],

              const Spacer(flex: 3),

              // Bouton principal
              ElevatedButton.icon(
                onPressed: _loading ? null : _requestPermissions,
                icon: _loading
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.location_on_rounded),
                label: Text(_loading ? 'Demande en cours…' : 'Autoriser la localisation'),
              ),
              const SizedBox(height: 12),

              // Continuer sans (si erreur affichée)
              if (_errorMsg != null)
                TextButton(
                  onPressed: _continueAnyway,
                  child: const Text('Continuer sans localisation', style: TextStyle(color: AppColors.textSecondary)),
                ),

              const SizedBox(height: 28),
            ],
          ),
        ),
      ),
    );
  }
}

class _PermissionPoint extends StatelessWidget {
  const _PermissionPoint({required this.icon, required this.color, required this.title, required this.subtitle});
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: color.withValues(alpha: .12), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
              Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
        ),
      ],
    );
  }
}
