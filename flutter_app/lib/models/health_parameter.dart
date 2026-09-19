class HealthParameter {
  final String id;
  final String name;
  final String displayName;
  final String defaultUnit;
  final double? normalMin;
  final double? normalMax;
  final int measurementCount;
  final LatestMeasurement? latestMeasurement;

  HealthParameter({
    required this.id,
    required this.name,
    required this.displayName,
    required this.defaultUnit,
    this.normalMin,
    this.normalMax,
    this.measurementCount = 0,
    this.latestMeasurement,
  });

  factory HealthParameter.fromJson(Map<String, dynamic> json) {
    return HealthParameter(
      id: json['id'].toString(),
      name: json['name'] as String,
      displayName: json['displayName'] as String,
      defaultUnit: json['defaultUnit'] as String? ?? '',
      normalMin: (json['normalMin'] as num?)?.toDouble(),
      normalMax: (json['normalMax'] as num?)?.toDouble(),
      measurementCount: (json['measurementCount'] as num?)?.toInt() ?? 0,
      latestMeasurement: json['latestMeasurement'] != null
          ? LatestMeasurement.fromJson(
              json['latestMeasurement'] as Map<String, dynamic>)
          : null,
    );
  }
}

class LatestMeasurement {
  final double value;
  final String unit;

  LatestMeasurement({required this.value, required this.unit});

  factory LatestMeasurement.fromJson(Map<String, dynamic> json) {
    return LatestMeasurement(
      value: (json['value'] as num).toDouble(),
      unit: json['unit'] as String? ?? '',
    );
  }
}

class HealthMeasurement {
  final int id;
  final double value;
  final String unit;
  final String? measuredAt;
  final bool isManualEntry;
  final double? confidence;
  final String? originalText;

  HealthMeasurement({
    required this.id,
    required this.value,
    required this.unit,
    this.measuredAt,
    this.isManualEntry = false,
    this.confidence,
    this.originalText,
  });

  factory HealthMeasurement.fromJson(Map<String, dynamic> json) {
    return HealthMeasurement(
      id: json['id'] as int,
      value: (json['value'] as num).toDouble(),
      unit: json['unit'] as String? ?? '',
      measuredAt: json['measuredAt'] as String?,
      isManualEntry: json['isManualEntry'] as bool? ?? false,
      confidence: (json['confidence'] as num?)?.toDouble(),
      originalText: json['originalText'] as String?,
    );
  }
}

class HealthTrendData {
  final HealthParameter parameter;
  final int dataPoints;
  final List<HealthMeasurement> measurements;

  HealthTrendData({
    required this.parameter,
    required this.dataPoints,
    required this.measurements,
  });

  factory HealthTrendData.fromJson(Map<String, dynamic> json) {
    return HealthTrendData(
      parameter: HealthParameter.fromJson(
          json['parameter'] as Map<String, dynamic>),
      dataPoints: (json['dataPoints'] as num?)?.toInt() ?? 0,
      measurements: (json['measurements'] as List<dynamic>?)
              ?.map(
                  (m) => HealthMeasurement.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
