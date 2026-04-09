import 'package:flutter/material.dart';

class AppColors {
  // Fond
  static const background    = Color(0xFFF5F5F5);
  static const surface       = Color(0xFFFFFFFF);
  static const surfaceAlt    = Color(0xFFF0F0F0);

  // Primaire — orange
  static const primary       = Color(0xFFFF5722);
  static const primaryLight  = Color(0xFFFF7043);
  static const primaryDark   = Color(0xFFE64A19);

  // Texte
  static const textPrimary   = Color(0xFF1A1A1A);
  static const textSecondary = Color(0xFF757575);
  static const textHint      = Color(0xFFBDBDBD);

  // Bordures
  static const border        = Color(0xFFE0E0E0);

  // États
  static const success       = Color(0xFF4CAF50);
  static const warning       = Color(0xFFFFC107);
  static const error         = Color(0xFFF44336);
  static const info          = Color(0xFF2196F3);

  // Statuts mission
  static const statusPending    = Color(0xFFFFC107);
  static const statusAccepted   = Color(0xFF2196F3);
  static const statusInProgress = Color(0xFFFF5722);
  static const statusDelivered  = Color(0xFF4CAF50);
  static const statusCancelled  = Color(0xFFF44336);
}

final appTheme = ThemeData(
  useMaterial3: true,
  scaffoldBackgroundColor: AppColors.background,
  fontFamily: 'Roboto',
  colorScheme: const ColorScheme.light(
    primary: AppColors.primary,
    surface: AppColors.surface,
    error: AppColors.error,
    onPrimary: Colors.white,
    onSurface: AppColors.textPrimary,
  ),
  textTheme: const TextTheme(
    headlineLarge:  TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold,    fontSize: 28),
    headlineMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold,    fontSize: 22),
    titleLarge:     TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600,    fontSize: 18),
    titleMedium:    TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600,    fontSize: 16),
    bodyLarge:      TextStyle(color: AppColors.textPrimary, fontSize: 16),
    bodyMedium:     TextStyle(color: AppColors.textSecondary, fontSize: 14),
    labelLarge:     TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600,    fontSize: 16),
    labelSmall:     TextStyle(color: AppColors.textSecondary, fontSize: 11, letterSpacing: .5),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: AppColors.surface,
    foregroundColor: AppColors.textPrimary,
    elevation: 0,
    centerTitle: false,
    titleTextStyle: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
    iconTheme: IconThemeData(color: AppColors.textPrimary),
  ),
  cardTheme: CardThemeData(
    color: AppColors.surface,
    elevation: 0,
    margin: EdgeInsets.zero,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: const BorderSide(color: AppColors.border),
    ),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: AppColors.surface,
    selectedItemColor: AppColors.primary,
    unselectedItemColor: AppColors.textSecondary,
    type: BottomNavigationBarType.fixed,
    elevation: 8,
    selectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
    unselectedLabelStyle: TextStyle(fontSize: 11),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
      elevation: 0,
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: AppColors.primary,
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      side: const BorderSide(color: AppColors.primary),
      textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: AppColors.surface,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: AppColors.primary, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: AppColors.error),
    ),
    labelStyle: const TextStyle(color: AppColors.textSecondary),
    hintStyle: const TextStyle(color: AppColors.textHint),
  ),
  dividerTheme: const DividerThemeData(
    color: AppColors.border,
    thickness: 1,
    space: 1,
  ),
  switchTheme: SwitchThemeData(
    thumbColor: WidgetStateProperty.resolveWith((s) =>
      s.contains(WidgetState.selected) ? AppColors.primary : Colors.white),
    trackColor: WidgetStateProperty.resolveWith((s) =>
      s.contains(WidgetState.selected) ? AppColors.primary.withValues(alpha: .4) : AppColors.border),
  ),
);

// ── Helpers statut ──────────────────────────────────────────────────────────

Color statusColor(String statut) => switch (statut) {
  'PENDING'     => AppColors.statusPending,
  'ACCEPTED'    => AppColors.statusAccepted,
  'IN_PROGRESS' => AppColors.statusInProgress,
  'DELIVERED'   => AppColors.statusDelivered,
  'CANCELLED'   => AppColors.statusCancelled,
  _             => AppColors.textSecondary,
};

String statusLabel(String statut) => switch (statut) {
  'PENDING'     => 'En attente',
  'ACCEPTED'    => 'Acceptée',
  'IN_PROGRESS' => 'En cours',
  'DELIVERED'   => 'Livrée',
  'CANCELLED'   => 'Annulée',
  'PROPOSED'    => 'Proposée',
  _             => statut,
};
