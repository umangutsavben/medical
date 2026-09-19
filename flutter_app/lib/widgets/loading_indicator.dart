import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class LoadingIndicator extends StatelessWidget {
  final String message;

  const LoadingIndicator({super.key, this.message = 'Loading...'});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(60),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 36,
              height: 36,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Widget? action;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: AppTheme.textMuted.withValues(alpha: 0.5)),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: const TextStyle(
                fontSize: 13,
                color: AppTheme.textMuted,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            if (action != null) ...[
              const SizedBox(height: 16),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

class AlertBanner extends StatelessWidget {
  final String message;
  final AlertType type;

  const AlertBanner({
    super.key,
    required this.message,
    this.type = AlertType.info,
  });

  @override
  Widget build(BuildContext context) {
    final config = _getConfig();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: config.bg,
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
        border: Border.all(color: config.borderColor),
      ),
      child: Text(
        message,
        style: TextStyle(fontSize: 13, color: config.textColor),
      ),
    );
  }

  _AlertConfig _getConfig() {
    switch (type) {
      case AlertType.error:
        return _AlertConfig(
          bg: AppTheme.dangerLight,
          textColor: AppTheme.danger,
          borderColor: const Color(0xFFFCA5A5),
        );
      case AlertType.success:
        return _AlertConfig(
          bg: AppTheme.successLight,
          textColor: AppTheme.success,
          borderColor: const Color(0xFF6EE7B7),
        );
      case AlertType.warning:
        return _AlertConfig(
          bg: AppTheme.warningLight,
          textColor: AppTheme.warning,
          borderColor: const Color(0xFFFCD34D),
        );
      case AlertType.info:
        return _AlertConfig(
          bg: AppTheme.primaryLight,
          textColor: AppTheme.primary,
          borderColor: const Color(0xFF93C5FD),
        );
    }
  }
}

enum AlertType { error, success, warning, info }

class _AlertConfig {
  final Color bg;
  final Color textColor;
  final Color borderColor;

  _AlertConfig({
    required this.bg,
    required this.textColor,
    required this.borderColor,
  });
}
