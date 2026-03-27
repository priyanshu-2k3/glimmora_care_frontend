'use client'

import Link from 'next/link'
import { ArrowLeft, Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const AI_INSIGHTS = [
  {
    id: 'ins_001',
    category: 'Risk Signal',
    severity: 'high' as const,
    title: 'Pre-diabetic HbA1c trend detected',
    summary: 'Your HbA1c has increased from 5.4% (Jan 2025) to 6.1% (Mar 2026), approaching the pre-diabetic threshold of 6.5%. This is a 3-record trend.',
    recommendation: 'Consider a structured diet review, fasting glucose monitoring every 3 months, and consultation with an endocrinologist.',
    confidence: 87,
    sources: ['rec_001', 'rec_002'],
    markers: ['HbA1c', 'Fasting Glucose'],
  },
  {
    id: 'ins_002',
    category: 'Positive Trend',
    severity: 'positive' as const,
    title: 'Haemoglobin levels improving',
    summary: 'Haemoglobin improved from 10.8 g/dL (Nov 2025) to 11.9 g/dL (Feb 2026), likely in response to iron supplementation.',
    recommendation: 'Continue current supplementation. Recheck in 2 months to confirm sustained improvement.',
    confidence: 92,
    sources: ['rec_001'],
    markers: ['Haemoglobin', 'MCV', 'MCH'],
  },
  {
    id: 'ins_003',
    category: 'Preventive Alert',
    severity: 'medium' as const,
    title: 'Vitamin D insufficiency noted',
    summary: 'Vitamin D (25-OH) is 18 ng/mL, below the optimal threshold of 30 ng/mL. This is associated with increased fatigue and bone density risk over time.',
    recommendation: 'Daily Vitamin D3 supplementation (2000 IU) and increased sun exposure recommended. Retest in 3 months.',
    confidence: 79,
    sources: ['rec_003'],
    markers: ['Vitamin D (25-OH)'],
  },
  {
    id: 'ins_004',
    category: 'Lifestyle Correlation',
    severity: 'low' as const,
    title: 'Metabolic markers correlated with BMI',
    summary: 'Elevated triglycerides and borderline LDL are consistent with metabolic syndrome patterns. These markers often respond well to dietary and physical activity changes.',
    recommendation: 'Mediterranean diet, 30 min aerobic activity 5x/week. Follow up lipid panel in 6 months.',
    confidence: 74,
    sources: ['rec_001', 'rec_003'],
    markers: ['Triglycerides', 'LDL Cholesterol', 'HDL Cholesterol'],
  },
]

const SEVERITY_META = {
  high: { label: 'High Risk', variant: 'error' as const, icon: AlertTriangle, bg: 'bg-error-soft/30 border-error-DEFAULT/20' },
  medium: { label: 'Medium', variant: 'warning' as const, icon: AlertTriangle, bg: 'bg-warning-soft/30 border-warning-DEFAULT/20' },
  low: { label: 'Low', variant: 'default' as const, icon: Lightbulb, bg: 'bg-parchment border-sand-light' },
  positive: { label: 'Positive', variant: 'success' as const, icon: CheckCircle, bg: 'bg-success-soft/30 border-success-DEFAULT/20' },
}

export default function VaultInsightsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/vault" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">AI Health Insights</h1>
          <p className="text-sm text-greige font-body mt-0.5">Preventive intelligence derived from your health records</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-ivory-warm border border-sand-light rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-gold-soft shrink-0 mt-0.5" />
        <p className="text-xs text-greige font-body">These are informational AI insights only. They do not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical decisions.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Insights', value: AI_INSIGHTS.length, icon: Brain },
          { label: 'Risks', value: AI_INSIGHTS.filter((i) => i.severity === 'high' || i.severity === 'medium').length, icon: AlertTriangle },
          { label: 'Positive', value: AI_INSIGHTS.filter((i) => i.severity === 'positive').length, icon: CheckCircle },
          { label: 'Avg Confidence', value: `${Math.round(AI_INSIGHTS.reduce((a, i) => a + i.confidence, 0) / AI_INSIGHTS.length)}%`, icon: TrendingUp },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center">
            <s.icon className="w-4 h-4 text-gold-soft mx-auto mb-1" />
            <p className="font-display text-xl text-charcoal-deep">{s.value}</p>
            <p className="text-[11px] text-greige">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Insights list */}
      <div className="space-y-4">
        {AI_INSIGHTS.map((insight) => {
          const meta = SEVERITY_META[insight.severity]
          const Icon = meta.icon
          return (
            <Card key={insight.id} className={cn('border', meta.bg)}>
              <CardContent className="p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    insight.severity === 'high' ? 'bg-error-soft' :
                    insight.severity === 'medium' ? 'bg-warning-soft' :
                    insight.severity === 'positive' ? 'bg-success-soft' : 'bg-parchment'
                  )}>
                    <Icon className={cn('w-4.5 h-4.5',
                      insight.severity === 'high' ? 'text-error-DEFAULT' :
                      insight.severity === 'medium' ? 'text-warning-DEFAULT' :
                      insight.severity === 'positive' ? 'text-success-DEFAULT' : 'text-gold-soft'
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-body font-semibold text-charcoal-deep">{insight.title}</p>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <p className="text-[11px] text-greige font-body">{insight.category} · Confidence: {insight.confidence}%</p>
                  </div>
                </div>

                {/* Confidence bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-greige font-body mb-1">
                    <span>AI Confidence</span>
                    <span>{insight.confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-sand-light rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full',
                        insight.confidence >= 85 ? 'bg-success-DEFAULT' :
                        insight.confidence >= 70 ? 'bg-warning-DEFAULT' : 'bg-greige'
                      )}
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-stone font-body leading-relaxed">{insight.summary}</p>

                {/* Markers */}
                <div className="flex flex-wrap gap-1.5">
                  {insight.markers.map((m) => (
                    <span key={m} className="text-[11px] font-body bg-ivory-cream border border-sand-light rounded-full px-2.5 py-1 text-charcoal-deep">
                      {m}
                    </span>
                  ))}
                </div>

                {/* Recommendation */}
                <div className="bg-ivory-cream border border-sand-light rounded-xl p-3">
                  <p className="text-[10px] font-body font-semibold text-charcoal-deep uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-gold-soft" /> Recommendation
                  </p>
                  <p className="text-xs text-stone font-body leading-relaxed">{insight.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
