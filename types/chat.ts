export type Persona = 'patient' | 'doctor' | 'ngo' | 'government'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  persona: Persona
  confidenceScore?: number
  disclaimer?: string
  sourceMarkers?: string[]
}

export interface ChatResponse {
  keywords: string[]
  response: string
  confidenceScore: number
  disclaimer: string
  sourceMarkers?: string[]
}

export interface Conversation {
  id: string
  persona: Persona
  messages: ChatMessage[]
  startedAt: string
  lastUpdated: string
}
