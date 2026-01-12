import 'package:flutter/material.dart';
import 'package:vhv_widgets/vhv_widgets.dart';

import '../../../../core/l10n/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/app_scaffold.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: context.tr('dashboard.title'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTheme.spacingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Section
            Text(
              context.tr('dashboard.welcome'),
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingSmall),
            Text(
              'BasicSoftTemplate',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppTheme.textSecondaryLight,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingXLarge),

            // Stats Cards
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: AppTheme.spacingMedium,
              crossAxisSpacing: AppTheme.spacingMedium,
              childAspectRatio: 1.5,
              children: [
                _buildStatCard(
                  context,
                  icon: Icons.people_outline,
                  title: 'Users',
                  value: '1,234',
                  color: AppTheme.primaryColor,
                ),
                _buildStatCard(
                  context,
                  icon: Icons.analytics_outlined,
                  title: 'Analytics',
                  value: '5,678',
                  color: AppTheme.info,
                ),
                _buildStatCard(
                  context,
                  icon: Icons.trending_up,
                  title: 'Growth',
                  value: '+12%',
                  color: AppTheme.success,
                ),
                _buildStatCard(
                  context,
                  icon: Icons.notifications_outlined,
                  title: 'Alerts',
                  value: '23',
                  color: AppTheme.warning,
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingXLarge),

            // Recent Activity
            Text(
              context.tr('dashboard.recentActivity'),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppTheme.spacingMedium),

            VHVCard(
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: 5,
                separatorBuilder: (context, index) => const Divider(),
                itemBuilder: (context, index) => ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                    child: const Icon(
                      Icons.notifications_outlined,
                      color: AppTheme.primaryColor,
                      size: 20,
                    ),
                  ),
                  title: Text('Activity ${index + 1}'),
                  subtitle: Text('Description for activity ${index + 1}'),
                  trailing: Text(
                    '${index + 1}h ago',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textSecondaryLight,
                        ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return VHVCard(
      child: Padding(
        padding: const EdgeInsets.all(AppTheme.spacingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacingSmall),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: AppTheme.spacingXSmall),
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondaryLight,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
