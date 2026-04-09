import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../features/auth/data/auth_notifier.dart';
import '../../features/auth/ui/login_screen.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/splash/permission_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/missions/ui/missions_screen.dart';
import '../../features/missions/ui/mission_detail_screen.dart';
import '../../features/missions/data/missions_notifier.dart';
import '../../features/tracking/ui/tracking_screen.dart';
import '../../features/profile/ui/profile_screen.dart';
import '../services/notification_banner_notifier.dart';
import '../theme/app_theme.dart';
// ignore_for_file: unused_import

part 'app_router.g.dart';

final _rootNavigatorKey  = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

@Riverpod(keepAlive: true)
GoRouter appRouter(Ref ref) {
  final authState = ref.watch(authNotifierProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final isAuth    = authState.maybeWhen(authenticated: (_) => true, orElse: () => false);
      final isLoading = authState.maybeWhen(initial: () => true, loading: () => true, orElse: () => false);
      final loc       = state.matchedLocation;

      if (isLoading) return null;
      if (loc == '/splash' || loc == '/login') {
        if (isAuth) return '/home';
        return null;
      }
      if (!isAuth) return '/login';
      return null;
    },
    routes: [
      GoRoute(path: '/splash',     builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/permission', builder: (_, __) => const PermissionScreen()),
      GoRoute(path: '/login',      builder: (_, __) => const LoginScreen()),

      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => _Shell(child: child),
        routes: [
          GoRoute(path: '/home',      builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/missions',  builder: (_, __) => const MissionsScreen()),
          GoRoute(
            path: '/missions/:id',
            builder: (_, s) => MissionDetailScreen(missionId: s.pathParameters['id']!),
          ),
          GoRoute(path: '/tracking', builder: (_, __) => const TrackingScreen()),
          GoRoute(path: '/profile',  builder: (_, __) => const ProfileScreen()),
        ],
      ),
    ],
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

class _Shell extends ConsumerWidget {
  const _Shell({required this.child});
  final Widget child;

  int _currentIndex(String loc) {
    if (loc.startsWith('/missions'))  return 1;
    if (loc.startsWith('/tracking'))  return 2;
    if (loc.startsWith('/profile'))   return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc      = GoRouterState.of(context).matchedLocation;
    final missions = ref.watch(missionsProvider).valueOrNull ?? [];
    final banner   = ref.watch(notificationBannerProvider);

    // Badge = missions PENDING (nouvelles, pas encore acceptées)
    final pendingCount = missions.where((m) => m.statut == 'PENDING').length;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final loc = GoRouterState.of(context).matchedLocation;

        // Sur un onglet racine autre que /home → retour à l'accueil
        if (loc != '/home' && !loc.startsWith('/missions/')) {
          context.go('/home');
          return;
        }

        // Sur /home → confirmation avant de quitter
        if (loc == '/home') {
          final shouldExit = await showDialog<bool>(
            context: context,
            builder: (_) => AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Quitter l\'application ?'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Annuler'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                  child: const Text('Quitter'),
                ),
              ],
            ),
          );
          if (shouldExit == true && context.mounted) {
            // ignore: use_build_context_synchronously
            Navigator.of(context, rootNavigator: true).pop();
          }
        }
      },
      child: Scaffold(
      body: Stack(
        children: [
          child,
          // ── Bannière in-app ──────────────────────────────────────────────
          AnimatedSlide(
            offset: banner != null ? Offset.zero : const Offset(0, -1),
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOutCubic,
            child: AnimatedOpacity(
              opacity: banner != null ? 1 : 0,
              duration: const Duration(milliseconds: 300),
              child: _InAppBanner(
                banner: banner,
                onDismiss: () => ref.read(notificationBannerProvider.notifier).dismiss(),
                onTap: () {
                  ref.read(notificationBannerProvider.notifier).dismiss();
                  if (banner?.route != null) context.go(banner!.route!);
                },
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex(loc),
          elevation: 0,
          backgroundColor: Colors.transparent,
          onTap: (i) {
            switch (i) {
              case 0: context.go('/home');
              case 1: context.go('/missions');
              case 2: context.go('/tracking');
              case 3: context.go('/profile');
            }
          },
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Accueil',
            ),
            BottomNavigationBarItem(
              icon: _BadgeIcon(
                icon: Icons.local_shipping_outlined,
                count: pendingCount,
              ),
              activeIcon: _BadgeIcon(
                icon: Icons.local_shipping_rounded,
                count: pendingCount,
                active: true,
              ),
              label: 'Missions',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.location_on_outlined),
              activeIcon: Icon(Icons.location_on_rounded),
              label: 'Tracking',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profil',
            ),
          ],
        ),
      ),
    ));
  }
}

// ── Badge icon ────────────────────────────────────────────────────────────────

class _BadgeIcon extends StatelessWidget {
  const _BadgeIcon({required this.icon, required this.count, this.active = false});
  final IconData icon;
  final int count;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon),
        if (count > 0)
          Positioned(
            top: -4, right: -6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white, width: 1.5),
              ),
              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
              child: Text(
                count > 99 ? '99+' : '$count',
                style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}

// ── Bannière in-app ───────────────────────────────────────────────────────────

class _InAppBanner extends StatelessWidget {
  const _InAppBanner({required this.banner, required this.onDismiss, required this.onTap});
  final BannerNotification? banner;
  final VoidCallback onDismiss;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: .12), blurRadius: 20, offset: const Offset(0, 6)),
            ],
          ),
          child: Row(
            children: [
              // Icône
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: .1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.local_shipping_rounded, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 12),
              // Texte
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      banner?.title ?? '',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (banner?.body != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        banner!.body!,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 2,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Fermer
              GestureDetector(
                onTap: onDismiss,
                child: const Icon(Icons.close_rounded, size: 18, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
