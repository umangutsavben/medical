/**
 * Document Categorization Service
 * 
 * Rule-based automatic categorization of medical documents
 * based on OCR extracted text and document metadata.
 */

interface CategoryRule {
  categoryName: string;
  keywords: string[];
  weight: number;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    categoryName: 'Blood Test',
    keywords: [
      'blood test', 'cbc', 'complete blood count', 'hemoglobin', 'haemoglobin',
      'hematology', 'haematology', 'wbc', 'rbc', 'platelet', 'blood group',
      'hb ', 'hgb', 'mcv', 'mch', 'mchc', 'esr', 'blood sugar', 'glucose',
      'fasting', 'lipid profile', 'cholesterol', 'triglyceride', 'hba1c',
      'creatinine', 'urea', 'electrolytes', 'liver function', 'kidney function',
      'thyroid', 'tsh', 'iron', 'ferritin', 'vitamin', 'metabolic panel',
    ],
    weight: 1,
  },
  {
    categoryName: 'Lab Report',
    keywords: [
      'laboratory', 'lab report', 'pathology', 'test report', 'investigation',
      'culture', 'sensitivity', 'urinalysis', 'urine test', 'stool test',
      'specimen', 'sample', 'reference range', 'normal range',
    ],
    weight: 0.9,
  },
  {
    categoryName: 'Prescription',
    keywords: [
      'prescription', 'rx', 'prescribed', 'tablet', 'capsule', 'syrup',
      'injection', 'dose', 'dosage', 'mg', 'twice daily', 'once daily',
      'before food', 'after food', 'sos', 'prn', 'medication',
      'medicine', 'drug', 'pharmacy', 'dispense',
    ],
    weight: 1,
  },
  {
    categoryName: 'Scan Report',
    keywords: [
      'x-ray', 'xray', 'mri', 'ct scan', 'ultrasound', 'usg', 'sonography',
      'ecg', 'ekg', 'electrocardiogram', 'echocardiogram', 'echo',
      'mammogram', 'pet scan', 'dexa', 'bone density', 'angiogram',
      'radiolog', 'imaging', 'scan report', 'impression',
    ],
    weight: 1,
  },
  {
    categoryName: 'Discharge Summary',
    keywords: [
      'discharge summary', 'discharge', 'admitted', 'admission',
      'hospital stay', 'inpatient', 'ward', 'bed no', 'bed number',
      'date of admission', 'date of discharge', 'final diagnosis',
      'treatment given', 'discharge advice', 'follow up',
    ],
    weight: 1,
  },
  {
    categoryName: 'Medical Bill',
    keywords: [
      'bill', 'invoice', 'receipt', 'payment', 'amount', 'total',
      'charges', 'consultation fee', 'procedure charges',
      'insurance', 'claim', 'copay', 'deductible', 'billing',
    ],
    weight: 0.9,
  },
];

export interface CategorizationResult {
  categoryName: string;
  confidence: number;
  tags: string[];
}

export class CategorizerService {
  /**
   * Categorize a document based on its extracted text and filename.
   */
  categorize(text: string, fileName?: string): CategorizationResult {
    const searchText = `${text} ${fileName || ''}`.toLowerCase();
    
    let bestCategory = 'General';
    let bestScore = 0;
    const tags: string[] = [];

    for (const rule of CATEGORY_RULES) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of rule.keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          score += rule.weight;
          matchedKeywords.push(keyword);
        }
      }

      if (matchedKeywords.length > 0) {
        // Add matched keywords as tags
        tags.push(...matchedKeywords.slice(0, 5)); // Limit tags
      }

      if (score > bestScore) {
        bestScore = score;
        bestCategory = rule.categoryName;
      }
    }

    // Calculate confidence (0-1)
    const confidence = Math.min(bestScore / 3, 1); // 3+ keyword matches = full confidence

    // Deduplicate tags
    const uniqueTags = [...new Set(tags)].slice(0, 10);

    return {
      categoryName: bestCategory,
      confidence,
      tags: uniqueTags,
    };
  }
}

export const categorizerService = new CategorizerService();
