import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final bool small;

  const StatusBadge({super.key, required this.status, this.small = false});

  @override
  Widget build(BuildContext context) {
    final config = _getConfig(status);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 8 : 10,
        vertical: small ? 3 : 4,
      ),
      decoration: BoxDecoration(
        color: config.bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(config.icon, size: small ? 9 : 10, color: config.color),
          const SizedBox(width: 4),
          Text(
            config.label,
            style: TextStyle(
              fontSize: small ? 9 : 11,
              fontWeight: FontWeight.w600,
              color: config.color,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  static _BadgeConfig _getConfig(String status) {
    switch (status) {
      case 'PROCESSING':
        return _BadgeConfig(
          bg: AppTheme.warningLight,
          color: AppTheme.warning,
          icon: Icons.access_time,
          label: 'PROCESSING',
        );
      case 'COMPLETED':
        return _BadgeConfig(
          bg: AppTheme.successLight,
          color: AppTheme.success,
          icon: Icons.check_circle_outline,
          label: 'COMPLETED',
        );
      case 'FAILED':
        return _BadgeConfig(
          bg: AppTheme.dangerLight,
          color: AppTheme.danger,
          icon: Icons.error_outline,
          label: 'FAILED',
        );
      default:
        return _BadgeConfig(
          bg: AppTheme.primaryLight,
          color: AppTheme.primary,
          icon: Icons.access_time,
          label: 'UPLOADED',
        );
    }
  }
}

class _BadgeConfig {
  final Color bg;
  final Color color;
  final IconData icon;
  final String label;

  _BadgeConfig({
    required this.bg,
    required this.color,
    required this.icon,
    required this.label,
  });
}
