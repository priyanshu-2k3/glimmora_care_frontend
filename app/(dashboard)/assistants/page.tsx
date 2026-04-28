'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Info, AlertTriangle, RotateCcw, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useGeminiChat } from '@/hooks/useGeminiChat'
import type { Persona } from '@/types/chat'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/Select'
import { formatConfidence } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { orgApi, getAccessToken } from '@/lib/api'
import type { PatientOut } from '@/lib/api'
import type { Role } from '@/types/auth'

const PERSONA_CONFIG: Record<Persona, { label: string; description: string; color: string; starterPrompts: string[] }> = {
  patient: {
    label: 'Patient Assistant',
    description: 'Explains your health records in simple language',
    color: 'bg-azure-whisper text-sapphire-deep',
    starterPrompts: ['What does my HbA1c trend mean?', 'Why is my hemoglobin low?', 'Explain my blood pressure readings', 'What should I track for diabetes prevention?'],
  },
  doctor: {
    label: 'Doctor Assistant',
    description: 'Structured patient summaries and consultation briefs',
    color: 'bg-parchment text-charcoal-deep',
    starterPrompts: ["Priya Sharma's clinical summary", "Ramesh Patel's risk brief", 'Show HbA1c correlation analysis', "Today's consultation preparation"],
  },
  admin: {
    label: 'Admin Assistant',
    description: 'Operational management and team coordination',
    color: 'bg-champagne text-gold-deep',
    starterPrompts: ['Pending consent requests summary', 'Doctor assignment status', 'Team activity this week', 'Audit log highlights'],
  },
  super_admin: {
    label: 'System Intelligence',
    description: 'Full platform oversight and governance insights',
    color: 'bg-charcoal-warm/10 text-charcoal-deep',
    starterPrompts: ['Platform health summary', 'Agent performance status', 'User growth metrics', 'System compliance overview'],
  },
}

const ROLE_TO_PERSONA: Record<Role, Persona> = {
  patient:    'patient',
  doctor:     'doctor',
  admin:      'admin',
  super_admin: 'super_admin',
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-gold-whisper border border-gold-soft/40 flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-charcoal-deep" />
      </div>
      <div className="bg-ivory-warm border border-sand-light rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 bg-greige rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AssistantsPage() {
  const { user } = useAuth()
  const role = (user?.role ?? 'patient') as Role
  const activePersona: Persona = ROLE_TO_PERSONA[role] ?? 'patient'

  const [patients, setPatients] = useState<PatientOut[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')

  const needsPatientPicker =
    activePersona === 'doctor' || activePersona === 'admin'

  useEffect(() => {
    if (!needsPatientPicker || !getAccessToken()) return
    setPatientsLoading(true)
    const fetch = activePersona === 'doctor'
      ? orgApi.getDoctorPatients()
      : orgApi.listPatients()
    fetch
      .then((list) => {
        setPatients(list)
        if (list.length > 0 && !selectedPatientId) {
          setSelectedPatientId(list[0].patient_id)
        }
      })
      .catch(() => {})
      .finally(() => setPatientsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePersona, needsPatientPicker])

  const {
    messages, isTyping, sendMessage, clearMessages,
    } = useGeminiChat(
      activePersona,
      needsPatientPicker ? selectedPatientId || null : null,
    )

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const config = PERSONA_CONFIG[activePersona]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isTyping) return
    setInput('')
    await sendMessage(trimmed)
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-greige text-xs font-body mb-3">
          <span>GlimmoraCare</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold-deep">Assistant</span>
        </div>
        <h1 className="font-display text-4xl text-charcoal-deep tracking-tight leading-tight">AI Assistant</h1>
        <p className="text-sm text-stone font-body mt-2">
          {config.label} · Non-diagnostic · Confidence-scored
        </p>
      </div>

      <div className="space-y-4">

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-warning-soft/25 border border-warning-soft/60 rounded-xl px-4 py-3">
        <AlertTriangle className="text-red-500 w-4 h-4 text-warning-DEFAULT shrink-0 mt-0.5" />
        <p className="text-xs text-warning-DEFAULT font-body text-black">
          <strong>Important:</strong> This assistant provides informational context only. It does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical decisions.
        </p>
      </div>

      {/* Patient picker — doctor / admin only.  Scopes the health context
           injected into the prompt.  When no patient is selected the AI
           answers generically (no records / insights in context). */}
      {needsPatientPicker && (
        <Card>
          <CardContent>
            {patientsLoading ? (
              <div className="h-10 bg-sand-light rounded-lg animate-pulse" />
            ) : patients.length === 0 ? (
              <p className="text-sm text-greige font-body">
                No patients assigned yet — the assistant will answer without any
                patient-specific context.
              </p>
            ) : (
              <Select
                label="Discuss patient"
                options={[
                  { value: '', label: 'No specific patient (generic questions only)' },
                  ...patients.map((p) => ({
                    value: p.patient_id,
                    label: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
                      || p.email
                      || p.patient_id,
                  })),
                ]}
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value)
                  clearMessages()
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Chat window */}
      <Card className="flex flex-col" style={{ height: '500px' }}>
        <CardHeader className="border-b border-sand-light shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('px-2.5 py-1 rounded-full text-xs font-body font-medium', config.color)}>
                {config.label}
              </div>
              <CardDescription>{config.description}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={clearMessages} className="text-greige">
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Bot className="w-10 h-10 text-greige mb-3" />
              <p className="text-sm text-charcoal-warm font-body font-medium">Start a conversation</p>
              <p className="text-xs text-greige font-body mb-5">Try one of these prompts:</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                {config.starterPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-xs px-3 py-1.5 bg-parchment text-stone hover:bg-sand-light rounded-full transition-colors font-body"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex items-end gap-2', msg.role === 'user' && 'flex-row-reverse')}>
              {msg.role === 'assistant' ? (
                <div className="w-7 h-7 rounded-full bg-gold-whisper border border-gold-soft/40 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-charcoal-deep" />
                </div>
              ) : (
                <Avatar name={user?.name ?? 'User'} size="sm" />
              )}
              <div className={cn('max-w-[75%]', msg.role === 'user' && 'items-end flex flex-col')}>
                <div
                  data-role={msg.role}
                  className={cn(
                    'px-4 py-3 rounded-2xl text-sm font-body leading-relaxed whitespace-pre-line',
                    msg.role === 'user'
                      ? 'bg-charcoal-deep text-ivory-cream rounded-br-sm'
                      : 'bg-ivory-warm border border-sand-light text-charcoal-warm rounded-bl-sm'
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.confidenceScore && (
                  <div className="flex items-center gap-2 mt-1 ml-1">
                    <Badge variant="default" className="text-[9px]">
                      <Info className="w-2.5 h-2.5" /> {formatConfidence(msg.confidenceScore)} confidence
                    </Badge>
                    {msg.sourceMarkers && msg.sourceMarkers.length > 0 && (
                      <span className="text-[9px] text-greige font-body">
                        Source: {msg.sourceMarkers.join(', ')}
                      </span>
                    )}
                  </div>
                )}
                {msg.role === 'assistant' && msg.disclaimer && (
                  <p className="text-[9px] text-greige font-body mt-0.5 ml-1 max-w-xs">{msg.disclaimer}</p>
                )}
              </div>
            </div>
          ))}

          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-sand-light p-3 shrink-0">
          <div className="flex gap-2">
            <input
              data-testid="chat-input"
              className="flex-1 bg-ivory-warm border border-sand-DEFAULT rounded-xl px-4 py-2.5 text-sm font-body text-charcoal-deep placeholder:text-greige focus:outline-none focus:border-gold-soft transition-colors"
              placeholder="Ask about health markers, trends, or patient summaries..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              disabled={isTyping}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="md" className="bg-gold-whisper text-charcoal-deep border border-gold-soft/40 hover:opacity-90">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
      </div>
    </div>
  )
}
