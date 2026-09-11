import 'package:flutter/material.dart';

import '../../../core/layout/responsive.dart';
import '../data/personal_documents_repository.dart';
import '../models/personal_document_model.dart';

class PersonalDocumentsScreen extends StatefulWidget {
  const PersonalDocumentsScreen({
    required this.repository,
    super.key,
  });

  final PersonalDocumentsRepository repository;

  @override
  State<PersonalDocumentsScreen> createState() =>
      _PersonalDocumentsScreenState();
}

class _PersonalDocumentsScreenState extends State<PersonalDocumentsScreen> {
  static const _categories = {
    'insurance': 'Insurance',
    'medical': 'Medical',
    'vehicle': 'Vehicle',
    'financial': 'Financial',
    'personal': 'Personal',
    'emergency': 'Emergency',
  };

  List<PersonalDocumentModel> _documents = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final documents = await widget.repository.getDocuments();
      if (!mounted) return;
      setState(() {
        _documents = documents;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = '$error';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Personal Documents'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loading ? null : _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openEditor(),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add document'),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return ListView(
        padding: AppResponsive.pagePadding(context, compact: 16).copyWith(top: 24, bottom: 24),
        children: [
          const Icon(Icons.cloud_off_rounded, size: 44, color: Colors.red),
          const SizedBox(height: 12),
          const Text(
            'Documents could not be loaded.',
            textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(_error!, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          Center(
            child: OutlinedButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            ),
          ),
        ],
      );
    }
    if (_documents.isEmpty) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(24, 80, 24, 120),
        children: const [
          Icon(Icons.description_outlined, size: 58, color: Color(0xFF94A3B8)),
          SizedBox(height: 16),
          Text(
            'No documents yet',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 8),
          Text(
            'Add important information you want to remember.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF64748B)),
          ),
        ],
      );
    }

    return ListView.separated(
      padding: AppResponsive.pagePadding(context).copyWith(top: 16, bottom: 100),
      itemCount: _documents.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final document = _documents[index];
        return _DocumentCard(
          document: document,
          categoryLabel: _categories[document.category] ?? document.category,
          onEdit: () => _openEditor(document),
          onDelete: () => _delete(document),
        );
      },
    );
  }

  Future<void> _openEditor([PersonalDocumentModel? document]) async {
    final result = await showModalBottomSheet<PersonalDocumentInput>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _DocumentEditor(
        document: document,
        categories: _categories,
      ),
    );
    if (result == null) return;
    try {
      if (document == null) {
        await widget.repository.create(result);
      } else {
        await widget.repository.update(document.id, result);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(document == null ? 'Document saved.' : 'Document updated.'),
        ),
      );
      await _load();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save document: $error')),
      );
    }
  }

  Future<void> _delete(PersonalDocumentModel document) async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete document?'),
        content: Text('Delete “${document.title}”?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (shouldDelete != true) return;
    try {
      await widget.repository.delete(document.id);
      await _load();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not delete document: $error')),
      );
    }
  }
}

class _DocumentCard extends StatelessWidget {
  const _DocumentCard({
    required this.document,
    required this.categoryLabel,
    required this.onEdit,
    required this.onDelete,
  });

  final PersonalDocumentModel document;
  final String categoryLabel;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: AppResponsive.pagePadding(context).copyWith(top: 16, bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.description_outlined, color: Color(0xFF2563EB)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    document.title,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                if (document.isImportant)
                  const Chip(
                    label: Text('Important'),
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              categoryLabel,
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
            ),
            if (document.documentType == 'link' && document.linkUrl != null) ...[
              const SizedBox(height: 10),
              Text(
                document.linkUrl!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Color(0xFF2563EB)),
              ),
            ],
            if (document.content != null) ...[
              const SizedBox(height: 10),
              Text(document.content!, maxLines: 4, overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 4,
              runSpacing: 4,
              children: [
                TextButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  label: const Text('Edit'),
                ),
                TextButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline_rounded, size: 18),
                  label: const Text('Delete'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DocumentEditor extends StatefulWidget {
  const _DocumentEditor({
    required this.document,
    required this.categories,
  });

  final PersonalDocumentModel? document;
  final Map<String, String> categories;

  @override
  State<_DocumentEditor> createState() => _DocumentEditorState();
}

class _DocumentEditorState extends State<_DocumentEditor> {
  late final TextEditingController _title;
  late final TextEditingController _content;
  late final TextEditingController _link;
  late String _category;
  late String _type;
  late bool _important;

  @override
  void initState() {
    super.initState();
    final document = widget.document;
    _title = TextEditingController(text: document?.title);
    _content = TextEditingController(text: document?.content);
    _link = TextEditingController(text: document?.linkUrl);
    _category = document?.category ?? 'medical';
    _type = document?.documentType ?? 'text';
    _important = document?.isImportant ?? false;
  }

  @override
  void dispose() {
    _title.dispose();
    _content.dispose();
    _link.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return SafeArea(
      child: Padding(
        padding: AppResponsive.pagePadding(context).copyWith(top: 8, bottom: bottom + 20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.document == null ? 'Add document' : 'Edit document',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _title,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  hintText: 'Insurance card',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _category,
                decoration: const InputDecoration(
                  labelText: 'Category',
                  border: OutlineInputBorder(),
                ),
                items: widget.categories.entries
                    .map(
                      (item) => DropdownMenuItem(
                        value: item.key,
                        child: Text(item.value),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _category = value);
                },
              ),
              const SizedBox(height: 12),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'text', label: Text('Text')),
                  ButtonSegment(value: 'link', label: Text('Link')),
                ],
                selected: {_type},
                onSelectionChanged: (value) =>
                    setState(() => _type = value.first),
              ),
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Text and link documents are supported on mobile. Image and file uploads remain available on the web until native object storage upload is added.',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                    height: 1.3,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (_type == 'link')
                TextField(
                  controller: _link,
                  keyboardType: TextInputType.url,
                  decoration: const InputDecoration(
                    labelText: 'Website URL',
                    border: OutlineInputBorder(),
                  ),
                ),
              if (_type == 'link') const SizedBox(height: 12),
              TextField(
                controller: _content,
                minLines: 4,
                maxLines: 8,
                decoration: InputDecoration(
                  labelText: _type == 'link' ? 'Description' : 'Information',
                  border: const OutlineInputBorder(),
                ),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                value: _important,
                onChanged: (value) => setState(() => _important = value),
                title: const Text('Mark as important'),
              ),
              const SizedBox(height: 8),
              LayoutBuilder(
                builder: (context, constraints) {
                  final compact = constraints.maxWidth < 360;
                  final buttons = [
                    OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    FilledButton(
                      onPressed: _submit,
                      child: Text(widget.document == null ? 'Save' : 'Update'),
                    ),
                  ];
                  return compact
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            buttons[0],
                            const SizedBox(height: 8),
                            buttons[1],
                          ],
                        )
                      : Row(
                          children: [
                            Expanded(child: buttons[0]),
                            const SizedBox(width: 10),
                            Expanded(child: buttons[1]),
                          ],
                        );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _submit() {
    final title = _title.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('A title is required.')),
      );
      return;
    }
    Navigator.pop(
      context,
      PersonalDocumentInput(
        title: title,
        category: _category,
        documentType: _type,
        content: _content.text,
        linkUrl: _link.text,
        isImportant: _important,
      ),
    );
  }
}