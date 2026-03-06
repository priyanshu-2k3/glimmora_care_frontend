import type { RiskTrajectory, RiskInsight, CorrelationPair } from '@/types/risk'

// 12-month HbA1c trend for Priya Sharma
export const RISK_TRAJECTORIES: RiskTrajectory[] = [
  {
    id: 'rt_001',
    patientId: 'pat_001',
    markerId: 'hba1c',
    markerName: 'HbA1c',
    dataPoints: [
      { date: '2024-02', value: 5.6 },
      { date: '2024-04', value: 5.8 },
      { date: '2024-06', value: 5.9 },
      { date: '2024-08', value: 6.1 },
      { date: '2024-10', value: 6.2 },
      { date: '2024-12', value: 6.3 },
      { date: '2025-02', value: 6.4 },
      { date: '2025-04', value: 6.6, predicted: true },
      { date: '2025-06', value: 6.8, predicted: true },
    ],
    riskLevel: 'elevated',
    confidenceScore: 87,
    explanation: 'Based on 7 HbA1c readings over 12 months showing progressive upward deviation exceeding historical baseline by 1.8 standard deviations.',
    sourceMarkers: ['HbA1c', 'Fasting Glucose', 'Triglycerides'],
    timeRange: '12 months',
    generatedAt: '2025-02-21T09:35:00Z',
  },
  {
    id: 'rt_002',
    patientId: 'pat_001',
    markerId: 'systolic_bp',
    markerName: 'Systolic Blood Pressure',
    dataPoints: [
      { date: '2024-01', value: 118 },
      { date: '2024-04', value: 121 },
      { date: '2024-07', value: 126 },
      { date: '2024-10', value: 130 },
      { date: '2025-01', value: 136 },
      { date: '2025-04', value: 140, predicted: true },
      { date: '2025-07', value: 144, predicted: true },
    ],
    riskLevel: 'moderate',
    confidenceScore: 79,
    explanation: 'Gradual upward trend in systolic BP over 12 months, rate of change: +1.5 mmHg/month.',
    sourceMarkers: ['Systolic BP', 'Diastolic BP'],
    timeRange: '12 months',
    generatedAt: '2025-02-21T09:35:00Z',
  },
  {
    id: 'rt_003',
    patientId: 'pat_001',
    markerId: 'cholesterol',
    markerName: 'Total Cholesterol',
    dataPoints: [
      { date: '2024-02', value: 192 },
      { date: '2024-06', value: 198 },
      { date: '2024-10', value: 208 },
      { date: '2025-02', value: 218 },
      { date: '2025-06', value: 226, predicted: true },
    ],
    riskLevel: 'moderate',
    confidenceScore: 82,
    explanation: 'Cholesterol trending upward with consistent +6 mg/dL increase per quarter.',
    sourceMarkers: ['Total Cholesterol', 'LDL', 'Triglycerides'],
    timeRange: '12 months',
    generatedAt: '2025-02-21T09:35:00Z',
  },
  // Ramesh Patel — more severe
  {
    id: 'rt_004',
    patientId: 'pat_002',
    markerId: 'hba1c',
    markerName: 'HbA1c',
    dataPoints: [
      { date: '2023-09', value: 6.8 },
      { date: '2023-12', value: 7.1 },
      { date: '2024-03', value: 7.2 },
      { date: '2024-06', value: 7.4 },
      { date: '2024-09', value: 7.6 },
      { date: '2024-12', value: 7.7 },
      { date: '2025-03', value: 7.8 },
      { date: '2025-06', value: 8.0, predicted: true },
    ],
    riskLevel: 'high',
    confidenceScore: 93,
    explanation: 'Persistent and progressive glycemic elevation over 18 months with accelerating trend.',
    sourceMarkers: ['HbA1c', 'Fasting Glucose', 'Creatinine'],
    timeRange: '18 months',
    generatedAt: '2025-03-02T08:00:00Z',
  },
]

export const RISK_INSIGHTS: RiskInsight[] = [
  {
    id: 'ri_001',
    patientId: 'pat_001',
    title: 'Upward glycemic trend detected',
    description: 'Upward longitudinal pattern observed in HbA1c over 12 months. Current value (6.4%) is above normal range (4.0–5.6%). Fasting glucose also trending upward.',
    riskLevel: 'elevated',
    confidenceScore: 87,
    affectedMarkers: ['HbA1c', 'Fasting Glucose', 'Triglycerides'],
    reasoningTrace: 'Based on 7 HbA1c readings over 12 months showing progressive upward deviation exceeding historical baseline by 1.8 standard deviations. Positive correlation with fasting glucose (r=0.92) and triglycerides (r=0.74) strengthens signal.',
    disclaimer: 'This is an informational observation only and does not constitute a medical diagnosis. Please consult your healthcare provider for clinical evaluation.',
    generatedAt: '2025-02-21T09:35:00Z',
    isReviewed: false,
  },
  {
    id: 'ri_002',
    patientId: 'pat_001',
    title: 'Blood pressure upward pattern',
    description: 'Gradual upward trend in blood pressure readings over 12 months. Both systolic and diastolic values showing consistent increase.',
    riskLevel: 'moderate',
    confidenceScore: 79,
    affectedMarkers: ['Systolic BP', 'Diastolic BP'],
    reasoningTrace: 'Systolic BP increased from 118 to 136 mmHg over 12 months (rate: +1.5 mmHg/month). Diastolic BP shows parallel rise from 74 to 88 mmHg.',
    disclaimer: 'This is an informational observation only. Please consult your healthcare provider.',
    generatedAt: '2025-02-21T09:35:00Z',
    isReviewed: false,
  },
  {
    id: 'ri_003',
    patientId: 'pat_001',
    title: 'Iron deficiency markers',
    description: 'Low hemoglobin (11.2 g/dL) combined with low ferritin (8 ng/mL) and borderline Vitamin D suggest nutritional markers require attention.',
    riskLevel: 'moderate',
    confidenceScore: 91,
    affectedMarkers: ['Hemoglobin', 'Ferritin', 'Vitamin D'],
    reasoningTrace: 'Hemoglobin at 11.2 (normal 12.0–17.5 g/dL), Ferritin at 8 (normal 12–300 ng/mL). Both below normal range with downward trend. Classic pattern requiring evaluation.',
    disclaimer: 'This is an informational observation only. Please consult your healthcare provider.',
    generatedAt: '2024-10-16T09:00:00Z',
    isReviewed: true,
    reviewedBy: 'Dr. Arjun Mehta',
  },
]

export const CORRELATIONS: CorrelationPair[] = [
  { marker1: 'HbA1c', marker2: 'Fasting Glucose', correlationValue: 0.92, significance: 'strong', direction: 'positive' },
  { marker1: 'HbA1c', marker2: 'Triglycerides', correlationValue: 0.74, significance: 'moderate', direction: 'positive' },
  { marker1: 'Systolic BP', marker2: 'Diastolic BP', correlationValue: 0.88, significance: 'strong', direction: 'positive' },
  { marker1: 'Hemoglobin', marker2: 'Ferritin', correlationValue: 0.71, significance: 'moderate', direction: 'positive' },
  { marker1: 'LDL', marker2: 'Total Cholesterol', correlationValue: 0.95, significance: 'strong', direction: 'positive' },
  { marker1: 'HDL', marker2: 'Triglycerides', correlationValue: -0.63, significance: 'moderate', direction: 'negative' },
  { marker1: 'BMI', marker2: 'HbA1c', correlationValue: 0.58, significance: 'moderate', direction: 'positive' },
  { marker1: 'Creatinine', marker2: 'Uric Acid', correlationValue: 0.67, significance: 'moderate', direction: 'positive' },
]

export function getTrajectoryByPatient(patientId: string): RiskTrajectory[] {
  return RISK_TRAJECTORIES.filter((r) => r.patientId === patientId)
}

export function getInsightsByPatient(patientId: string): RiskInsight[] {
  return RISK_INSIGHTS.filter((r) => r.patientId === patientId)
}
