import type { ChatResponse } from '@/types/chat'
import type { Persona } from '@/types/chat'

export const CHAT_RESPONSES: Record<Persona, ChatResponse[]> = {
  patient: [
    {
      keywords: ['hba1c', 'blood sugar', 'glucose', 'diabetes', 'glycemic'],
      response: "Your HbA1c reading of 6.4% shows a gradual upward trend over the past 12 months. The normal range is 4.0–5.6%. This is an informational observation — your trend data shows it has been rising steadily since early 2024. I'd suggest discussing this with your doctor at your next appointment.",
      confidenceScore: 87,
      disclaimer: 'This is informational only. Not a medical diagnosis. Please consult your doctor.',
      sourceMarkers: ['HbA1c', 'Fasting Glucose'],
    },
    {
      keywords: ['blood pressure', 'bp', 'hypertension', 'pressure'],
      response: "Your recent blood pressure readings show a gradual upward pattern over 12 months — your most recent reading was 136/88 mmHg. The normal range is typically below 120/80 mmHg. This is an informational observation. Regular monitoring is recommended.",
      confidenceScore: 79,
      disclaimer: 'This is informational only. Not a medical diagnosis.',
      sourceMarkers: ['Systolic BP', 'Diastolic BP'],
    },
    {
      keywords: ['hemoglobin', 'iron', 'anemia', 'ferritin'],
      response: "Your hemoglobin was recorded at 11.2 g/dL and ferritin at 8 ng/mL — both below normal range. These markers have been trending downward. Your Vitamin D is also below optimal levels at 18 ng/mL. These are informational observations that your doctor can evaluate in context.",
      confidenceScore: 91,
      disclaimer: 'This is informational only. Not a medical diagnosis.',
      sourceMarkers: ['Hemoglobin', 'Ferritin', 'Vitamin D'],
    },
    {
      keywords: ['cholesterol', 'lipid', 'triglycerides', 'ldl', 'hdl'],
      response: "Your total cholesterol is 218 mg/dL (normal: below 200) and triglycerides are 180 mg/dL (normal: below 150). These have been rising over the past year. Your LDL is 142 mg/dL, which is also above the typical reference range. Your doctor can help interpret what this means for your specific health context.",
      confidenceScore: 82,
      disclaimer: 'This is informational only.',
      sourceMarkers: ['Cholesterol', 'LDL', 'Triglycerides'],
    },
    {
      keywords: ['records', 'history', 'reports', 'vault'],
      response: "You have 3 health records in your vault: an Annual Metabolic Panel (Feb 2025), a CBC & Thyroid Panel (Oct 2024), and a Blood Pressure reading (Jan 2025). All records are encrypted with AES-256. You can view them in the Health Vault section.",
      confidenceScore: 99,
      disclaimer: '',
      sourceMarkers: [],
    },
    {
      keywords: ['hello', 'hi', 'help', 'start'],
      response: "Hello! I'm your GlimmoraCare health assistant. I can help you understand your health records, explain trends in your data, and provide informational summaries of your test results. Remember — I provide informational context only, not medical advice. What would you like to know about your health records?",
      confidenceScore: 99,
      disclaimer: 'I provide informational context only, not medical advice.',
      sourceMarkers: [],
    },
  ],
  doctor: [
    {
      keywords: ['priya', 'pat_001', 'sharma'],
      response: "Patient: Priya Sharma, 38F. Key findings: HbA1c trending upward (5.6% → 6.4% over 12 months, confidence: 87%). Hemoglobin low at 11.2 g/dL with ferritin 8 ng/mL. TSH mildly elevated at 4.8 mIU/L. Systolic BP: 136 mmHg (trend rising). Recommended discussion points: glycemic monitoring, iron and thyroid evaluation, cardiovascular risk assessment. Data completeness: 82%.",
      confidenceScore: 89,
      disclaimer: 'All AI outputs are non-diagnostic. Clinical judgment takes precedence.',
      sourceMarkers: ['HbA1c', 'Hemoglobin', 'TSH', 'Systolic BP'],
    },
    {
      keywords: ['ramesh', 'pat_002', 'patel'],
      response: "Patient: Ramesh Patel, 55M. High-priority markers: HbA1c at 7.8% (18-month rising trend, confidence: 93%). Creatinine at 1.4 mg/dL (rising). Uric acid elevated at 7.8 mg/dL. Systolic BP: 148 mmHg. Risk trajectory: HIGH. Multiple metabolic and renal markers elevated simultaneously. Doctor brief: 5 abnormal markers across metabolic, cardiac, and renal categories.",
      confidenceScore: 93,
      disclaimer: 'All AI outputs are non-diagnostic. Clinical judgment takes precedence.',
      sourceMarkers: ['HbA1c', 'Creatinine', 'Uric Acid', 'Systolic BP'],
    },
    {
      keywords: ['brief', 'consultation', 'summary', 'review'],
      response: "Doctor Brief Summary — Today's patients:\n\n1. Ramesh Patel (HIGH priority): 5 elevated markers, 18-month glycemic trend\n2. Mohammed Anwar (ELEVATED): Cardiac lipid panel — LDL 178, Cholesterol 256\n3. Priya Sharma (MODERATE): HbA1c trending, hemoglobin low\n\nAll briefs are non-diagnostic informational summaries. Confidence scores: 87–93%.",
      confidenceScore: 91,
      disclaimer: 'Non-diagnostic informational summary. Clinical judgment required.',
      sourceMarkers: [],
    },
    {
      keywords: ['correlation', 'pattern', 'trend', 'analysis'],
      response: "Multi-marker correlation analysis across patient cohort:\n\n• HbA1c ↔ Fasting Glucose: r=0.92 (strong positive)\n• Systolic ↔ Diastolic BP: r=0.88 (strong positive)\n• LDL ↔ Total Cholesterol: r=0.95 (strong positive)\n• HDL ↔ Triglycerides: r=-0.63 (moderate negative)\n\nThese correlations are computed from current patient dataset. Not predictive of individual outcomes.",
      confidenceScore: 85,
      disclaimer: 'Statistical correlations only. Not predictive of individual clinical outcomes.',
      sourceMarkers: ['HbA1c', 'Cholesterol', 'BP'],
    },
    {
      keywords: ['hello', 'hi', 'help', 'start'],
      response: "Hello, Doctor. I can help you access patient summaries, consultation briefs, longitudinal trend analysis, and multi-marker correlations. All outputs are non-diagnostic and confidence-scored. Which patient or analysis would you like to review?",
      confidenceScore: 99,
      disclaimer: 'All AI outputs are non-diagnostic informational summaries.',
      sourceMarkers: [],
    },
  ],
  ngo: [
    {
      keywords: ['wadgaon', 'village', 'screening', 'coverage'],
      response: "Wadgaon Village — Current Status:\n• Active patients: 3\n• Screening coverage: 68%\n• Hemoglobin screening gap: 2 pending patients\n• Last sync: 2025-02-28\n\nAlert: Low hemoglobin cluster detected (3 cases below 10 g/dL in last 30 days). Outreach recommended. This is an aggregated informational observation.",
      confidenceScore: 84,
      disclaimer: 'Aggregated population data only. No individual identifiers included.',
      sourceMarkers: ['Hemoglobin'],
    },
    {
      keywords: ['maternal', 'pregnancy', 'anemia', 'mother'],
      response: "Maternal Health Summary — Raigad District:\n• Patients tracked: 3\n• Average hemoglobin: 10.2 g/dL (below recommended)\n• BP screening compliance: 78%\n• Follow-up rate: 65%\n\nInformational signals: Low hemoglobin pattern across 2 villages. Screening gap identified. All data is anonymized and aggregated.",
      confidenceScore: 86,
      disclaimer: 'Aggregated data only. Not individual diagnostic assessments.',
      sourceMarkers: ['Hemoglobin', 'BP'],
    },
    {
      keywords: ['sync', 'offline', 'pending', 'upload'],
      response: "Offline Sync Status:\n• Records pending sync: 3\n• Last successful sync: 2025-03-05 16:00\n• Local storage used: 2.4 MB of 10 GB\n• Conflicts detected: 0\n\nAll records are encrypted locally. Background sync will trigger when connectivity is restored.",
      confidenceScore: 99,
      disclaimer: '',
      sourceMarkers: [],
    },
    {
      keywords: ['hello', 'hi', 'help', 'start'],
      response: "Hello! I'm your GlimmoraCare field assistant. I can help you with village health data, screening gaps, maternal health monitoring, and sync status. All population data is anonymized. What would you like to check?",
      confidenceScore: 99,
      disclaimer: 'Population-level data only. No individual identifiers.',
      sourceMarkers: [],
    },
  ],
  government: [
    {
      keywords: ['nashik', 'district', 'population', 'coverage'],
      response: "Nashik District — Population Health Summary:\n• Total registered patients: 1,240\n• Screened: 892 (72% coverage)\n• At risk (elevated markers): 234 (19%)\n• Maternal health gap: 22 pending screenings\n\nDistrict risk intensity: MODERATE. Screening coverage is above state average. Data is fully anonymized and aggregated.",
      confidenceScore: 91,
      disclaimer: 'Aggregated anonymized data only. No individual patient information.',
      sourceMarkers: [],
    },
    {
      keywords: ['trend', 'seasonal', 'pattern', 'monthly'],
      response: "Seasonal Pattern Analysis — Maharashtra Division:\n• March–May: Screening participation drops 15% (peak farming season)\n• Oct–Nov: Glycemic marker deviations increase 12% (festive season pattern)\n• Maternal screenings: Lowest in June–July\n\nThese are population-level informational observations. No individual data is included.",
      confidenceScore: 78,
      disclaimer: 'Aggregated trend analysis only. Not predictive of specific outcomes.',
      sourceMarkers: [],
    },
    {
      keywords: ['hello', 'hi', 'help', 'start'],
      response: "Hello. I provide population-level health intelligence for district and state planning. I can assist with coverage metrics, risk clustering, seasonal patterns, and screening gap analysis. All data is fully anonymized and aggregated. What district or metric would you like to review?",
      confidenceScore: 99,
      disclaimer: 'Aggregated anonymized population data only.',
      sourceMarkers: [],
    },
  ],
}

export function getResponse(persona: Persona, input: string): ChatResponse {
  const responses = CHAT_RESPONSES[persona]
  const lower = input.toLowerCase()
  const match = responses.find((r) => r.keywords.some((k) => lower.includes(k)))
  return (
    match ?? {
      keywords: [],
      response: "I don't have specific data on that query right now. Please try asking about specific health markers (like HbA1c, blood pressure, cholesterol), patient summaries, or population health metrics.",
      confidenceScore: 60,
      disclaimer: 'Informational context only. Not a substitute for professional advice.',
      sourceMarkers: [],
    }
  )
}
