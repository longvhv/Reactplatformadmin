import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:vhv_widgets/vhv_widgets.dart';

import '../../../../core/l10n/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/presentation/widgets/app_scaffold.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: context.tr('profile.title'),
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          return state.maybeWhen(
            authenticated: (user) => SingleChildScrollView(
              padding: const EdgeInsets.all(AppTheme.spacingLarge),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile Header
                  Center(
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 60,
                          backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                          child: user.avatar != null
                              ? ClipOval(
                                  child: Image.network(
                                    user.avatar!,
                                    width: 120,
                                    height: 120,
                                    fit: BoxFit.cover,
                                  ),
                                )
                              : const Icon(
                                  Icons.person,
                                  size: 60,
                                  color: AppTheme.primaryColor,
                                ),
                        ),
                        const SizedBox(height: AppTheme.spacingMedium),
                        Text(
                          user.name,
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: AppTheme.spacingXSmall),
                        Text(
                          user.email,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: AppTheme.textSecondaryLight,
                              ),
                        ),
                        const SizedBox(height: AppTheme.spacingMedium),
                        VHVButton(
                          text: context.tr('profile.updateProfile'),
                          onPressed: () {},
                          variant: VHVButtonVariant.outlined,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingXLarge),

                  // Personal Information
                  Text(
                    context.tr('profile.personalInfo'),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textSecondaryLight,
                        ),
                  ),
                  const SizedBox(height: AppTheme.spacingMedium),
                  
                  VHVCard(
                    child: Column(
                      children: [
                        _buildInfoItem(
                          context,
                          icon: Icons.person_outline,
                          label: context.tr('profile.name'),
                          value: user.name,
                        ),
                        const Divider(height: 1),
                        _buildInfoItem(
                          context,
                          icon: Icons.email_outlined,
                          label: context.tr('profile.email'),
                          value: user.email,
                        ),
                        if (user.phone != null) ...[
                          const Divider(height: 1),
                          _buildInfoItem(
                            context,
                            icon: Icons.phone_outlined,
                            label: context.tr('profile.phone'),
                            value: user.phone!,
                          ),
                        ],
                        if (user.position != null) ...[
                          const Divider(height: 1),
                          _buildInfoItem(
                            context,
                            icon: Icons.work_outline,
                            label: context.tr('profile.position'),
                            value: user.position!,
                          ),
                        ],
                        if (user.department != null) ...[
                          const Divider(height: 1),
                          _buildInfoItem(
                            context,
                            icon: Icons.business_outlined,
                            label: context.tr('profile.department'),
                            value: user.department!,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingXLarge),

                  // Security
                  Text(
                    context.tr('profile.security'),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textSecondaryLight,
                        ),
                  ),
                  const SizedBox(height: AppTheme.spacingMedium),
                  
                  VHVCard(
                    child: ListTile(
                      leading: const Icon(Icons.lock_outline),
                      title: const Text('Change Password'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {},
                    ),
                  ),
                ],
              ),
            ),
            orElse: () => const Center(
              child: CircularProgressIndicator(),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return ListTile(
      leading: Icon(icon, size: 24),
      title: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppTheme.textSecondaryLight,
            ),
      ),
      subtitle: Text(
        value,
        style: Theme.of(context).textTheme.bodyLarge,
      ),
    );
  }
}
