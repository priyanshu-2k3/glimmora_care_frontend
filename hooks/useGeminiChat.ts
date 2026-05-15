'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { API_BASE, getAccessToken } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { ChatMessage, Persona } from '@/types/chat'

function threadKey(persona: Persona, patientId: string | null | undefined): string {
  return `glimmora_thread_${persona}_${patientId ?? 'generic'}`
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  confidence: number | null
}

interface ThreadDetail {
  thread_id: string
  persona: Persona
  patient_id: string | null
  title: string | null
  created_at: string
  last_active: string
  message_count: number
  messages: StoredMessage[]
}

interface ThreadMessageResponse {
  thread_id: string
  response: string
  confidence_score: number | null
  disclaimer: string
  followup_questions: string[]
}

function storedToChat(m: StoredMessage, persona: Persona): ChatMessage {
  return {
    id: Math.random().toString(36).slice(2),
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    persona,
    confidenceScore: m.confidence ?? undefined,
  }
}

export function useGeminiChat(persona: Persona, patientId?: string | null) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isInitialising, setIsInitialising] = useState(true)
  const [followupQuestions, setFollowupQuestions] = useState<string[]>([])

  const threadIdRef = useRef<string | null>(null)
  const sendingRef = useRef(false)

  const userId = user?.id ?? null

  // Single effect handles both reset and init so React StrictMode can't
  // interleave two separate effects and run init twice.
  useEffect(() => {
    // Reset synchronously on every dependency change
    threadIdRef.current = null
    setMessages([])
    setFollowupQuestions([])
    setIsInitialising(true)

    if (!userId) {
      setIsInitialising(false)
      return
    }

    // Cancellation flag: the cleanup sets this so a stale async call that
    // resolves after the effect re-fires (StrictMode double-invoke, fast
    // patient switch) never commits state.
    let cancelled = false

    const key = threadKey(persona, patientId)
    const savedThreadId = localStorage.getItem(key)

    async function init() {
      try {
        if (savedThreadId) {
          try {
            const detail = await apiFetch<ThreadDetail>(`/chat/threads/${savedThreadId}`)
            if (cancelled) return
            threadIdRef.current = detail.thread_id
            setMessages(detail.messages.map((m) => storedToChat(m, persona)))
            return
          } catch {
            if (cancelled) return
            localStorage.removeItem(key)
          }
        }

        // POST /chat/threads is idempotent — server returns the existing thread
        // if one already exists for this user+persona+patient combo.
        const body: Record<string, unknown> = { persona }
        if (patientId) body.patient_id = patientId
        const created = await apiFetch<{ thread_id: string }>('/chat/threads', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        if (cancelled) return
        threadIdRef.current = created.thread_id
        localStorage.setItem(key, created.thread_id)
        setMessages([])
      } catch {
        // Silently degrade — chat still works, just won't persist
      } finally {
        if (!cancelled) setIsInitialising(false)
      }
    }

    init()

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, persona, patientId])

  const sendMessage = useCallback(
    async (content: string) => {
      if (sendingRef.current) return
      sendingRef.current = true

      const userMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        persona,
      }
      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)
      setFollowupQuestions([])

      try {
        const tid = threadIdRef.current
        if (!tid) throw new Error('No active thread')

        const data = await apiFetch<ThreadMessageResponse>(
          `/chat/threads/${tid}/messages`,
          { method: 'POST', body: JSON.stringify({ message: content }) },
        )

        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).slice(2),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          persona,
          confidenceScore: data.confidence_score ?? undefined,
          disclaimer: data.disclaimer,
          followupQuestions: data.followup_questions,
        }
        setMessages((prev) => [...prev, assistantMsg])
        setFollowupQuestions(data.followup_questions ?? [])
      } catch (err: unknown) {
        const errorText = err instanceof Error ? err.message : 'Failed to get response'
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            role: 'assistant',
            content: `⚠️ ${errorText}`,
            timestamp: new Date().toISOString(),
            persona,
            confidenceScore: 0,
          },
        ])
      } finally {
        setIsTyping(false)
        sendingRef.current = false
      }
    },
    [persona],
  )

  const clearMessages = useCallback(async () => {
    // Delete thread server-side, remove from localStorage, create fresh one
    const tid = threadIdRef.current
    const key = threadKey(persona, patientId)
    localStorage.removeItem(key)
    threadIdRef.current = null
    setMessages([])
    setFollowupQuestions([])

    if (tid && userId) {
      try {
        await apiFetch(`/chat/threads/${tid}`, { method: 'DELETE' })
      } catch {
        // Ignore — thread may already be gone
      }
    }

    if (!userId) return
    try {
      const body: Record<string, unknown> = { persona }
      if (patientId) body.patient_id = patientId
      const created = await apiFetch<{ thread_id: string }>('/chat/threads', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      threadIdRef.current = created.thread_id
      localStorage.setItem(key, created.thread_id)
    } catch {
      // Silently degrade
    }
  }, [persona, patientId, userId])

  return { messages, isTyping, isInitialising, followupQuestions, sendMessage, clearMessages }
}
