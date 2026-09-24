import 'category.dart';

class DocumentTag {
  final String id;
  final String tag;

  DocumentTag({required this.id, required this.tag});

  factory DocumentTag.fromJson(Map<String, dynamic> json) {
    return DocumentTag(
      id: json['id'] as String,
      tag: json['tag'] as String,
    );
  }
}

class ExtractedText {
  final String id;
  final String? text;
  final double? confidence;
  final String? snippet;

  ExtractedText({required this.id, this.text, this.confidence, this.snippet});

  factory ExtractedText.fromJson(Map<String, dynamic> json) {
    return ExtractedText(
      id: json['id'] as String,
      text: json['text'] as String?,
      confidence: (json['confidence'] as num?)?.toDouble(),
      snippet: json['snippet'] as String?,
    );
  }
}

class MedicalDocument {
  final String id;
  final String originalName;
  final String fileType;
  final int fileSize;
  final String processingStatus;
  final String? processingError;
  final String uploadedAt;
  final MedicalCategory? category;
  final List<DocumentTag> tags;
  final ExtractedText? extractedText;
  final List<HealthMeasurementRef> healthMeasurements;
  final Map<String, int>? counts;

  MedicalDocument({
    required this.id,
    required this.originalName,
    required this.fileType,
    required this.fileSize,
    required this.processingStatus,
    this.processingError,
    required this.uploadedAt,
    this.category,
    this.tags = const [],
    this.extractedText,
    this.healthMeasurements = const [],
    this.counts,
  });

  factory MedicalDocument.fromJson(Map<String, dynamic> json) {
    return MedicalDocument(
      id: json['id'] as String,
      originalName: json['originalName'] as String,
      fileType: json['fileType'] as String,
      fileSize: (json['fileSize'] as num).toInt(),
      processingStatus: json['processingStatus'] as String? ?? 'UPLOADED',
      processingError: json['processingError'] as String?,
      uploadedAt: json['uploadedAt'] as String,
      category: json['category'] != null
          ? MedicalCategory.fromJson(json['category'] as Map<String, dynamic>)
          : null,
      tags: (json['tags'] as List<dynamic>?)
              ?.map((t) => DocumentTag.fromJson(t as Map<String, dynamic>))
              .toList() ??
          [],
      extractedText: json['extractedText'] != null
          ? ExtractedText.fromJson(json['extractedText'] as Map<String, dynamic>)
          : null,
      healthMeasurements: (json['healthMeasurements'] as List<dynamic>?)
              ?.map((m) =>
                  HealthMeasurementRef.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
      counts: json['_count'] != null
          ? Map<String, int>.from(
              (json['_count'] as Map).map(
                (k, v) => MapEntry(k as String, (v as num).toInt()),
              ),
            )
          : null,
    );
  }

  MedicalDocument copyWith({String? processingStatus}) {
    return MedicalDocument(
      id: id,
      originalName: originalName,
      fileType: fileType,
      fileSize: fileSize,
      processingStatus: processingStatus ?? this.processingStatus,
      processingError: processingError,
      uploadedAt: uploadedAt,
      category: category,
      tags: tags,
      extractedText: extractedText,
      healthMeasurements: healthMeasurements,
      counts: counts,
    );
  }
}

class HealthMeasurementRef {
  final String id;
  final double value;
  final String unit;
  final String? originalText;
  final bool isManualEntry;
  final String? measuredAt;
  final double? confidence;
  final String? parameterId;
  final HealthParamRef? parameter;

  HealthMeasurementRef({
    required this.id,
    required this.value,
    required this.unit,
    this.originalText,
    this.isManualEntry = false,
    this.measuredAt,
    this.confidence,
    this.parameterId,
    this.parameter,
  });

  factory HealthMeasurementRef.fromJson(Map<String, dynamic> json) {
    return HealthMeasurementRef(
      id: json['id'] as String,
      value: (json['value'] as num).toDouble(),
      unit: json['unit'] as String? ?? '',
      originalText: json['originalText'] as String?,
      isManualEntry: json['isManualEntry'] as bool? ?? false,
      measuredAt: json['measuredAt'] as String?,
      confidence: (json['confidence'] as num?)?.toDouble(),
      parameterId: json['parameterId'] as String?,
      parameter: json['parameter'] != null
          ? HealthParamRef.fromJson(json['parameter'] as Map<String, dynamic>)
          : null,
    );
  }
}

class HealthParamRef {
  final String? displayName;

  HealthParamRef({this.displayName});

  factory HealthParamRef.fromJson(Map<String, dynamic> json) {
    return HealthParamRef(
      displayName: json['displayName'] as String?,
    );
  }
}
