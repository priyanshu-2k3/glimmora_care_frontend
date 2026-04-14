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

// Reference ranges (standard adult WHO / ICMR norms)
export const MARKER_RANGES = {
  // Metabolic
  hba1c: { min: 4.0, max: 5.6, unit: '%', label: 'HbA1c', category: 'metabolic' as const },
  fasting_glucose: { min: 70, max: 100, unit: 'mg/dL', label: 'Fasting Glucose', category: 'metabolic' as const },
  postprandial_glucose: { min: 70, max: 140, unit: 'mg/dL', label: 'Postprandial Glucose', category: 'metabolic' as const },
  random_glucose: { min: 70, max: 140, unit: 'mg/dL', label: 'Random Glucose', category: 'metabolic' as const },
  insulin: { min: 2.6, max: 24.9, unit: 'µIU/mL', label: 'Insulin', category: 'hormonal' as const },

  // Cardiac / Lipid
  systolic_bp: { min: 90, max: 120, unit: 'mmHg', label: 'Systolic BP', category: 'cardiac' as const },
  diastolic_bp: { min: 60, max: 80, unit: 'mmHg', label: 'Diastolic BP', category: 'cardiac' as const },
  cholesterol: { min: 0, max: 200, unit: 'mg/dL', label: 'Total Cholesterol', category: 'cardiac' as const },
  triglycerides: { min: 0, max: 150, unit: 'mg/dL', label: 'Triglycerides', category: 'cardiac' as const },
  ldl: { min: 0, max: 100, unit: 'mg/dL', label: 'LDL Cholesterol', category: 'cardiac' as const },
  hdl: { min: 40, max: 80, unit: 'mg/dL', label: 'HDL Cholesterol', category: 'cardiac' as const },
  vldl: { min: 2, max: 30, unit: 'mg/dL', label: 'VLDL', category: 'cardiac' as const },

  // CBC — Blood
  hemoglobin: { min: 12.0, max: 17.5, unit: 'g/dL', label: 'Hemoglobin', category: 'blood' as const },
  rbc: { min: 4.2, max: 5.9, unit: 'million/µL', label: 'RBC Count', category: 'blood' as const },
  wbc: { min: 4000, max: 11000, unit: '/µL', label: 'WBC Count', category: 'blood' as const },
  platelets: { min: 150000, max: 400000, unit: '/µL', label: 'Platelets', category: 'blood' as const },
  hematocrit: { min: 36, max: 52, unit: '%', label: 'Hematocrit', category: 'blood' as const },
  mcv: { min: 80, max: 100, unit: 'fL', label: 'MCV', category: 'blood' as const },
  mch: { min: 27, max: 33, unit: 'pg', label: 'MCH', category: 'blood' as const },
  mchc: { min: 31.5, max: 36.0, unit: 'g/dL', label: 'MCHC', category: 'blood' as const },
  rdw: { min: 11.5, max: 14.5, unit: '%', label: 'RDW', category: 'blood' as const },
  neutrophils: { min: 40, max: 70, unit: '%', label: 'Neutrophils', category: 'blood' as const },
  lymphocytes: { min: 20, max: 45, unit: '%', label: 'Lymphocytes', category: 'blood' as const },
  monocytes: { min: 2, max: 10, unit: '%', label: 'Monocytes', category: 'blood' as const },
  eosinophils: { min: 1, max: 6, unit: '%', label: 'Eosinophils', category: 'blood' as const },
  basophils: { min: 0, max: 2, unit: '%', label: 'Basophils', category: 'blood' as const },
  esr: { min: 0, max: 20, unit: 'mm/hr', label: 'ESR', category: 'blood' as const },
  ferritin: { min: 12, max: 300, unit: 'ng/mL', label: 'Ferritin', category: 'blood' as const },

  // Renal / Kidney
  creatinine: { min: 0.6, max: 1.2, unit: 'mg/dL', label: 'Creatinine', category: 'renal' as const },
  urea: { min: 7, max: 20, unit: 'mg/dL', label: 'Blood Urea', category: 'renal' as const },
  bun: { min: 7, max: 20, unit: 'mg/dL', label: 'BUN', category: 'renal' as const },
  uric_acid: { min: 2.4, max: 7.0, unit: 'mg/dL', label: 'Uric Acid', category: 'renal' as const },
  egfr: { min: 60, max: 120, unit: 'mL/min/1.73m²', label: 'eGFR', category: 'renal' as const },
  sodium: { min: 136, max: 145, unit: 'mEq/L', label: 'Sodium', category: 'renal' as const },
  potassium: { min: 3.5, max: 5.0, unit: 'mEq/L', label: 'Potassium', category: 'renal' as const },
  chloride: { min: 98, max: 106, unit: 'mEq/L', label: 'Chloride', category: 'renal' as const },
  bicarbonate: { min: 22, max: 29, unit: 'mEq/L', label: 'Bicarbonate', category: 'renal' as const },
  calcium: { min: 8.5, max: 10.5, unit: 'mg/dL', label: 'Calcium', category: 'renal' as const },
  phosphorus: { min: 2.5, max: 4.5, unit: 'mg/dL', label: 'Phosphorus', category: 'renal' as const },
  magnesium: { min: 1.7, max: 2.2, unit: 'mg/dL', label: 'Magnesium', category: 'renal' as const },

  // Liver / Hepatic
  alt: { min: 7, max: 56, unit: 'U/L', label: 'ALT (SGPT)', category: 'hepatic' as const },
  ast: { min: 10, max: 40, unit: 'U/L', label: 'AST (SGOT)', category: 'hepatic' as const },
  alp: { min: 44, max: 147, unit: 'U/L', label: 'Alkaline Phosphatase', category: 'hepatic' as const },
  ggt: { min: 9, max: 48, unit: 'U/L', label: 'GGT', category: 'hepatic' as const },
  bilirubin_total: { min: 0.2, max: 1.2, unit: 'mg/dL', label: 'Total Bilirubin', category: 'hepatic' as const },
  bilirubin_direct: { min: 0.0, max: 0.3, unit: 'mg/dL', label: 'Direct Bilirubin', category: 'hepatic' as const },
  bilirubin_indirect: { min: 0.2, max: 0.8, unit: 'mg/dL', label: 'Indirect Bilirubin', category: 'hepatic' as const },
  albumin: { min: 3.5, max: 5.0, unit: 'g/dL', label: 'Albumin', category: 'hepatic' as const },
  total_protein: { min: 6.0, max: 8.3, unit: 'g/dL', label: 'Total Protein', category: 'hepatic' as const },
  globulin: { min: 2.0, max: 3.5, unit: 'g/dL', label: 'Globulin', category: 'hepatic' as const },

  // Thyroid / Hormonal
  tsh: { min: 0.4, max: 4.0, unit: 'mIU/L', label: 'TSH', category: 'hormonal' as const },
  t3: { min: 80, max: 200, unit: 'ng/dL', label: 'T3 (Triiodothyronine)', category: 'hormonal' as const },
  t4: { min: 5.0, max: 12.0, unit: 'µg/dL', label: 'T4 (Thyroxine)', category: 'hormonal' as const },
  free_t3: { min: 2.3, max: 4.2, unit: 'pg/mL', label: 'Free T3', category: 'hormonal' as const },
  free_t4: { min: 0.8, max: 1.8, unit: 'ng/dL', label: 'Free T4', category: 'hormonal' as const },

  // Nutritional / Vitamins
  vitamin_d: { min: 30, max: 100, unit: 'ng/mL', label: 'Vitamin D (25-OH)', category: 'nutritional' as const },
  vitamin_b12: { min: 200, max: 900, unit: 'pg/mL', label: 'Vitamin B12', category: 'nutritional' as const },
  folate: { min: 3.1, max: 20.0, unit: 'ng/mL', label: 'Folate', category: 'nutritional' as const },
  iron: { min: 60, max: 170, unit: 'µg/dL', label: 'Serum Iron', category: 'nutritional' as const },
  tibc: { min: 240, max: 450, unit: 'µg/dL', label: 'TIBC', category: 'nutritional' as const },

  // Coagulation
  pt: { min: 11, max: 13.5, unit: 'seconds', label: 'Prothrombin Time', category: 'blood' as const },
  inr: { min: 0.8, max: 1.2, unit: '', label: 'INR', category: 'blood' as const },
  aptt: { min: 25, max: 40, unit: 'seconds', label: 'aPTT', category: 'blood' as const },
}

/**
 * Look up a standard reference range for a marker by name.
 * Normalises the name to lowercase, strips punctuation, then tries
 * multiple aliases so "HbA1c", "Hb A1c", "glycated haemoglobin" all resolve.
 */
export function lookupMarkerRange(
  markerName: string
): { min: number; max: number; unit: string } | null {
  const name = markerName.toLowerCase().replace(/[^a-z0-9]/g, '')

  // Direct key match first
  for (const [key, range] of Object.entries(MARKER_RANGES)) {
    if (key.replace(/_/g, '') === name) return range
  }

  // Alias map: normalised name fragment → range key
  const ALIASES: Record<string, keyof typeof MARKER_RANGES> = {
    hba1c: 'hba1c', hba: 'hba1c', glycatedhemoglobin: 'hba1c', glycatedhaemoglobin: 'hba1c',
    fastingglucose: 'fasting_glucose', fastingsugar: 'fasting_glucose', fbg: 'fasting_glucose',
    postprandial: 'postprandial_glucose', ppbs: 'postprandial_glucose',
    randomglucose: 'random_glucose', rbs: 'random_glucose',
    totalcholesterol: 'cholesterol', cholesterol: 'cholesterol',
    triglycerides: 'triglycerides', tg: 'triglycerides',
    ldl: 'ldl', ldlcholesterol: 'ldl', lowdensity: 'ldl',
    hdl: 'hdl', hdlcholesterol: 'hdl', highdensity: 'hdl',
    vldl: 'vldl',
    hemoglobin: 'hemoglobin', haemoglobin: 'hemoglobin', hb: 'hemoglobin',
    rbc: 'rbc', redbloodcell: 'rbc', erythrocyte: 'rbc',
    wbc: 'wbc', whitebloodcell: 'wbc', leukocyte: 'wbc', tlc: 'wbc',
    platelet: 'platelets', platelets: 'platelets', thrombocyte: 'platelets',
    hematocrit: 'hematocrit', haematocrit: 'hematocrit', pcv: 'hematocrit', packedcellvolume: 'hematocrit',
    mcv: 'mcv', mch: 'mch', mchc: 'mchc', rdw: 'rdw',
    neutrophil: 'neutrophils', neutrophils: 'neutrophils',
    lymphocyte: 'lymphocytes', lymphocytes: 'lymphocytes',
    monocyte: 'monocytes', monocytes: 'monocytes',
    eosinophil: 'eosinophils', eosinophils: 'eosinophils',
    basophil: 'basophils', basophils: 'basophils',
    esr: 'esr', sedimentationrate: 'esr',
    ferritin: 'ferritin',
    creatinine: 'creatinine', serumcreatinine: 'creatinine',
    urea: 'urea', bloodurea: 'urea', bun: 'bun',
    uricacid: 'uric_acid',
    egfr: 'egfr', gfr: 'egfr',
    sodium: 'sodium', na: 'sodium',
    potassium: 'potassium', k: 'potassium',
    chloride: 'chloride', cl: 'chloride',
    bicarbonate: 'bicarbonate', hco3: 'bicarbonate',
    calcium: 'calcium', ca: 'calcium', serumcalcium: 'calcium',
    phosphorus: 'phosphorus', phosphate: 'phosphorus',
    magnesium: 'magnesium', mg: 'magnesium',
    alt: 'alt', sgpt: 'alt', alaninetransaminase: 'alt',
    ast: 'ast', sgot: 'ast', aspartate: 'ast',
    alp: 'alp', alkalinephosphatase: 'alp',
    ggt: 'ggt', gammaglutamyl: 'ggt',
    bilirubin: 'bilirubin_total', totalbilirubin: 'bilirubin_total',
    directbilirubin: 'bilirubin_direct', conjugated: 'bilirubin_direct',
    indirectbilirubin: 'bilirubin_indirect', unconjugated: 'bilirubin_indirect',
    albumin: 'albumin', serualbumin: 'albumin',
    totalprotein: 'total_protein', protein: 'total_protein',
    globulin: 'globulin',
    tsh: 'tsh', thyroidstimulating: 'tsh',
    t3: 't3', triiodothyronine: 't3',
    t4: 't4', thyroxine: 't4',
    freet3: 'free_t3', ft3: 'free_t3',
    freet4: 'free_t4', ft4: 'free_t4',
    vitamind: 'vitamin_d', vitd: 'vitamin_d', '25ohd': 'vitamin_d',
    vitaminb12: 'vitamin_b12', b12: 'vitamin_b12', cobalamin: 'vitamin_b12',
    folate: 'folate', folicacid: 'folate',
    iron: 'iron', serumiran: 'iron', fe: 'iron',
    tibc: 'tibc', totalironbinding: 'tibc',
    pt: 'pt', prothrombintime: 'pt',
    inr: 'inr',
    aptt: 'aptt', ptt: 'aptt',
    insulin: 'insulin', seruminsulin: 'insulin',
  }

  const key = ALIASES[name]
  if (key) return MARKER_RANGES[key]

  // Partial match — check if any alias contains the name fragment
  for (const [alias, rangeKey] of Object.entries(ALIASES)) {
    if (alias.includes(name) || name.includes(alias)) {
      return MARKER_RANGES[rangeKey]
    }
  }

  return null
}
