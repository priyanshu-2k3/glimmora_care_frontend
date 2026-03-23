'use client'

import { useState } from 'react'
import { Bot, Activity, Pause, Loader2, AlertCircle, RotateCcw, Zap, ShieldCheck, TrendingUp } from 'lucide-react'
import { MOCK_AGENTS } from '@/data/agents'
import type { Agent, AgentStatus, ActivitySeverity } from '@/types/agent'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATUS_META: Record<AgentStatus, { label: string; icon: React.ElementType; color: string }> = {
  active: { label: 'Active', icon: Activity, color: 'text-success-DEFAULT' },
  idle: { label: 'Idle', icon: Pause, color: 'text-greige' },
  processing: { label: 'Processing', icon: Loader2, color: 'text-gold-deep' },
  paused: { label: 'Paused', icon: Pause, color: 'text-stone' },
  error: { label: 'Error', icon: AlertCircle, color: 'text-error-DEFAULT' },
}

const SEVERITY_META: Record<ActivitySeverity, { variant: 'default' | 'gold' | 'success' | 'warning' | 'error' | 'info' | 'dark'; className: string }> = {
  info:    { variant: 'info',    className: 'bg-azure-whisper text-sapphire-deep border-sapphire-mist font-semibold shadow-sm' },
  warning: { variant: 'warning', className: 'bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm' },
  success: { variant: 'success', className: 'bg-success-soft text-success-DEFAULT border-success-DEFAULT font-semibold shadow-sm' },
  error:   { variant: 'error',   className: 'bg-error-soft text-error-DEFAULT border-error-DEFAULT font-semibold shadow-sm' },
}

function AgentCard({ agent }: { agent: Agent }) {
  const [enabled, setEnabled] = useState(agent.isEnabled)
  const status = STATUS_META[agent.status]
  const StatusIcon = status.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-parchment flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-greige" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base font-body font-semibold">{agent.name}</CardTitle>
              <Toggle checked={enabled} onChange={setEnabled} size="sm" />
            </div>
            <CardDescription className="line-clamp-2">{agent.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="font-body text-lg font-bold text-charcoal-deep">{agent.totalActions.toLocaleString()}</p>
            <p className="text-xs text-greige font-body">Total Actions</p>
          </div>
          <div className="text-center">
            <p className="font-body text-lg font-bold text-charcoal-deep">{agent.successRate}%</p>
            <p className="text-xs text-greige font-body">Success Rate</p>
          </div>
          <div className="text-center">
            <div className={cn('flex items-center justify-center gap-1', status.color)}>
              <StatusIcon className={cn('w-3.5 h-3.5', agent.status === 'processing' && 'animate-spin')} />
              <span className="text-sm font-body font-medium">{status.label}</span>
            </div>
            <p className="text-xs text-greige font-body">Status</p>
          </div>
        </div>
        <Progress value={agent.successRate} variant={agent.successRate > 95 ? 'success' : 'gold'} size="sm" />

        {/* Recent activity */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-body font-medium text-charcoal-warm uppercase tracking-wider">Recent Activity</p>
          {agent.activities.slice(0, 2).map((act) => (
            <div key={act.id} className="flex items-start gap-2">
              <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', {
                'bg-success-DEFAULT': act.severity === 'success',
                'bg-warning-DEFAULT': act.severity === 'warning',
                'bg-error-DEFAULT': act.severity === 'error',
                'bg-sapphire-mist': act.severity === 'info',
              })} />
              <p className="text-xs text-stone font-body line-clamp-1">{act.description}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-sand-light">
          <p className="text-xs text-greige font-body">Last run: {formatDateTime(agent.lastRun)}</p>
          <Button variant="ghost" size="sm" className="text-xs">
            <RotateCcw className="w-3 h-3" />
            Force run
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AgentsPage() {
  const allActivities = MOCK_AGENTS.flatMap((a) => a.activities).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Autonomous Agent Framework</h1>
        <p className="text-sm text-greige font-body mt-1">5 controlled automation agents operating within governance boundaries</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Active Agents',   value: MOCK_AGENTS.filter((a) => a.status === 'active').length, icon: Bot,          bg: 'bg-azure-whisper',    color: 'text-sapphire-deep' },
          { label: 'Total Actions',   value: MOCK_AGENTS.reduce((s, a) => s + a.totalActions, 0).toLocaleString(),       icon: Zap,          bg: 'bg-champagne',        color: 'text-gold-deep' },
          { label: 'Ethics Violations', value: '0',                                                                       icon: ShieldCheck,  bg: 'bg-success-soft/20',  color: 'text-success-DEFAULT' },
          { label: 'Avg Success Rate', value: `${Math.round(MOCK_AGENTS.reduce((s, a) => s + a.successRate, 0) / MOCK_AGENTS.length)}%`, icon: TrendingUp, bg: 'bg-parchment', color: 'text-charcoal-warm' },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-center gap-3 p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <div>
              <p className="font-body text-xl font-bold text-charcoal-deep">{stat.value}</p>
              <p className="text-xs text-greige font-body">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent cards */}
        <div className="space-y-4 lg:col-span-1">
          {MOCK_AGENTS.map((agent) => <AgentCard key={agent.id} agent={agent} />)}
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base font-body font-semibold">Live Activity Feed</CardTitle>
              <CardDescription>All agent actions logged in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {allActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-sand-light last:border-0">
                    <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', {
                      'bg-success-DEFAULT': act.severity === 'success',
                      'bg-warning-DEFAULT': act.severity === 'warning',
                      'bg-error-DEFAULT': act.severity === 'error',
                      'bg-sapphire-mist': act.severity === 'info',
                    })} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-body font-medium text-charcoal-deep">{act.action}</p>
                        <Badge variant={SEVERITY_META[act.severity].variant} className={`text-[9px] px-2.5 py-0.5 ${SEVERITY_META[act.severity].className}`}>
                          {act.agentType.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone font-body mt-0.5 line-clamp-2">{act.description}</p>
                      <p className="text-[10px] text-greige font-body mt-0.5">{formatDateTime(act.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
