import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../auth/data/auth_notifier.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fade  = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _scale = Tween<double>(begin: .7, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut),
    );
    _ctrl.forward();

    // Après l'animation, vérifier les permissions puis router
    Future.delayed(const Duration(milliseconds: 1800), _checkAndRoute);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _checkAndRoute() async {
    if (!mounted) return;
    // Attendre que restoreSession() ait terminé (état sorti de initial/loading)
    final authState = ref.read(authNotifierProvider);
    final isStillLoading = authState.maybeWhen(
      initial: () => true,
      loading: () => true,
      orElse: () => false,
    );
    if (isStillLoading) {
      // Pas encore fini — on repoll dans 200ms
      Future.delayed(const Duration(milliseconds: 200), _checkAndRoute);
      return;
    }
    final isAuth = authState.maybeWhen(authenticated: (_) => true, orElse: () => false);
    context.go(isAuth ? '/home' : '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: FadeTransition(
          opacity: _fade,
          child: ScaleTransition(
            scale: _scale,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Logo camion
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: .15),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.local_shipping_rounded, color: AppColors.primary, size: 56),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Elimmekatruck',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: .5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Portail Chauffeur',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: .75),
                    fontSize: 15,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
