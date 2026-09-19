import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'config/router.dart';
import 'theme/app_theme.dart';
import 'services/api_client.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MedRecordApp());
}

class MedRecordApp extends StatelessWidget {
  const MedRecordApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          // Wire up the ApiClient unauthorized callback
          ApiClient().onUnauthorized = () {
            authProvider.logout();
          };

          final router = createRouter(authProvider);

          return MaterialApp.router(
            title: 'MedRecord',
            theme: AppTheme.theme,
            routerConfig: router,
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }
}
