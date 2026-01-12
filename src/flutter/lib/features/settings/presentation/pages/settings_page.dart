import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:vhv_widgets/vhv_widgets.dart';

import '../../../../core/l10n/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/app_scaffold.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: context.tr('settings.title'),
      body: ListView(
        padding: const EdgeInsets.all(AppTheme.spacingLarge),
        children: [
          // General Section
          Text(
            context.tr('settings.general'),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondaryLight,
                ),
          ),
          const SizedBox(height: AppTheme.spacingMedium),
          
          VHVCard(
            child: Column(
              children: [
                _buildSettingItem(
                  context,
                  icon: Icons.palette_outlined,
                  title: context.tr('settings.appearance'),
                  onTap: () => context.go('/settings/appearance'),
                ),
                const Divider(height: 1),
                _buildSettingItem(
                  context,
                  icon: Icons.language_outlined,
                  title: context.tr('settings.language'),
                  onTap: () {},
                ),
                const Divider(height: 1),
                _buildSettingItem(
                  context,
                  icon: Icons.notifications_outlined,
                  title: context.tr('settings.notifications'),
                  onTap: () {},
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spacingXLarge),

          // Privacy Section
          Text(
            context.tr('settings.privacy'),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondaryLight,
                ),
          ),
          const SizedBox(height: AppTheme.spacingMedium),
          
          VHVCard(
            child: Column(
              children: [
                _buildSettingItem(
                  context,
                  icon: Icons.security_outlined,
                  title: 'Security',
                  onTap: () {},
                ),
                const Divider(height: 1),
                _buildSettingItem(
                  context,
                  icon: Icons.privacy_tip_outlined,
                  title: 'Privacy',
                  onTap: () {},
                ),
              ],
            ),
          ),
          const SizedBox(height: AppTheme.spacingXLarge),

          // About Section
          Text(
            'About',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondaryLight,
                ),
          ),
          const SizedBox(height: AppTheme.spacingMedium),
          
          VHVCard(
            child: Column(
              children: [
                _buildSettingItem(
                  context,
                  icon: Icons.info_outline,
                  title: 'Version',
                  trailing: const Text('1.0.0'),
                  onTap: () {},
                ),
                const Divider(height: 1),
                _buildSettingItem(
                  context,
                  icon: Icons.description_outlined,
                  title: 'Terms of Service',
                  onTap: () {},
                ),
                const Divider(height: 1),
                _buildSettingItem(
                  context,
                  icon: Icons.privacy_tip_outlined,
                  title: 'Privacy Policy',
                  onTap: () {},
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, size: 24),
      title: Text(title),
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
