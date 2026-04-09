'use client'

import { useState, useCallback, useRef } from 'react'
import { API_BASE, getAccessToken } from '@/lib/api'
import type { ChatMessage, Persona } from '@/types/chat'

interface HistoryMessage {
  role: 'user' | 'model'
  parts: string
}

export function useGeminiChat(persona: Persona) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const historyRef = useRef<HistoryMessage[]>([])

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
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
          throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`)
        }

        const data = await res.json() as {
          response: string
          confidence_score: number
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
          confidenceScore: data.confidence_score,
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
    [persona]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    historyRef.current = []
  }, [])

  return { messages, isTyping, sendMessage, clearMessages }
}
