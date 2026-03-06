import type { DigitalHealthTwin } from '@/types/twin'

export const MOCK_TWINS: Record<string, DigitalHealthTwin> = {
  pat_001: {
    patientId: 'pat_001',
    markerOverlays: [
      {
        markerId: 'hba1c',
        markerName: 'HbA1c (%)',
        color: '#C9A962',
        isVisible: true,
        unit: '%',
        dataPoints: [
          { date: '2024-01', value: 5.5, unit: '%' },
          { date: '2024-03', value: 5.6, unit: '%' },
          { date: '2024-05', value: 5.8, unit: '%' },
          { date: '2024-07', value: 5.9, unit: '%' },
          { date: '2024-09', value: 6.1, unit: '%' },
          { date: '2024-11', value: 6.2, unit: '%' },
          { date: '2025-01', value: 6.3, unit: '%' },
          { date: '2025-03', value: 6.4, unit: '%', isAbnormal: true },
        ],
      },
      {
        markerId: 'systolic_bp',
        markerName: 'Systolic BP (mmHg)',
        color: '#8B5252',
        isVisible: true,
        unit: 'mmHg',
        dataPoints: [
          { date: '2024-01', value: 118, unit: 'mmHg' },
          { date: '2024-04', value: 121, unit: 'mmHg' },
          { date: '2024-07', value: 126, unit: 'mmHg' },
          { date: '2024-10', value: 130, unit: 'mmHg' },
          { date: '2025-01', value: 136, unit: 'mmHg', isAbnormal: true },
        ],
      },
      {
        markerId: 'hemoglobin',
        markerName: 'Hemoglobin (g/dL)',
        color: '#4A6347',
        isVisible: true,
        unit: 'g/dL',
        dataPoints: [
          { date: '2024-01', value: 12.8, unit: 'g/dL' },
          { date: '2024-06', value: 12.2, unit: 'g/dL' },
          { date: '2024-10', value: 11.2, unit: 'g/dL', isAbnormal: true },
        ],
      },
      {
        markerId: 'cholesterol',
        markerName: 'Total Cholesterol (mg/dL)',
        color: '#4A5568',
        isVisible: false,
        unit: 'mg/dL',
        dataPoints: [
          { date: '2024-02', value: 192, unit: 'mg/dL' },
          { date: '2024-06', value: 198, unit: 'mg/dL' },
          { date: '2024-10', value: 208, unit: 'mg/dL', isAbnormal: true },
          { date: '2025-02', value: 218, unit: 'mg/dL', isAbnormal: true },
        ],
      },
    ],
    riskTrajectory: [
      { date: '2024-01', value: 22 },
      { date: '2024-04', value: 28 },
      { date: '2024-07', value: 34 },
      { date: '2024-10', value: 41 },
      { date: '2025-01', value: 48 },
      { date: '2025-04', value: 55, predicted: true },
      { date: '2025-07', value: 62, predicted: true },
    ],
    dataCompleteness: 82,
    lifestyleAdherence: [
      { name: 'Testing Frequency', score: 78, label: 'Good' },
      { name: 'Check-up Regularity', score: 65, label: 'Moderate' },
      { name: 'Data Completeness', score: 82, label: 'Good' },
      { name: 'Follow-up Compliance', score: 55, label: 'Low' },
    ],
    snapshots: [
      {
        id: 'snap_001',
        patientId: 'pat_001',
        timestamp: '2025-02-21T09:35:00Z',
        markerDelta: { hba1c: +0.1, systolic_bp: +6, cholesterol: +10 },
        riskScoreChange: +4,
        confidenceAdjustment: +2,
        agentActionsTriggered: ['Preventive Intelligence Alert', 'Doctor Brief Generated'],
        dataCompleteness: 82,
      },
    ],
    lastUpdated: '2025-02-21T09:35:00Z',
  },
}

export function getTwinByPatient(patientId: string): DigitalHealthTwin | undefined {
  return MOCK_TWINS[patientId]
}
