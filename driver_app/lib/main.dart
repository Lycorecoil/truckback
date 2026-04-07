import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/notifications/push_notification_service.dart';
import 'features/auth/data/auth_notifier.dart';

void main() {
  runApp(const ProviderScope(child: ElimmekatruckApp()));
}

class ElimmekatruckApp extends ConsumerStatefulWidget {
  const ElimmekatruckApp({super.key});

  @override
  ConsumerState<ElimmekatruckApp> createState() => _ElimmekatruckAppState();
}

class _ElimmekatruckAppState extends ConsumerState<ElimmekatruckApp> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      // Init OneSignal
      await ref.read(pushNotificationServiceProvider).initialize();
      // Restaure la session JWT
      await ref.read(authNotifierProvider.notifier).restoreSession();
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'Elimmekatruck',
      theme: appTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
