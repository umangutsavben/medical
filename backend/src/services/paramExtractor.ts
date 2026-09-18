/**
 * Health Parameter Extraction Service
 * 
 * Extracts structured health parameters from OCR text using
 * regex patterns and medical terminology matching.
 * 
 * This is NOT AI-based — it uses deterministic pattern matching
 * to reliably extract common health parameters.
 * 
 * Supported parameters:
 * - Blood Glucose (fasting, random, post-prandial)
 * - Hemoglobin (Hb, Hgb)
 * - Blood Pressure (systolic/diastolic)
 * - Cholesterol (total, HDL, LDL)
 * - Heart Rate (pulse, HR)
 * - HbA1c
 * - Creatinine
 * - WBC count
 * - Platelet count
 */

export interface ExtractedParameter {
  parameterName: string;   // e.g., "glucose"
  value: number;
  unit: string;
  confidence: number;      // 0-1 confidence score
  originalText: string;    // The matched text for traceability
}

interface PatternConfig {
  parameterName: string;
  patterns: RegExp[];
  unit: string;
  minPlausible: number;
  maxPlausible: number;
}

const PARAMETER_PATTERNS: PatternConfig[] = [
  {
    parameterName: 'glucose',
    patterns: [
      /(?:blood\s*)?(?:sugar|glucose)[\s:.\-]*(?:(?:fasting|random|pp|post[\s-]*prandial)[\s:.\-]*)?(\d+(?:\.\d+)?)\s*(?:mg\/d[lL]|mg%)?/gi,
      /(?:fasting|random|pp)\s*(?:blood\s*)?(?:sugar|glucose)[\s:.\-]*(\d+(?:\.\d+)?)\s*(?:mg\/d[lL]|mg%)?/gi,
      /(?:FBS|RBS|PPBS|FPG|RPG)[\s:.\-]*(\d+(?:\.\d+)?)\s*(?:mg\/d[lL]|mg%)?/gi,
      /glucose[\s,.:]+(\d+(?:\.\d+)?)/gi,
    ],
    unit: 'mg/dL',
    minPlausible: 30,
    maxPlausible: 600,
  },
  {
    parameterName: 'hemoglobin',
    patterns: [
      /(?:haemoglobin|hemoglobin|h[bg]b?)[\s:.\-]*(\d+(?:\.\d+)?)\s*(?:g\/d[lL]|g%|gm\/d[lL])?/gi,
      /(?:Hb|Hgb|HGB)[\s:.\-]*(\d+(?:\.\d+)?)\s*(?:g\/d[lL]|g%)?/gi,
    ],
    unit: 'g/dL',
    minPlausible: 3,
    maxPlausible: 25,
  },
  {
    parameterName: 'systolic_bp',
    patterns: [
      /(?:blood\s*pressure|bp|b\.p\.)[\s:.\-]*(\d{2,3})\s*[\/\\]\s*\d{2,3}\s*(?:mm\s*hg|mmhg)?/gi,
      /(?:systolic)[\s:.\-]*(\d{2,3})\s*(?:mm\s*hg|mmhg)?/gi,
    ],
    unit: 'mmHg',
    minPlausible: 60,
    maxPlausible: 250,
  },
  {
    parameterName: 'diastolic_bp',
    patterns: [
      /(?:blood\s*pressure|bp|b\.p\.)[\s:.\-]*\d{2,3}\s*[\/\\]\s*(\d{2,3})\s*(?:mm\s*hg|mmhg)?/gi,
      /(?:diastolic)[\s:.\-]*(\d{2,3})\s*(?:mm\s*hg|mmhg)?/gi,
    ],
    unit: 'mmHg',
    minPlausible: 30,
    maxPlausible: 160,
  },
  {
    parameterName: 'cholesterol',
    patterns: [
      /(?:total\s*)?cholesterol[\s:.\-]*(\d+(?:\.\d+)?)\s*(?:mg\/d[lL]|mg%)?/gi,
      /(?:TC|T\.CHOL)[\s:.\-]*(\d+(?:\.\d+)?)\s*(?:mg\/d[lL])?/gi,
    ],
    unit: 'mg/dL',
    minPlausible: 50,
    maxPlausible: 500,
  },
  {
    parameterName: 'heart_rate',
    patterns: [
      /(?:heart\s*rate|pulse|pulse\s*rate|hr)[\s:.\-]*(\d{2,3})\s*(?:bpm|beats?\s*(?:per|\/)\s*min(?:ute)?|\/min)?/gi,
    ],
    unit: 'bpm',
    minPlausible: 30,
    maxPlausible: 250,
  },
  {
    parameterName: 'hba1c',
    patterns: [
      /(?:hba1c|hb\s*a1c|glycated\s*h(?:a?e)?moglobin|glycosylated\s*h(?:a?e)?moglobin)[\s:.\-]*(\d+(?:\.\d+)?)\s*%?/gi,
      /(?:A1C|A1c)[\s:.\-]*(\d+(?:\.\d+)?)\s*%?/gi,
    ],
    unit: '%',
    minPlausible: 3,
    maxPlausible: 20,
  },
  {
    parameterName: 'creatinine',
    patterns: [
      /(?:serum\s*)?creatinine[\s:.\-]*(\d+(?:\.\d+)?)\s*(?:mg\/d[lL]|mg%)?/gi,
    ],
    unit: 'mg/dL',
    minPlausible: 0.1,
    maxPlausible: 20,
  },
  {
    parameterName: 'wbc',
    patterns: [
      /(?:WBC|white\s*blood\s*cells?|total\s*(?:wbc|leucocyte|leukocyte)\s*count)[\s:.\-]*(\d+(?:[,.]?\d+)?)\s*(?:cells?\/?\s*(?:mc|µ|u)?[lL]|thou(?:sand)?s?\/?\s*(?:mc|µ|u)?[lL]|\/?\s*(?:mc|µ|u)?[lL]|x\s*10\^?[39])?/gi,
    ],
    unit: 'cells/mcL',
    minPlausible: 1000,
    maxPlausible: 50000,
  },
  {
    parameterName: 'platelets',
    patterns: [
      /(?:platelet\s*count|platelets?)[\s:.\-]*(\d+(?:[,.]?\d+)?)\s*(?:cells?\/?\s*(?:mc|µ|u)?[lL]|thou(?:sand)?s?\/?\s*(?:mc|µ|u)?[lL]|lakh|x\s*10\^?[359])?/gi,
    ],
    unit: 'cells/mcL',
    minPlausible: 10000,
    maxPlausible: 900000,
  },
];

export class ParamExtractorService {
  /**
   * Extract health parameters from OCR text.
   * Returns an array of extracted parameters with values and confidence scores.
   */
  extract(text: string): ExtractedParameter[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const results: ExtractedParameter[] = [];
    const seen = new Set<string>();

    for (const paramConfig of PARAMETER_PATTERNS) {
      for (const pattern of paramConfig.patterns) {
        // Reset regex state for each use
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;

        while ((match = regex.exec(text)) !== null) {
          const rawValue = match[1].replace(/,/g, '');
          const value = parseFloat(rawValue);

          if (isNaN(value)) continue;

          // Check plausibility range
          if (value < paramConfig.minPlausible || value > paramConfig.maxPlausible) continue;

          // Skip if we already found this parameter (take the first match)
          if (seen.has(paramConfig.parameterName)) continue;
          seen.add(paramConfig.parameterName);

          // Calculate confidence based on match quality
          const confidence = this.calculateConfidence(match[0], value, paramConfig);

          results.push({
            parameterName: paramConfig.parameterName,
            value,
            unit: paramConfig.unit,
            confidence,
            originalText: match[0].trim(),
          });
        }
      }
    }

    return results;
  }

  private calculateConfidence(
    matchText: string,
    value: number,
    config: PatternConfig
  ): number {
    let confidence = 0.6; // Base confidence for a pattern match

    // Boost confidence if unit is explicitly mentioned
    const unitPatterns: Record<string, RegExp> = {
      'mg/dL': /mg\/d[lL]|mg%/i,
      'g/dL': /g\/d[lL]|g%|gm\/d[lL]/i,
      'mmHg': /mm\s*hg|mmhg/i,
      'bpm': /bpm|beats?\s*(?:per|\/)\s*min/i,
      '%': /%/,
      'cells/mcL': /cells?\/?\s*(?:mc|µ|u)?[lL]|thou/i,
    };

    if (unitPatterns[config.unit]?.test(matchText)) {
      confidence += 0.2;
    }

    // Boost if value is in normal range
    if (config.minPlausible <= value && value <= config.maxPlausible) {
      confidence += 0.1;
    }

    // Boost for longer, more specific match text
    if (matchText.length > 15) {
      confidence += 0.05;
    }

    return Math.min(confidence, 0.95);
  }
}

export const paramExtractorService = new ParamExtractorService();
