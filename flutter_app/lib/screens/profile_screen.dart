import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../services/profile_service.dart';
import '../models/user.dart';
import '../theme/app_theme.dart';
import '../widgets/loading_indicator.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _profileService = ProfileService();
  User? _profile;
  bool _loading = true;
  bool _editing = false;
  bool _saving = false;
  String? _message;
  String? _error;

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dobController = TextEditingController();
  String _gender = '';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await _profileService.getProfile();
      setState(() {
        _profile = profile;
        _nameController.text = profile.name;
        _phoneController.text = profile.phone ?? '';
        _dobController.text = profile.dateOfBirth ?? '';
        _gender = profile.gender ?? '';
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load profile';
        _loading = false;
      });
    }
  }

  Future<void> _handleSave() async {
    setState(() {
      _saving = true;
      _error = null;
      _message = null;
    });

    try {
      await _profileService.updateProfile(
        name: _nameController.text,
        phone: _phoneController.text,
        dateOfBirth: _dobController.text,
        gender: _gender,
      );
      setState(() {
        _message = 'Profile updated successfully';
        _editing = false;
      });
      _loadProfile();
    } catch (e) {
      setState(() => _error = 'Failed to update profile');
    } finally {
      setState(() => _saving = false);
    }
  }

  Future<void> _handleLogout() async {
    await context.read<AuthProvider>().logout();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: LoadingIndicator(message: 'Loading profile...'),
      );
    }

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Header
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => context.pop(),
                    color: AppTheme.textSecondary,
                  ),
                  const Text(
                    'Profile',
                    style:
                        TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Avatar
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.primary, AppTheme.secondary],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(36),
                ),
                child: Center(
                  child: Text(
                    _profile?.name.isNotEmpty == true
                        ? _profile!.name[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _profile?.name ?? '',
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w700),
              ),
              Text(
                _profile?.email ?? '',
                style: const TextStyle(
                    fontSize: 14, color: AppTheme.textSecondary),
              ),
              if (_profile?.counts != null) ...[
                const SizedBox(height: 4),
                Text(
                  '${_profile!.counts!['documents'] ?? 0} documents • ${_profile!.counts!['healthMeasurements'] ?? 0} measurements',
                  style: const TextStyle(
                      fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
              const SizedBox(height: 20),

              if (_message != null)
                AlertBanner(message: _message!, type: AlertType.success),
              if (_error != null)
                AlertBanner(message: _error!, type: AlertType.error),

              // Profile card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(AppTheme.radius),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Personal Information',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                        if (!_editing)
                          OutlinedButton(
                            onPressed: () =>
                                setState(() => _editing = true),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 6),
                            ),
                            child: const Text('Edit',
                                style: TextStyle(fontSize: 13)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    if (_editing) ...[
                      TextField(
                        controller: _nameController,
                        decoration:
                            const InputDecoration(labelText: 'Full Name'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phoneController,
                        decoration: const InputDecoration(
                            labelText: 'Phone', hintText: 'Optional'),
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _dobController,
                        decoration: const InputDecoration(
                          labelText: 'Date of Birth',
                          hintText: 'YYYY-MM-DD',
                        ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: _gender.isEmpty ? null : _gender,
                        decoration:
                            const InputDecoration(labelText: 'Gender'),
                        items: const [
                          DropdownMenuItem(
                              value: '', child: Text('Prefer not to say')),
                          DropdownMenuItem(
                              value: 'male', child: Text('Male')),
                          DropdownMenuItem(
                              value: 'female', child: Text('Female')),
                          DropdownMenuItem(
                              value: 'other', child: Text('Other')),
                        ],
                        onChanged: (v) =>
                            setState(() => _gender = v ?? ''),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _saving ? null : _handleSave,
                              icon: const Icon(Icons.save, size: 16),
                              label: Text(_saving
                                  ? 'Saving...'
                                  : 'Save Changes'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          OutlinedButton(
                            onPressed: () =>
                                setState(() => _editing = false),
                            child: const Text('Cancel'),
                          ),
                        ],
                      ),
                    ] else ...[
                      _infoRow('Email', _profile?.email ?? ''),
                      _infoRow('Phone', _profile?.phone ?? 'Not set'),
                      _infoRow(
                          'Date of Birth',
                          _profile?.dateOfBirth ?? 'Not set'),
                      _infoRow(
                        'Gender',
                        _profile?.gender != null && _profile!.gender!.isNotEmpty
                            ? _profile!.gender![0].toUpperCase() +
                                _profile!.gender!.substring(1)
                            : 'Not set',
                      ),
                      _infoRow(
                        'Member since',
                        _profile?.createdAt != null
                            ? _formatDate(_profile!.createdAt!)
                            : 'Unknown',
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Logout
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _handleLogout,
                  icon: const Icon(Icons.logout, size: 16),
                  label: const Text('Sign Out'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.danger,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: const BoxDecoration(
        border:
            Border(bottom: BorderSide(color: AppTheme.border, width: 0.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 14, color: AppTheme.textSecondary)),
          Text(value,
              style: const TextStyle(
                  fontSize: 14, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    final date = DateTime.tryParse(dateStr);
    if (date == null) return dateStr;
    return '${date.day}/${date.month}/${date.year}';
  }
}
