'use client'

import { useState, useCallback } from 'react'
import type { ChatMessage, Persona } from '@/types/chat'
import { getResponse } from '@/data/chat-responses'

export function useMockChat(persona: Persona) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)

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

      // Simulate typing delay
      const response = getResponse(persona, content)
      const delay = 600 + content.length * 8 + Math.random() * 400

      await new Promise((r) => setTimeout(r, delay))

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        persona,
        confidenceScore: response.confidenceScore,
        disclaimer: response.disclaimer,
        sourceMarkers: response.sourceMarkers,
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsTyping(false)
    },
    [persona]
  )

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, isTyping, sendMessage, clearMessages }
}
