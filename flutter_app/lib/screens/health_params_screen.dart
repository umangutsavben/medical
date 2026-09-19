import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/health_service.dart';
import '../models/health_parameter.dart';
import '../theme/app_theme.dart';
import '../widgets/param_card.dart';
import '../widgets/loading_indicator.dart';

const _paramIcons = {
  'glucose': '🩸',
  'hemoglobin': '🔴',
  'systolic_bp': '❤️',
  'diastolic_bp': '💙',
  'cholesterol': '🟡',
  'heart_rate': '💓',
  'hba1c': '🧪',
  'creatinine': '🟠',
  'wbc': '⚪',
  'platelets': '🟤',
};

class HealthParamsScreen extends StatefulWidget {
  const HealthParamsScreen({super.key});

  @override
  State<HealthParamsScreen> createState() => _HealthParamsScreenState();
}

class _HealthParamsScreenState extends State<HealthParamsScreen> {
  final _healthService = HealthService();
  List<HealthParameter> _parameters = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadParameters();
  }

  Future<void> _loadParameters() async {
    try {
      final params = await _healthService.getParameters();
      setState(() {
        _parameters = params;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: LoadingIndicator(message: 'Loading parameters...'),
      );
    }

    final withData = _parameters.where((p) => p.measurementCount > 0).toList();
    final withoutData =
        _parameters.where((p) => p.measurementCount == 0).toList();

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadParameters,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Health Parameters',
                  style:
                      TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 16),

                const AlertBanner(
                  message:
                      '⚠️ Values are extracted from uploaded medical reports using OCR. Always verify with your healthcare provider.',
                  type: AlertType.warning,
                ),

                if (withData.isNotEmpty) ...[
                  Text(
                    'Tracked Parameters (${withData.length})',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 10),
                  ...withData.map((p) => ParamCard(
                        leading: Container(
                          width: 40,
                          height: 40,
                          decoration: const BoxDecoration(
                            color: AppTheme.primaryLight,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              _paramIcons[p.name] ?? '📊',
                              style: const TextStyle(fontSize: 20),
                            ),
                          ),
                        ),
                        title: p.displayName,
                        subtitle:
                            '${p.measurementCount} measurement${p.measurementCount != 1 ? 's' : ''}',
                        trailing: p.latestMeasurement != null
                            ? Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    p.latestMeasurement!.value.toString(),
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.primary,
                                    ),
                                  ),
                                  Text(
                                    p.latestMeasurement!.unit,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.textMuted),
                                  ),
                                ],
                              )
                            : const Icon(Icons.trending_up,
                                size: 16, color: AppTheme.textMuted),
                        onTap: () => context.go('/trends/${p.name}'),
                      )),
                  const SizedBox(height: 20),
                ],

                if (withoutData.isNotEmpty) ...[
                  Text(
                    'No Data Yet (${withoutData.length})',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ...withoutData.map((p) => ParamCard(
                        opacity: 0.6,
                        leading: Container(
                          width: 40,
                          height: 40,
                          decoration: const BoxDecoration(
                            color: AppTheme.bgInput,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              _paramIcons[p.name] ?? '📊',
                              style: const TextStyle(fontSize: 20),
                            ),
                          ),
                        ),
                        title: p.displayName,
                        subtitle:
                            'Normal: ${p.normalMin ?? '?'}–${p.normalMax ?? '?'} ${p.defaultUnit}',
                      )),
                ],

                if (_parameters.isEmpty)
                  const EmptyState(
                    icon: Icons.monitor_heart,
                    title: 'No parameters available',
                    description:
                        'Upload and process medical reports to extract health parameters',
                  ),

                const SizedBox(height: 80),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
