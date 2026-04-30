'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { API_BASE, getAccessToken } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { ChatMessage, Persona } from '@/types/chat'

interface HistoryMessage {
  role: 'user' | 'model'
  parts: string
}

export function useGeminiChat(persona: Persona, patientId?: string | null) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const historyRef = useRef<HistoryMessage[]>([])

  // F1: when the authenticated user identity changes underneath the hook,
  // drop every byte of conversation state so a stale ``historyRef`` from
  // session A can never be sent under session B's JWT.  In the normal
  // logout flow the page unmounts (and a hard reload runs from
  // AuthContext); this is defence-in-depth for soft user switches,
  // dev-time hot reloads, and any future "impersonate" feature.
  const userId = user?.id ?? null
  useEffect(() => {
    setMessages([])
    historyRef.current = []
  }, [userId])

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        persona,
      }
      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      try {
        const token = getAccessToken()
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: content,
            persona,
            history: historyRef.current,
            // Doctor / admin personas: lets the backend load the selected
            // patient's records + insights into the prompt context.
            // Patient persona ignores this (server uses the JWT sub).
            ...(patientId ? { patient_id: patientId } : {}),
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
          throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`)
        }

        const data = await res.json() as {
          response: string
          // Null when the model didn't emit a "Confidence: XX%" line —
          // we hide the confidence chip in that case rather than fake a number.
          confidence_score: number | null
          disclaimer: string
          source_markers?: string[]
        }

        // Grow conversation history for multi-turn context
        historyRef.current = [
          ...historyRef.current,
          { role: 'user', parts: content },
          { role: 'model', parts: data.response },
        ]

        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).slice(2),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          persona,
          confidenceScore: data.confidence_score ?? undefined,
          disclaimer: data.disclaimer,
          sourceMarkers: data.source_markers ?? [],
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err: unknown) {
        const errorText = err instanceof Error ? err.message : 'Failed to get response'
        const errorMsg: ChatMessage = {
          id: Math.random().toString(36).slice(2),
          role: 'assistant',
          content: `⚠️ ${errorText}`,
          timestamp: new Date().toISOString(),
          persona,
          confidenceScore: 0,
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setIsTyping(false)
      }
    },
    [persona, patientId]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    historyRef.current = []
  }, [])

  return { messages, isTyping, sendMessage, clearMessages }
}
