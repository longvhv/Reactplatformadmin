import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/settings/presentation/pages/settings_page.dart';
import '../../features/settings/presentation/pages/appearance_page.dart';
import '../../shared/presentation/pages/splash_page.dart';

class AppRouter {
  late final GoRouter router;

  AppRouter() {
    router = GoRouter(
      initialLocation: '/',
      debugLogDiagnostics: true,
      routes: [
        // Splash
        GoRoute(
          path: '/',
          name: 'splash',
          pageBuilder: (context, state) => const MaterialPage(
            child: SplashPage(),
          ),
        ),

        // Auth
        GoRoute(
          path: '/login',
          name: 'login',
          pageBuilder: (context, state) => const MaterialPage(
            child: LoginPage(),
          ),
        ),

        // Dashboard
        GoRoute(
          path: '/dashboard',
          name: 'dashboard',
          pageBuilder: (context, state) => const MaterialPage(
            child: DashboardPage(),
          ),
        ),

        // Profile
        GoRoute(
          path: '/profile',
          name: 'profile',
          pageBuilder: (context, state) => const MaterialPage(
            child: ProfilePage(),
          ),
        ),

        // Settings
        GoRoute(
          path: '/settings',
          name: 'settings',
          pageBuilder: (context, state) => const MaterialPage(
            child: SettingsPage(),
          ),
          routes: [
            GoRoute(
              path: 'appearance',
              name: 'appearance',
              pageBuilder: (context, state) => const MaterialPage(
                child: AppearancePage(),
              ),
            ),
          ],
        ),
      ],

      // Redirect logic
      redirect: (context, state) {
        // Add authentication check here
        return null;
      },

      // Error handling
      errorBuilder: (context, state) => Scaffold(
        body: Center(
          child: Text('Error: ${state.error}'),
        ),
      ),
    );
  }
}
