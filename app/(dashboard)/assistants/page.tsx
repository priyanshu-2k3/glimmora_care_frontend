'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Info, AlertTriangle, RotateCcw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useMockChat } from '@/hooks/useMockChat'
import type { Persona } from '@/types/chat'
import { ROLES } from '@/lib/constants'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatConfidence } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/auth'

const PERSONA_CONFIG: Record<Persona, { label: string; description: string; color: string; starterPrompts: string[] }> = {
  patient: {
    label: 'Patient Assistant',
    description: 'Explains your health records in simple language',
    color: 'bg-azure-whisper text-sapphire-deep',
    starterPrompts: ['What does my HbA1c trend mean?', 'Why is my hemoglobin low?', 'Show my blood pressure history', 'What records do I have?'],
  },
  doctor: {
    label: 'Doctor Assistant',
    description: 'Structured patient summaries and consultation briefs',
    color: 'bg-parchment text-charcoal-deep',
    starterPrompts: ["Priya Sharma's summary", "Ramesh Patel's brief", 'Show correlation analysis', 'Today\'s consultation briefs'],
  },
  ngo: {
    label: 'NGO Field Assistant',
    description: 'Village health data, screening gaps, sync status',
    color: 'bg-success-soft/10 text-success-DEFAULT',
    starterPrompts: ['Wadgaon village status', 'Maternal health summary', 'Offline sync status', 'Screening coverage'],
  },
  government: {
    label: 'Government Intelligence',
    description: 'Aggregated district and population insights',
    color: 'bg-champagne text-gold-deep',
    starterPrompts: ['Nashik district summary', 'Seasonal health patterns', 'Population coverage metrics'],
  },
}

const ROLE_TO_PERSONA: Record<Role, Persona> = {
  patient: 'patient',
  doctor: 'doctor',
  ngo_worker: 'ngo',
  gov_analyst: 'government',
  admin: 'doctor',
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
  const defaultPersona: Persona = user?.role ? ROLE_TO_PERSONA[user.role as Role] : 'patient'
  const [activePersona, setActivePersona] = useState<Persona>(defaultPersona)
  const { messages, isTyping, sendMessage, clearMessages } = useMockChat(activePersona)
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

  function switchPersona(p: Persona) {
    setActivePersona(p)
    clearMessages()
    setInput('')
  }

  const personas = Object.entries(PERSONA_CONFIG) as [Persona, typeof PERSONA_CONFIG[Persona]][]

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-charcoal-deep tracking-tight">AI Assistant</h1>
        <p className="text-sm text-greige font-body mt-1">Persona-based intelligence assistant · Non-diagnostic · Confidence-scored</p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-warning-soft/10 border border-warning-soft/30 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-warning-DEFAULT shrink-0 mt-0.5" />
        <p className="text-xs text-warning-DEFAULT font-body">
          <strong>Important:</strong> This assistant provides informational context only. It does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical decisions.
        </p>
      </div>

      {/* Persona selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {personas.map(([persona, cfg]) => (
          <button
            key={persona}
            onClick={() => switchPersona(persona)}
            className={cn(
              'text-left px-3 py-3 rounded-xl border text-sm font-body transition-all duration-200',
              activePersona === persona
                ? cfg.color + ' border-transparent shadow-sm'
                : 'bg-ivory-warm border-sand-light text-stone hover:border-sand-DEFAULT'
            )}
          >
            <p className="font-medium text-xs">{cfg.label}</p>
            <p className="text-[10px] opacity-70 mt-0.5 line-clamp-1">{cfg.description}</p>
          </button>
        ))}
      </div>

      {/* Chat window */}
      <Card className="flex flex-col" style={{ height: '500px' }}>
        <CardHeader className="border-b border-sand-light shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{config.label}</CardTitle>
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
                <div className={cn(
                  'px-4 py-3 rounded-2xl text-sm font-body leading-relaxed whitespace-pre-line',
                  msg.role === 'user'
                    ? 'bg-charcoal-deep text-ivory-cream rounded-br-sm'
                    : 'bg-ivory-warm border border-sand-light text-charcoal-warm rounded-bl-sm'
                )}>
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
              className="flex-1 bg-ivory-warm border border-sand-DEFAULT rounded-xl px-4 py-2.5 text-sm font-body text-charcoal-deep placeholder:text-greige focus:outline-none focus:border-gold-soft transition-colors"
              placeholder="Ask about health markers, trends, or patient summaries..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              disabled={isTyping}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping} size="md">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
