import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/document_service.dart';
import '../models/document.dart';
import '../models/category.dart';
import '../theme/app_theme.dart';
import '../widgets/document_list_item.dart';
import '../widgets/loading_indicator.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  final _docService = DocumentService();
  List<MedicalDocument> _documents = [];
  List<MedicalCategory> _categories = [];
  bool _loading = true;
  int _page = 1;
  int _totalPages = 1;
  String _filterStatus = '';
  String _filterCategory = '';

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadDocuments();
  }

  Future<void> _loadCategories() async {
    try {
      final cats = await _docService.getCategories();
      setState(() => _categories = cats);
    } catch (_) {}
  }

  Future<void> _loadDocuments() async {
    setState(() => _loading = true);
    try {
      final data = await _docService.list(
        page: _page,
        limit: 20,
        status: _filterStatus.isEmpty ? null : _filterStatus,
        categoryId: _filterCategory.isEmpty ? null : _filterCategory,
      );

      final docs = (data['documents'] as List)
          .map((d) => MedicalDocument.fromJson(d as Map<String, dynamic>))
          .toList();

      setState(() {
        _documents = docs;
        _totalPages =
            (data['pagination']?['pages'] as num?)?.toInt() ?? 1;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Medical Records',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),

              // Filters
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.border),
                        borderRadius:
                            BorderRadius.circular(AppTheme.radiusSm),
                        color: AppTheme.bgCard,
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          isExpanded: true,
                          value: _filterStatus.isEmpty
                              ? null
                              : _filterStatus,
                          hint: const Text('All Statuses',
                              style: TextStyle(fontSize: 13)),
                          style: const TextStyle(
                              fontSize: 13, color: AppTheme.textPrimary),
                          items: const [
                            DropdownMenuItem(
                                value: '', child: Text('All Statuses')),
                            DropdownMenuItem(
                                value: 'UPLOADED', child: Text('Uploaded')),
                            DropdownMenuItem(
                                value: 'PROCESSING',
                                child: Text('Processing')),
                            DropdownMenuItem(
                                value: 'COMPLETED',
                                child: Text('Completed')),
                            DropdownMenuItem(
                                value: 'FAILED', child: Text('Failed')),
                          ],
                          onChanged: (v) {
                            setState(() {
                              _filterStatus = v ?? '';
                              _page = 1;
                            });
                            _loadDocuments();
                          },
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.border),
                        borderRadius:
                            BorderRadius.circular(AppTheme.radiusSm),
                        color: AppTheme.bgCard,
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          isExpanded: true,
                          value: _filterCategory.isEmpty
                              ? null
                              : _filterCategory,
                          hint: const Text('All Categories',
                              style: TextStyle(fontSize: 13)),
                          style: const TextStyle(
                              fontSize: 13, color: AppTheme.textPrimary),
                          items: [
                            const DropdownMenuItem(
                                value: '',
                                child: Text('All Categories')),
                            ..._categories.map(
                              (c) => DropdownMenuItem(
                                value: c.id.toString(),
                                child: Text('${c.icon} ${c.name}'),
                              ),
                            ),
                          ],
                          onChanged: (v) {
                            setState(() {
                              _filterCategory = v ?? '';
                              _page = 1;
                            });
                            _loadDocuments();
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Content
              Expanded(
                child: _loading
                    ? const LoadingIndicator(message: 'Loading records...')
                    : _documents.isEmpty
                        ? EmptyState(
                            icon: Icons.description,
                            title: 'No records found',
                            description: _filterStatus.isNotEmpty ||
                                    _filterCategory.isNotEmpty
                                ? 'Try changing filters'
                                : 'Upload your first medical document',
                            action: ElevatedButton.icon(
                              onPressed: () => context.go('/upload'),
                              icon: const Icon(Icons.upload, size: 16),
                              label: const Text('Upload Document'),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadDocuments,
                            child: ListView.builder(
                              itemCount: _documents.length +
                                  (_totalPages > 1 ? 1 : 0),
                              itemBuilder: (context, index) {
                                if (index == _documents.length) {
                                  return _buildPagination();
                                }
                                return DocumentListItem(
                                  document: _documents[index],
                                  onTap: () => context.go(
                                      '/documents/${_documents[index].id}'),
                                );
                              },
                            ),
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPagination() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          OutlinedButton(
            onPressed: _page > 1
                ? () {
                    setState(() => _page--);
                    _loadDocuments();
                  }
                : null,
            child: const Text('Previous'),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text('$_page / $_totalPages',
                style: const TextStyle(fontSize: 13)),
          ),
          OutlinedButton(
            onPressed: _page < _totalPages
                ? () {
                    setState(() => _page++);
                    _loadDocuments();
                  }
                : null,
            child: const Text('Next'),
          ),
        ],
      ),
    );
  }
}
