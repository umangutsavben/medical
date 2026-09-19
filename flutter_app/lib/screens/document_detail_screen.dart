import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/document_service.dart';
import '../services/health_service.dart';
import '../models/document.dart';
import '../models/category.dart';
import '../theme/app_theme.dart';
import '../widgets/status_badge.dart';
import '../widgets/param_card.dart';
import '../widgets/loading_indicator.dart';

class DocumentDetailScreen extends StatefulWidget {
  final int documentId;
  const DocumentDetailScreen({super.key, required this.documentId});

  @override
  State<DocumentDetailScreen> createState() => _DocumentDetailScreenState();
}

class _DocumentDetailScreenState extends State<DocumentDetailScreen>
    with SingleTickerProviderStateMixin {
  final _docService = DocumentService();
  final _healthService = HealthService();
  MedicalDocument? _doc;
  bool _loading = true;
  String? _error;
  bool _processing = false;
  bool _deleting = false;
  List<MedicalCategory> _categories = [];
  Timer? _pollTimer;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadDocument();
    _loadCategories();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadDocument() async {
    try {
      final doc = await _docService.get(widget.documentId);
      setState(() {
        _doc = doc;
        _loading = false;
      });

      // Auto-refresh when processing
      if (doc.processingStatus == 'PROCESSING') {
        _pollTimer?.cancel();
        _pollTimer = Timer.periodic(
            const Duration(seconds: 3), (_) => _loadDocument());
      } else {
        _pollTimer?.cancel();
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load document';
        _loading = false;
      });
    }
  }

  Future<void> _loadCategories() async {
    try {
      final cats = await _docService.getCategories();
      setState(() => _categories = cats);
    } catch (_) {}
  }

  Future<void> _handleProcess() async {
    setState(() => _processing = true);
    try {
      await _docService.process(widget.documentId);
      setState(() => _doc = _doc?.copyWith(processingStatus: 'PROCESSING'));
    } catch (e) {
      setState(() => _error = 'Failed to start processing');
    } finally {
      setState(() => _processing = false);
    }
  }

  Future<void> _handleDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Document'),
        content:
            const Text('Delete this document? This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    setState(() => _deleting = true);
    try {
      await _docService.delete(widget.documentId);
      if (mounted) context.go('/records');
    } catch (e) {
      setState(() {
        _error = 'Failed to delete';
        _deleting = false;
      });
    }
  }

  Future<void> _showCategorySheet() async {
    await showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Category',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            ..._categories.map(
              (cat) => ListTile(
                leading: Text(cat.icon, style: const TextStyle(fontSize: 20)),
                title: Text(cat.name),
                subtitle: cat.description != null
                    ? Text(cat.description!,
                        style: const TextStyle(fontSize: 12))
                    : null,
                onTap: () async {
                  Navigator.pop(ctx);
                  try {
                    await _docService.updateCategory(
                        widget.documentId, cat.id);
                    _loadDocument();
                  } catch (_) {}
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showCorrectionDialog(HealthMeasurementRef m) async {
    final valueController = TextEditingController(text: m.value.toString());
    final dateController = TextEditingController(
        text: m.measuredAt?.split('T').first ?? '');

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Correct Measurement'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${m.parameter?.displayName ?? m.parameterId} — Original: "${m.originalText}"',
              style: const TextStyle(
                  fontSize: 13, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: valueController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Value'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: dateController,
              decoration: const InputDecoration(
                labelText: 'Date (YYYY-MM-DD)',
                hintText: '2024-01-15',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final value = double.tryParse(valueController.text);
              if (value == null) return;
              Navigator.pop(ctx);
              try {
                await _healthService.correctMeasurement(
                  m.id,
                  value: value,
                  measuredAt: dateController.text.isNotEmpty
                      ? dateController.text
                      : null,
                );
                _loadDocument();
              } catch (_) {
                setState(() => _error = 'Failed to correct measurement');
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: LoadingIndicator(message: 'Loading document...'),
      );
    }

    if (_error != null && _doc == null) {
      return Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(children: [
                  IconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () => context.pop()),
                  const Text('Document',
                      style: TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w700)),
                ]),
                AlertBanner(message: _error!, type: AlertType.error),
              ],
            ),
          ),
        ),
      );
    }

    final doc = _doc!;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 8, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => context.pop(),
                    color: AppTheme.textSecondary,
                  ),
                  Expanded(
                    child: Text(
                      doc.originalName,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_error != null)
                      AlertBanner(message: _error!, type: AlertType.error),

                    // Status banner
                    _buildStatusBanner(doc),
                    const SizedBox(height: 12),

                    // Actions
                    Row(
                      children: [
                        if (doc.processingStatus == 'UPLOADED' ||
                            doc.processingStatus == 'FAILED')
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ElevatedButton.icon(
                              onPressed:
                                  _processing ? null : _handleProcess,
                              icon: const Icon(Icons.refresh, size: 14),
                              label: Text(
                                _processing ? 'Starting...' : 'Process OCR',
                                style: const TextStyle(fontSize: 13),
                              ),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 8),
                              ),
                            ),
                          ),
                        OutlinedButton.icon(
                          onPressed: _showCategorySheet,
                          icon: const Icon(Icons.label_outline, size: 14),
                          label: const Text('Category',
                              style: TextStyle(fontSize: 13)),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 8),
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          onPressed: _deleting ? null : _handleDelete,
                          icon: const Icon(Icons.delete_outline,
                              color: AppTheme.danger),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Tab bar
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.bgInput,
                        borderRadius:
                            BorderRadius.circular(AppTheme.radiusSm),
                      ),
                      padding: const EdgeInsets.all(3),
                      child: TabBar(
                        controller: _tabController,
                        indicatorSize: TabBarIndicatorSize.tab,
                        indicator: BoxDecoration(
                          color: AppTheme.bgCard,
                          borderRadius: BorderRadius.circular(6),
                          boxShadow: AppTheme.shadowSm,
                        ),
                        labelColor: AppTheme.primary,
                        unselectedLabelColor: AppTheme.textMuted,
                        labelStyle: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600),
                        dividerColor: Colors.transparent,
                        tabs: const [
                          Tab(text: 'Info'),
                          Tab(text: 'OCR Text'),
                          Tab(text: 'Parameters'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Tab content
                    SizedBox(
                      height: 400,
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildInfoTab(doc),
                          _buildTextTab(doc),
                          _buildParamsTab(doc),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBanner(MedicalDocument doc) {
    Color bgColor;
    Color textColor;
    IconData icon;
    String label;

    switch (doc.processingStatus) {
      case 'PROCESSING':
        bgColor = AppTheme.warningLight;
        textColor = AppTheme.warning;
        icon = Icons.refresh;
        label = 'Processing...';
      case 'COMPLETED':
        bgColor = AppTheme.successLight;
        textColor = AppTheme.success;
        icon = Icons.check_circle;
        label = 'Processing completed';
      case 'FAILED':
        bgColor = AppTheme.dangerLight;
        textColor = AppTheme.danger;
        icon = Icons.error;
        label = 'Processing failed';
      default:
        bgColor = AppTheme.primaryLight;
        textColor = AppTheme.primary;
        icon = Icons.access_time;
        label = 'Uploaded - Pending processing';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: textColor),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(fontSize: 13, color: textColor)),
                if (doc.processingError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(doc.processingError!,
                        style: TextStyle(fontSize: 12, color: textColor)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTab(MedicalDocument doc) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(AppTheme.radius),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          _infoRow('File Name', doc.originalName),
          _infoRow('File Type', doc.fileType),
          _infoRow('File Size',
              '${(doc.fileSize / 1024).toStringAsFixed(1)} KB'),
          _infoRow('Uploaded', _formatDate(doc.uploadedAt)),
          _infoRow(
            'Category',
            doc.category != null
                ? '${doc.category!.icon} ${doc.category!.name}'
                : 'Not categorized',
          ),
          _infoRow('Status', doc.processingStatus),
          if (doc.extractedText?.confidence != null)
            _infoRow(
              'OCR Confidence',
              '${doc.extractedText!.confidence!.toStringAsFixed(1)}%',
            ),
          if (doc.tags.isNotEmpty) ...[
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerLeft,
              child: Wrap(
                spacing: 4,
                runSpacing: 4,
                children: doc.tags.map((t) => Chip(label: Text(t.tag))).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTextTab(MedicalDocument doc) {
    if (doc.extractedText == null) {
      return const EmptyState(
        icon: Icons.description,
        title: 'No text extracted',
        description: 'Process this document to extract text using OCR',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (doc.extractedText!.confidence != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              'Confidence: ${doc.extractedText!.confidence!.toStringAsFixed(1)}%',
              style:
                  const TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
          ),
        Expanded(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.bgInput,
              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
              border: Border.all(color: AppTheme.border),
            ),
            child: SingleChildScrollView(
              child: Text(
                doc.extractedText!.text ?? 'No text extracted',
                style: const TextStyle(
                    fontSize: 13, height: 1.7, color: AppTheme.textPrimary),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildParamsTab(MedicalDocument doc) {
    if (doc.healthMeasurements.isEmpty) {
      return EmptyState(
        icon: Icons.monitor_heart,
        title: 'No parameters extracted',
        description: doc.processingStatus == 'COMPLETED'
            ? 'No health parameters found in this document'
            : 'Process the document first',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const AlertBanner(
          message:
              'Values are extracted automatically and may need review. Tap a measurement to correct it.',
          type: AlertType.warning,
        ),
        Expanded(
          child: ListView.builder(
            itemCount: doc.healthMeasurements.length,
            itemBuilder: (context, index) {
              final m = doc.healthMeasurements[index];
              return ParamCard(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: AppTheme.primaryLight,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.monitor_heart,
                      size: 18, color: AppTheme.primary),
                ),
                title: m.parameter?.displayName ?? m.parameterId ?? 'Unknown',
                subtitle: m.originalText != null ? '"${m.originalText}"' : null,
                trailing: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      m.value.toString(),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary,
                      ),
                    ),
                    Text(m.unit,
                        style: const TextStyle(
                            fontSize: 12, color: AppTheme.textMuted)),
                    if (m.isManualEntry)
                      const StatusBadge(status: 'COMPLETED', small: true),
                  ],
                ),
                onTap: () => _showCorrectionDialog(m),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppTheme.border, width: 0.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 14, color: AppTheme.textSecondary)),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(
                  fontSize: 14, fontWeight: FontWeight.w500),
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    final date = DateTime.tryParse(dateStr);
    if (date == null) return dateStr;
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}
