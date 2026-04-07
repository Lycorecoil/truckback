import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../features/auth/data/auth_notifier.dart';
import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/ui/login_screen.dart';
import '../../features/missions/ui/missions_screen.dart';
import '../../features/missions/ui/mission_detail_screen.dart';
import '../../features/tracking/ui/tracking_screen.dart';
import '../../features/profile/ui/profile_screen.dart';
// ignore_for_file: unused_import

part 'app_router.g.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

@riverpod
GoRouter appRouter(Ref ref) {
  final authState = ref.watch(authNotifierProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/missions',
    redirect: (context, state) {
      final isAuth = authState.maybeWhen(authenticated: (_) => true, orElse: () => false);
      final isLoading = authState.maybeWhen(initial: () => true, loading: () => true, orElse: () => false);
      final onLogin = state.matchedLocation == '/login';

      if (isLoading) return null;
      if (!isAuth && !onLogin) return '/login';
      if (isAuth && onLogin) return '/missions';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => _Shell(child: child),
        routes: [
          GoRoute(path: '/missions', builder: (_, __) => const MissionsScreen()),
          GoRoute(path: '/missions/:id', builder: (_, s) => MissionDetailScreen(missionId: s.pathParameters['id']!)),
          GoRoute(path: '/tracking', builder: (_, __) => const TrackingScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        ],
      ),
    ],
  );
}

class _Shell extends StatelessWidget {
  const _Shell({required this.child});
  final Widget child;

  int _currentIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    if (loc.startsWith('/tracking')) return 1;
    if (loc.startsWith('/profile')) return 2;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex(context),
        onTap: (i) {
          switch (i) {
            case 0: context.go('/missions');
            case 1: context.go('/tracking');
            case 2: context.go('/profile');
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.list_alt_outlined), activeIcon: Icon(Icons.list_alt), label: 'Missions'),
          BottomNavigationBarItem(icon: Icon(Icons.location_on_outlined), activeIcon: Icon(Icons.location_on), label: 'Tracking'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }
}
