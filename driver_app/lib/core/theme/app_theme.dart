import 'package:flutter/material.dart';

class AppColors {
  static const background = Color(0xFF1a1a2e);
  static const surface = Color(0xFF16213e);
  static const card = Color(0xFF0f3460);
  static const primary = Color(0xFF22c55e);
  static const primaryDark = Color(0xFF16a34a);
  static const textPrimary = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFF9ca3af);
  static const border = Color(0xFF374151);
  static const error = Color(0xFFef4444);
  static const warning = Color(0xFFf59e0b);
  static const info = Color(0xFF3b82f6);
}

final appTheme = ThemeData(
  useMaterial3: true,
  scaffoldBackgroundColor: AppColors.background,
  colorScheme: const ColorScheme.dark(
    primary: AppColors.primary,
    surface: AppColors.surface,
    error: AppColors.error,
  ),
  textTheme: const TextTheme(
    headlineLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 28),
    headlineMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 22),
    titleLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 18),
    titleMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 16),
    bodyLarge: TextStyle(color: AppColors.textPrimary, fontSize: 16),
    bodyMedium: TextStyle(color: AppColors.textSecondary, fontSize: 14),
    labelLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 16),
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: AppColors.surface,
    foregroundColor: AppColors.textPrimary,
    elevation: 0,
    centerTitle: false,
    titleTextStyle: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
  ),
  cardTheme: CardThemeData(
    color: AppColors.surface,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: const BorderSide(color: AppColors.border, width: 1),
    ),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: AppColors.surface,
    selectedItemColor: AppColors.primary,
    unselectedItemColor: AppColors.textSecondary,
    type: BottomNavigationBarType.fixed,
    elevation: 0,
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      minimumSize: const Size(double.infinity, 52),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: AppColors.surface,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.primary, width: 2),
    ),
    labelStyle: const TextStyle(color: AppColors.textSecondary),
    hintStyle: const TextStyle(color: AppColors.textSecondary),
  ),
);
