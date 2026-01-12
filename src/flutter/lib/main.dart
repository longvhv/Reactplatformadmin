import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/di/injection.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/l10n/app_localizations.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/settings/presentation/bloc/theme_bloc.dart';
import 'features/settings/presentation/bloc/language_bloc.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
  
  // Setup dependency injection
  await configureDependencies();
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) => getIt<AuthBloc>()..add(const AuthEvent.checkAuthStatus()),
        ),
        BlocProvider(
          create: (context) => getIt<ThemeBloc>()..add(const ThemeEvent.loadTheme()),
        ),
        BlocProvider(
          create: (context) => getIt<LanguageBloc>()..add(const LanguageEvent.loadLanguage()),
        ),
      ],
      child: BlocBuilder<ThemeBloc, ThemeState>(
        builder: (context, themeState) {
          return BlocBuilder<LanguageBloc, LanguageState>(
            builder: (context, languageState) {
              return MaterialApp.router(
                title: 'BasicSoftTemplate',
                debugShowCheckedModeBanner: false,
                
                // Theme
                theme: AppTheme.lightTheme,
                darkTheme: AppTheme.darkTheme,
                themeMode: themeState.maybeWhen(
                  loaded: (themeMode) => themeMode,
                  orElse: () => ThemeMode.light,
                ),
                
                // Localization
                locale: languageState.maybeWhen(
                  loaded: (locale) => locale,
                  orElse: () => const Locale('vi'),
                ),
                supportedLocales: AppLocalizations.supportedLocales,
                localizationsDelegates: AppLocalizations.localizationsDelegates,
                
                // Routing
                routerConfig: getIt<AppRouter>().router,
              );
            },
          );
        },
      ),
    );
  }
}
