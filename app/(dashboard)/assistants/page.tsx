'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Info, AlertTriangle, RotateCcw, ChevronRight, Users, Check, X as XIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useGeminiChat } from '@/hooks/useGeminiChat'
import type { Persona } from '@/types/chat'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
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
  const [showPatientPicker, setShowPatientPicker] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const config = PERSONA_CONFIG[activePersona]

  // Close patient picker on outside click
  useEffect(() => {
    if (!showPatientPicker) return
    function onClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPatientPicker(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [showPatientPicker])

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId) ?? null
  const selectedPatientLabel = selectedPatient
    ? (`${selectedPatient.first_name ?? ''} ${selectedPatient.last_name ?? ''}`.trim()
        || selectedPatient.email
        || selectedPatient.patient_id)
    : null

  const filteredPatients = patientSearch.trim()
    ? patients.filter((p) => {
        const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim().toLowerCase()
        return name.includes(patientSearch.toLowerCase()) || (p.email ?? '').toLowerCase().includes(patientSearch.toLowerCase())
      })
    : patients

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
                {msg.role === 'assistant' && (
                  <details className="mt-1 ml-1 max-w-xs">
                    <summary className="cursor-pointer text-[10px] font-body font-medium text-gold-deep hover:text-charcoal-deep flex items-center gap-1">
                      <Bot className="w-2.5 h-2.5" />
                      Reasoning trace
                    </summary>
                    <ul className="mt-1 pl-3 space-y-0.5 text-[10px] text-greige font-body list-disc list-inside bg-ivory-warm border border-sand-light rounded-lg p-2">
                      <li>Parsed user intent from message context and persona ({config.label}).</li>
                      <li>Looked up matching markers / records in patient context.</li>
                      <li>Synthesised response using non-diagnostic, confidence-scored language.</li>
                    </ul>
                  </details>
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
          {/* Selected-patient chip — visible context line */}
          {needsPatientPicker && selectedPatientLabel && (
            <div className="flex items-center gap-2 mb-2 ml-1">
              <span className="text-[11px] text-greige font-body">Discussing:</span>
              <span className="inline-flex items-center gap-1.5 bg-gold-whisper border border-gold-soft/40 text-charcoal-deep text-[11px] font-body font-medium px-2.5 py-0.5 rounded-full">
                {selectedPatientLabel}
                <button
                  type="button"
                  onClick={() => { setSelectedPatientId(''); clearMessages() }}
                  className="text-greige hover:text-charcoal-deep"
                  aria-label="Clear selected patient"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          <div className="flex gap-2 items-center">
            {/* Patient picker icon — doctor / admin only */}
            {needsPatientPicker && (
              <div ref={pickerRef} className="relative group shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPatientPicker((s) => !s)}
                  disabled={patientsLoading || patients.length === 0}
                  aria-label="Select patient"
                  className={cn(
                    'p-2.5 rounded-xl border transition-all duration-200 relative',
                    selectedPatientId
                      ? 'bg-gold-whisper border-gold-soft text-gold-deep'
                      : 'bg-ivory-warm border-sand-DEFAULT text-greige hover:text-charcoal-deep hover:border-gold-soft/60',
                    (patientsLoading || patients.length === 0) && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <Users className="w-4 h-4" />
                  {selectedPatientId && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gold-deep rounded-full border border-white" />
                  )}
                </button>

                {/* Hover tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-charcoal-deep text-ivory-cream text-[10px] font-body whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
                  Select patient
                  <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-charcoal-deep" />
                </div>

                {/* Dropdown popover */}
                {showPatientPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-sand-light rounded-xl shadow-xl z-30 overflow-hidden">
                    <div className="px-3 py-2 border-b border-sand-light flex items-center justify-between">
                      <p className="text-[11px] font-body font-semibold text-charcoal-deep uppercase tracking-wide">Select patient</p>
                      <button
                        type="button"
                        onClick={() => setShowPatientPicker(false)}
                        className="text-greige hover:text-charcoal-deep"
                        aria-label="Close"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="px-3 py-2 border-b border-sand-light">
                      <input
                        type="text"
                        autoFocus
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        placeholder="Search patients…"
                        className="w-full bg-ivory-warm border border-sand-light rounded-lg px-2.5 py-1.5 text-xs font-body text-charcoal-deep placeholder:text-greige focus:outline-none focus:border-gold-soft"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {/* Generic / clear option */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatientId('')
                          setShowPatientPicker(false)
                          setPatientSearch('')
                          clearMessages()
                        }}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-body transition-colors',
                          !selectedPatientId ? 'bg-gold-whisper/40 text-charcoal-deep' : 'text-stone hover:bg-parchment/60',
                        )}
                      >
                        <span>No specific patient — generic questions</span>
                        {!selectedPatientId && <Check className="w-3.5 h-3.5 text-gold-deep shrink-0" />}
                      </button>
                      {filteredPatients.length === 0 && patientSearch.trim() && (
                        <p className="px-3 py-2 text-xs text-greige font-body">No matches</p>
                      )}
                      {filteredPatients.map((p) => {
                        const label = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email || p.patient_id
                        const isSel = p.patient_id === selectedPatientId
                        return (
                          <button
                            key={p.patient_id}
                            type="button"
                            onClick={() => {
                              setSelectedPatientId(p.patient_id)
                              setShowPatientPicker(false)
                              setPatientSearch('')
                              clearMessages()
                            }}
                            className={cn(
                              'w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-body transition-colors',
                              isSel ? 'bg-gold-whisper/40 text-charcoal-deep' : 'text-stone hover:bg-parchment/60',
                            )}
                          >
                            <span className="truncate">{label}</span>
                            {isSel && <Check className="w-3.5 h-3.5 text-gold-deep shrink-0" />}
                          </button>
                        )
                      })}
                      {patients.length === 0 && !patientsLoading && (
                        <p className="px-3 py-2 text-xs text-greige font-body">
                          No patients available. The assistant will answer without patient context.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
