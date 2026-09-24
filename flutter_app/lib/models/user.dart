class User {
  final String id;
  final String email;
  final String name;
  final String? phone;
  final String? dateOfBirth;
  final String? gender;
  final String? createdAt;
  final Map<String, int>? counts;

  User({
    required this.id,
    required this.email,
    required this.name,
    this.phone,
    this.dateOfBirth,
    this.gender,
    this.createdAt,
    this.counts,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      dateOfBirth: json['dateOfBirth'] as String?,
      gender: json['gender'] as String?,
      createdAt: json['createdAt'] as String?,
      counts: json['_count'] != null
          ? Map<String, int>.from(
              (json['_count'] as Map).map(
                (k, v) => MapEntry(k as String, (v as num).toInt()),
              ),
            )
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'phone': phone,
      'dateOfBirth': dateOfBirth,
      'gender': gender,
    };
  }
}
