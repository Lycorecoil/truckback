import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class BannerNotification {
  const BannerNotification({required this.title, this.body, this.route});
  final String  title;
  final String? body;
  final String? route; // ex: '/missions'
}

class NotificationBannerNotifier extends Notifier<BannerNotification?> {
  Timer? _timer;

  @override
  BannerNotification? build() => null;

  void show(BannerNotification banner) {
    _timer?.cancel();
    state = banner;
    _timer = Timer(const Duration(seconds: 4), dismiss);
  }

  void dismiss() {
    _timer?.cancel();
    state = null;
  }
}

final notificationBannerProvider =
    NotifierProvider<NotificationBannerNotifier, BannerNotification?>(
  NotificationBannerNotifier.new,
);
