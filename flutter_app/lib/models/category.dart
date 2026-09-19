class MedicalCategory {
  final int id;
  final String name;
  final String icon;
  final String? description;

  MedicalCategory({
    required this.id,
    required this.name,
    required this.icon,
    this.description,
  });

  factory MedicalCategory.fromJson(Map<String, dynamic> json) {
    return MedicalCategory(
      id: json['id'] as int,
      name: json['name'] as String,
      icon: json['icon'] as String? ?? '📋',
      description: json['description'] as String?,
    );
  }
}
