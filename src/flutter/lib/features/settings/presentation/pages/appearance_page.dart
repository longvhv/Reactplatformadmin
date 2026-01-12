import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:vhv_widgets/vhv_widgets.dart';

import '../../../../core/l10n/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/app_scaffold.dart';
import '../bloc/theme_bloc.dart';
import '../bloc/theme_event.dart';
import '../bloc/theme_state.dart';

class AppearancePage extends StatelessWidget {
  const AppearancePage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: context.tr('settings.appearance'),
      body: ListView(
        padding: const EdgeInsets.all(AppTheme.spacingLarge),
        children: [
          // Theme Section
          Text(
            context.tr('settings.theme'),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondaryLight,
                ),
          ),
          const SizedBox(height: AppTheme.spacingMedium),
          
          BlocBuilder<ThemeBloc, ThemeState>(
            builder: (context, state) {
              final currentThemeMode = state.maybeWhen(
                loaded: (themeMode) => themeMode,
                orElse: () => ThemeMode.light,
              );

              return VHVCard(
                child: Column(
                  children: [
                    _buildThemeOption(
                      context,
                      themeMode: ThemeMode.light,
                      currentThemeMode: currentThemeMode,
                      icon: Icons.light_mode_outlined,
                      title: context.tr('settings.lightMode'),
                    ),
                    const Divider(height: 1),
                    _buildThemeOption(
                      context,
                      themeMode: ThemeMode.dark,
                      currentThemeMode: currentThemeMode,
                      icon: Icons.dark_mode_outlined,
                      title: context.tr('settings.darkMode'),
                    ),
                    const Divider(height: 1),
                    _buildThemeOption(
                      context,
                      themeMode: ThemeMode.system,
                      currentThemeMode: currentThemeMode,
                      icon: Icons.settings_suggest_outlined,
                      title: context.tr('settings.systemMode'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildThemeOption(
    BuildContext context, {
    required ThemeMode themeMode,
    required ThemeMode currentThemeMode,
    required IconData icon,
    required String title,
  }) {
    final isSelected = themeMode == currentThemeMode;

    return ListTile(
      leading: Icon(icon, size: 24),
      title: Text(title),
      trailing: isSelected
          ? const Icon(
              Icons.check_circle,
              color: AppTheme.primaryColor,
            )
          : null,
      onTap: () {
        context.read<ThemeBloc>().add(ThemeEvent.changeTheme(themeMode));
      },
    );
  }
}
