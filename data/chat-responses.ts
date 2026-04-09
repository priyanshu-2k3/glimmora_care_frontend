import type { ChatResponse, Persona } from '@/types/chat'

// Legacy mock responses — kept as fallback if Gemini is unavailable
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
      keywords: ['records', 'history', 'reports', 'vault'],
      response: "You have 3 health records in your vault: an Annual Metabolic Panel (Feb 2025), a CBC & Thyroid Panel (Oct 2024), and a Blood Pressure reading (Jan 2025). All records are encrypted with AES-256. You can view them in the Health Vault section.",
      confidenceScore: 99,
      disclaimer: '',
      sourceMarkers: [],
    },
    {
      keywords: ['hello', 'hi', 'help', 'start'],
      response: "Hello! I'm your GlimmoraCare health assistant. I can help you understand your health records, explain trends in your data, and provide informational summaries of your test results. Remember — I provide informational context only, not medical advice. What would you like to know?",
      confidenceScore: 99,
      disclaimer: 'I provide informational context only, not medical advice.',
      sourceMarkers: [],
    },
  ],
  doctor: [
    {
      keywords: ['priya', 'pat_001', 'sharma'],
      response: "Patient: Priya Sharma, 38F. Key findings: HbA1c trending upward (5.6% → 6.4% over 12 months, confidence: 87%). Hemoglobin low at 11.2 g/dL with ferritin 8 ng/mL. TSH mildly elevated at 4.8 mIU/L. Systolic BP: 136 mmHg (trend rising). Recommended discussion points: glycemic monitoring, iron and thyroid evaluation. Data completeness: 82%.",
      confidenceScore: 89,
      disclaimer: 'All AI outputs are non-diagnostic. Clinical judgment takes precedence.',
      sourceMarkers: ['HbA1c', 'Hemoglobin', 'TSH', 'Systolic BP'],
    },
    {
      keywords: ['ramesh', 'pat_002', 'patel'],
      response: "Patient: Ramesh Patel, 55M. High-priority markers: HbA1c at 7.8% (18-month rising trend, confidence: 93%). Creatinine at 1.4 mg/dL (rising). Uric acid elevated at 7.8 mg/dL. Systolic BP: 148 mmHg. Risk trajectory: HIGH. Multiple metabolic and renal markers elevated simultaneously.",
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
      keywords: ['hello', 'hi', 'help', 'start'],
      response: "Hello, Doctor. I can help you access patient summaries, consultation briefs, longitudinal trend analysis, and multi-marker correlations. All outputs are non-diagnostic and confidence-scored. Which patient or analysis would you like to review?",
      confidenceScore: 99,
      disclaimer: 'All AI outputs are non-diagnostic informational summaries.',
      sourceMarkers: [],
    },
  ],
  admin: [
    {
      keywords: ['consent', 'requests', 'pending'],
      response: "Consent Management Summary:\n• Pending requests: 3\n• Approved this week: 7\n• Expired consents: 2 (action required)\n\nDoctor-initiated requests awaiting patient approval are listed in the Consent Manager. Expired consents should be reviewed for renewal or revocation.",
      confidenceScore: 90,
      disclaimer: 'Operational summary based on available system data.',
      sourceMarkers: [],
    },
    {
      keywords: ['doctor', 'assignment', 'team'],
      response: "Doctor Assignment Status:\n• Active assignments: 12\n• Unassigned patients: 4\n• Pending reassignment requests: 1\n\nDr. Kavita Rao has capacity for 2 more patients. Dr. Ravi Kulkarni is currently on leave. Visit Doctor Management to process assignments.",
      confidenceScore: 88,
      disclaimer: 'Operational data only.',
      sourceMarkers: [],
    },
    {
      keywords: ['hello', 'hi', 'help', 'start'],
      response: "Hello! I'm your GlimmoraCare operations assistant. I can help with consent management, doctor assignments, team coordination, and audit log reviews. What would you like to manage today?",
      confidenceScore: 99,
      disclaimer: 'Operational assistant only.',
      sourceMarkers: [],
    },
  ],
  super_admin: [
    {
      keywords: ['platform', 'system', 'health', 'status'],
      response: "Platform Health Summary:\n• Total users: 8 (4 patients, 2 doctors, 1 admin, 1 super admin)\n• Records in vault: 14\n• AI confidence average: 87%\n• Agent uptime: 99.8%\n• Backend API: Online\n• Last system check: 2025-04-09\n\nAll systems operational. No critical alerts.",
      confidenceScore: 95,
      disclaimer: 'System status summary. Not a guarantee of individual component health.',
      sourceMarkers: [],
    },
    {
      keywords: ['agent', 'intelligence', 'preventive'],
      response: "Agent Status Overview:\n• Data Integrity Agent: Active (97% task success)\n• Preventive Intelligence Agent: Active (94% success)\n• Doctor Prep Agent: Active (89% success)\n\nTotal tasks processed (last 7 days): 47. No critical failures. Agent logs available in the Agents dashboard.",
      confidenceScore: 92,
      disclaimer: 'Aggregated agent performance metrics.',
      sourceMarkers: [],
    },
    {
      keywords: ['hello', 'hi', 'help', 'start'],
      response: "Hello, Super Admin. I have full platform intelligence available — patient trends, system health, agent performance, user management, and governance metrics. All outputs are confidence-scored. What would you like to review?",
      confidenceScore: 99,
      disclaimer: 'System-level intelligence assistant.',
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
      response: "I don't have specific data on that query right now. Please try asking about specific health markers, patient summaries, or platform metrics.",
      confidenceScore: 60,
      disclaimer: 'Informational context only. Not a substitute for professional advice.',
      sourceMarkers: [],
    }
  )
}
