import type { HealthMarker } from '@/types/health'

export function makeMarker(
  id: string,
  name: string,
  standardName: string,
  value: number,
  unit: string,
  min: number,
  max: number,
  category: HealthMarker['category'],
  timestamp: string,
  confidence = 92,
  trend?: HealthMarker['trend']
): HealthMarker {
  return {
    id,
    name,
    standardName,
    value,
    unit,
    normalRange: { min, max, unit },
    category,
    timestamp,
    extractionConfidence: confidence,
    isAbnormal: value < min || value > max,
    trend,
  }
}

// Reference ranges
export const MARKER_RANGES = {
  hba1c: { min: 4.0, max: 5.6, unit: '%', label: 'HbA1c', category: 'metabolic' as const },
  fasting_glucose: { min: 70, max: 100, unit: 'mg/dL', label: 'Fasting Glucose', category: 'metabolic' as const },
  systolic_bp: { min: 90, max: 120, unit: 'mmHg', label: 'Systolic BP', category: 'cardiac' as const },
  diastolic_bp: { min: 60, max: 80, unit: 'mmHg', label: 'Diastolic BP', category: 'cardiac' as const },
  hemoglobin: { min: 12.0, max: 17.5, unit: 'g/dL', label: 'Hemoglobin', category: 'blood' as const },
  creatinine: { min: 0.6, max: 1.2, unit: 'mg/dL', label: 'Creatinine', category: 'renal' as const },
  cholesterol: { min: 0, max: 200, unit: 'mg/dL', label: 'Total Cholesterol', category: 'cardiac' as const },
  triglycerides: { min: 0, max: 150, unit: 'mg/dL', label: 'Triglycerides', category: 'cardiac' as const },
  ldl: { min: 0, max: 100, unit: 'mg/dL', label: 'LDL Cholesterol', category: 'cardiac' as const },
  hdl: { min: 40, max: 80, unit: 'mg/dL', label: 'HDL Cholesterol', category: 'cardiac' as const },
  tsh: { min: 0.4, max: 4.0, unit: 'mIU/L', label: 'TSH', category: 'hormonal' as const },
  ferritin: { min: 12, max: 300, unit: 'ng/mL', label: 'Ferritin', category: 'blood' as const },
  vitamin_d: { min: 30, max: 100, unit: 'ng/mL', label: 'Vitamin D', category: 'nutritional' as const },
  alt: { min: 7, max: 56, unit: 'U/L', label: 'ALT', category: 'hepatic' as const },
  uric_acid: { min: 2.4, max: 7.0, unit: 'mg/dL', label: 'Uric Acid', category: 'renal' as const },
}
