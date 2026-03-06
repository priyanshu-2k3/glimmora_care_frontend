import type { PopulationSummary } from '@/types/population'

export const POPULATION_DATA: PopulationSummary = {
  totalPatients: 1240,
  screened: 892,
  atRisk: 234,
  coveragePercent: 72,
  regions: [
    { id: 'r1', name: 'Nashik', level: 'district', riskIntensity: 'moderate', screeningCoverage: 78, activePatients: 312 },
    { id: 'r2', name: 'Ahmednagar', level: 'district', riskIntensity: 'elevated', screeningCoverage: 64, activePatients: 286 },
    { id: 'r3', name: 'Dhule', level: 'district', riskIntensity: 'elevated', screeningCoverage: 55, activePatients: 241 },
    { id: 'r4', name: 'Nandurbar', level: 'district', riskIntensity: 'elevated', screeningCoverage: 42, activePatients: 198 },
    { id: 'r5', name: 'Raigad', level: 'district', riskIntensity: 'moderate', screeningCoverage: 71, activePatients: 203 },
    { id: 'r6', name: 'Pune', level: 'district', riskIntensity: 'stable', screeningCoverage: 84, activePatients: 312 },
    { id: 'r7', name: 'Wadgaon', level: 'village', parentId: 'r5', riskIntensity: 'elevated', screeningCoverage: 68, activePatients: 42 },
    { id: 'r8', name: 'Karjat', level: 'village', parentId: 'r5', riskIntensity: 'moderate', screeningCoverage: 52, activePatients: 38 },
    { id: 'r9', name: 'Pen', level: 'village', parentId: 'r5', riskIntensity: 'elevated', screeningCoverage: 41, activePatients: 29 },
  ],
  maternalMetrics: [
    { region: 'Raigad', hemoglobinAvg: 10.2, bpElevated: 4, screeningGap: 28, followUpRate: 65 },
    { region: 'Nashik', hemoglobinAvg: 11.1, bpElevated: 6, screeningGap: 18, followUpRate: 74 },
    { region: 'Nandurbar', hemoglobinAvg: 9.8, bpElevated: 9, screeningGap: 42, followUpRate: 51 },
  ],
  pediatricMetrics: [
    { region: 'Raigad', growthAnomaly: 12, underweight: 18, screeningInterval: 90 },
    { region: 'Nashik', growthAnomaly: 8, underweight: 12, screeningInterval: 75 },
    { region: 'Nandurbar', growthAnomaly: 21, underweight: 28, screeningInterval: 120 },
  ],
  elderlyMetrics: [
    { region: 'Nashik', chronicRiskCount: 48, bpElevated: 32, glucoseElevated: 24, renalRisk: 11 },
    { region: 'Pune', chronicRiskCount: 62, bpElevated: 41, glucoseElevated: 35, renalRisk: 14 },
    { region: 'Ahmednagar', chronicRiskCount: 38, bpElevated: 26, glucoseElevated: 19, renalRisk: 8 },
  ],
  seasonalTrends: [
    { month: 'Jan', screeningParticipation: 78, markerDeviation: 12, region: 'Maharashtra' },
    { month: 'Feb', screeningParticipation: 82, markerDeviation: 11, region: 'Maharashtra' },
    { month: 'Mar', screeningParticipation: 71, markerDeviation: 14, region: 'Maharashtra' },
    { month: 'Apr', screeningParticipation: 65, markerDeviation: 15, region: 'Maharashtra' },
    { month: 'May', screeningParticipation: 60, markerDeviation: 13, region: 'Maharashtra' },
    { month: 'Jun', screeningParticipation: 55, markerDeviation: 10, region: 'Maharashtra' },
    { month: 'Jul', screeningParticipation: 52, markerDeviation: 9, region: 'Maharashtra' },
    { month: 'Aug', screeningParticipation: 58, markerDeviation: 11, region: 'Maharashtra' },
    { month: 'Sep', screeningParticipation: 68, markerDeviation: 12, region: 'Maharashtra' },
    { month: 'Oct', screeningParticipation: 74, markerDeviation: 16, region: 'Maharashtra' },
    { month: 'Nov', screeningParticipation: 80, markerDeviation: 18, region: 'Maharashtra' },
    { month: 'Dec', screeningParticipation: 76, markerDeviation: 14, region: 'Maharashtra' },
  ],
}
