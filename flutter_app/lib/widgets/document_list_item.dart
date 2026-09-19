import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/document.dart';
import 'status_badge.dart';

class DocumentListItem extends StatelessWidget {
  final MedicalDocument document;
  final VoidCallback onTap;

  const DocumentListItem({
    super.key,
    required this.document,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isPdf = document.fileType.contains('pdf');

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.bgCard,
          borderRadius: BorderRadius.circular(AppTheme.radius),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            // Document icon
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: isPdf
                    ? const Color(0xFFFEE2E2)
                    : const Color(0xFFDBEAFE),
                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
              ),
              child: Center(
                child: Text(
                  isPdf ? '📄' : '🖼️',
                  style: const TextStyle(fontSize: 20),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Document info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    document.originalName,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _buildMeta(),
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textMuted,
                    ),
                  ),
                  if (document.tags.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 4,
                      children: document.tags.take(3).map((t) {
                        return Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.bgInput,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            t.tag,
                            style: const TextStyle(
                                fontSize: 11, color: AppTheme.textSecondary),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),

            // Status + count
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                StatusBadge(status: document.processingStatus),
                if (document.counts != null &&
                    (document.counts!['healthMeasurements'] ?? 0) > 0) ...[
                  const SizedBox(height: 4),
                  Text(
                    '${document.counts!['healthMeasurements']} params',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _buildMeta() {
    final date = DateTime.tryParse(document.uploadedAt);
    final dateStr = date != null
        ? '${date.day}/${date.month}/${date.year}'
        : '';
    final sizeStr = '${(document.fileSize / 1024).toStringAsFixed(0)} KB';
    final catStr =
        document.category != null ? ' • ${document.category!.name}' : '';
    return '$dateStr • $sizeStr$catStr';
  }
}
