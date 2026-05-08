'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Activity, Eye, Upload, Shield, Download, Bot, Search, User, FileText, Filter, X, AlertTriangle, ArrowLeft, LogIn, LogOut, KeyRound, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { intakeApi, adminApi, getAccessToken } from '@/lib/api'
import type { AuditTrailEntry, AuditLogOut, AdminUserOut, AdminOrgItem } from '@/lib/api'
import { FriendlyRef, type IdMaps } from '@/components/admin/FriendlyRef'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'

const ACTION_META: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  upload:                { icon: Upload,   label: 'Record Uploaded',      color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  confirm:               { icon: FileText, label: 'Record Confirmed',     color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  manual_entry:          { icon: FileText, label: 'Manual Entry',         color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  read:                  { icon: Eye,      label: 'Record Viewed',        color: 'text-stone',           bg: 'bg-parchment'      },
  read_list:             { icon: Eye,      label: 'Records Listed',       color: 'text-stone',           bg: 'bg-parchment'      },
  download_url:          { icon: Download, label: 'Download Issued',      color: 'text-sapphire-deep',   bg: 'bg-azure-whisper'  },
  share:                 { icon: Shield,   label: 'Record Shared',        color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  revoke_share:          { icon: Shield,   label: 'Access Revoked',       color: 'text-[#B91C1C]',       bg: 'bg-error-soft'     },
  bulk_import:           { icon: Upload,   label: 'Bulk Import',          color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  assign_patient:        { icon: User,     label: 'Patient Assigned',     color: 'text-stone',           bg: 'bg-parchment'      },
  invite_doctor:         { icon: User,     label: 'Doctor Invited',       color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  update_role:           { icon: Shield,   label: 'Role Updated',         color: 'text-sapphire-deep',   bg: 'bg-azure-whisper'  },
  delete_user:           { icon: User,     label: 'User Deleted',         color: 'text-[#B91C1C]',       bg: 'bg-error-soft'     },
  ai_analysis:           { icon: Bot,      label: 'AI Analysis',          color: 'text-charcoal-deep',   bg: 'bg-ivory-warm'     },
  'auth.login':          { icon: LogIn,    label: 'Login',                color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  'auth.login_failed':   { icon: LogIn,    label: 'Login Failed',         color: 'text-[#B91C1C]',       bg: 'bg-error-soft'     },
  'auth.login_otp':      { icon: LogIn,    label: 'Login via OTP',        color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  'auth.login_email_otp':{ icon: LogIn,    label: 'Login via Email OTP',  color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  'auth.login_phone':    { icon: LogIn,    label: 'Login via Phone',      color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  'auth.login_google':   { icon: LogIn,    label: 'Login via Google',     color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  'auth.register':       { icon: User,     label: 'Account Registered',   color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  'auth.register_google':{ icon: User,     label: 'Registered via Google',color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  'auth.logout':         { icon: LogOut,   label: 'Logout',               color: 'text-stone',           bg: 'bg-parchment'      },
  'auth.logout_all':     { icon: LogOut,   label: 'Logout All Devices',   color: 'text-[#B45309]',       bg: 'bg-warning-soft'   },
  'auth.password_changed':{ icon: KeyRound,label: 'Password Changed',     color: 'text-[#B45309]',       bg: 'bg-warning-soft'   },
  'auth.password_reset': { icon: KeyRound, label: 'Password Reset',       color: 'text-[#B45309]',       bg: 'bg-warning-soft'   },
  'user.update':         { icon: User,     label: 'User Updated',         color: 'text-sapphire-deep',   bg: 'bg-azure-whisper'  },
  'user.delete':         { icon: User,     label: 'User Deleted',         color: 'text-[#B91C1C]',       bg: 'bg-error-soft'     },
  'org.create':          { icon: Shield,   label: 'Org Created',          color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  'org.update':          { icon: Shield,   label: 'Org Updated',          color: 'text-stone',           bg: 'bg-parchment'      },
  'org.update_mine':     { icon: Shield,   label: 'Org Details Updated',  color: 'text-stone',           bg: 'bg-parchment'      },
  'org.delete':          { icon: Shield,   label: 'Org Deleted',          color: 'text-[#B91C1C]',       bg: 'bg-error-soft'     },
  'org.admin_assigned':  { icon: User,     label: 'Admin Assigned',       color: 'text-sapphire-deep',   bg: 'bg-azure-whisper'  },
  'org.admin_removed':   { icon: User,     label: 'Admin Removed',        color: 'text-[#B45309]',       bg: 'bg-warning-soft'   },
  'org.coadmin_added':   { icon: User,     label: 'Co-admin Added',       color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  'org.doctor_invited':  { icon: User,     label: 'Doctor Invited',       color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  'org.doctor_created':  { icon: User,     label: 'Doctor Account Created',color: 'text-success-DEFAULT',bg: 'bg-success-soft'   },
  'org.doctor_linked':   { icon: User,     label: 'Doctor Linked',        color: 'text-success-DEFAULT', bg: 'bg-success-soft'   },
  'org.patient_assigned':  { icon: User,     label: 'Patient Assigned',       color: 'text-stone',           bg: 'bg-parchment'      },
  update_metadata:         { icon: FileText, label: 'Record Updated',          color: 'text-stone',           bg: 'bg-parchment'      },
  'profile.create':        { icon: User,     label: 'Dependent Profile Created',color: 'text-success-DEFAULT',bg: 'bg-success-soft'   },
  'profile.update':        { icon: User,     label: 'Dependent Profile Updated',color: 'text-stone',          bg: 'bg-parchment'      },
  'profile.delete':        { icon: User,     label: 'Dependent Profile Deleted',color: 'text-[#B91C1C]',      bg: 'bg-error-soft'     },
  'access.rule_created':   { icon: Shield,   label: 'Access Rule Created',     color: 'text-gold-deep',       bg: 'bg-gold-whisper'   },
  'access.rule_toggled':   { icon: Shield,   label: 'Access Rule Toggled',     color: 'text-stone',           bg: 'bg-parchment'      },
  'access.rule_deleted':   { icon: Shield,   label: 'Access Rule Deleted',     color: 'text-[#B91C1C]',       bg: 'bg-error-soft'     },
  'access.setting_updated':{ icon: Shield,   label: 'Access Setting Changed',  color: 'text-sapphire-deep',   bg: 'bg-azure-whisper'  },
}

function getMeta(action: string) {
  return ACTION_META[action] ?? { icon: Activity, label: action, color: 'text-greige', bg: 'bg-parchment' }
}

function buildDescription(row: LogRow): string {
  // If we have a detail string from the backend, use it directly — it is already human-readable.
  if (row.detail?.trim()) return row.detail.trim()
  switch (row.action) {
    case 'upload':                return 'A new health record was uploaded.'
    case 'confirm':               return 'A health record was confirmed and saved.'
    case 'manual_entry':          return 'A health record was added via manual entry.'
    case 'read':                  return 'A health record was viewed.'
    case 'read_list':             return 'The health records list was accessed.'
    case 'download_url':          return 'A download link was issued for a health record.'
    case 'share':                 return 'Access to a health record was shared with another user.'
    case 'revoke_share':          return 'A shared access to a health record was revoked.'
    case 'bulk_import':           return 'Multiple health records were imported in bulk.'
    case 'auth.login':            return 'Successful login with email and password.'
    case 'auth.login_failed':     return 'A login attempt failed due to invalid credentials.'
    case 'auth.login_otp':        return 'Successful login via phone OTP.'
    case 'auth.login_email_otp':  return 'Successful login via email OTP.'
    case 'auth.login_phone':      return 'Successful login via Firebase phone verification.'
    case 'auth.login_google':     return 'Successful login via Google.'
    case 'auth.register':         return 'A new account was registered.'
    case 'auth.register_google':  return 'A new account was created via Google sign-up.'
    case 'auth.logout':           return 'User logged out — current session revoked.'
    case 'auth.logout_all':       return 'User logged out from all devices — all sessions revoked.'
    case 'auth.password_changed': return 'Password was changed — all other sessions invalidated.'
    case 'auth.password_reset':   return 'Password was reset — all active sessions invalidated.'
    case 'user.update':           return 'A user account was updated.'
    case 'user.delete':           return 'A user account was permanently deleted.'
    case 'org.create':            return 'A new organisation was created.'
    case 'org.update':            return 'Organisation details were updated by super admin.'
    case 'org.update_mine':       return 'Organisation details were updated.'
    case 'org.delete':            return 'An organisation was permanently deleted.'
    case 'org.admin_assigned':    return 'An admin was assigned to an organisation.'
    case 'org.admin_removed':     return 'An admin was removed from an organisation.'
    case 'org.coadmin_added':     return 'A co-admin was added to the organisation.'
    case 'org.doctor_invited':    return 'A doctor was invited to join the organisation.'
    case 'org.doctor_created':    return 'A new doctor account was created and added to the organisation.'
    case 'org.doctor_linked':     return 'An existing doctor account was linked to the organisation.'
    case 'org.patient_assigned':   return 'A patient was assigned to a doctor.'
    case 'update_metadata':        return 'Health record metadata was updated.'
    case 'profile.create':         return 'A new dependent profile was created.'
    case 'profile.update':         return 'A dependent profile was updated.'
    case 'profile.delete':         return 'A dependent profile was deleted.'
    case 'access.rule_created':    return 'A new access control rule was created.'
    case 'access.rule_toggled':    return 'An access control rule was enabled or disabled.'
    case 'access.rule_deleted':    return 'An access control rule was deleted.'
    case 'access.setting_updated': return 'An access control setting was changed.'
    default:                       return `Action recorded: ${row.action}.`
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const ACCESS_ACTIONS = new Set(['read', 'read_list', 'download_url', 'share', 'revoke_share'])

const TABS = [
  { id: 'activity', label: 'Activity Logs', icon: <Activity className="w-4 h-4" /> },
  { id: 'access',   label: 'Access Logs',   icon: <Eye      className="w-4 h-4" /> },
]

interface LogRow {
  id: string
  action: string
  /** Resolved human name when available (e.g. "Priyanshu Verma (super_admin)") */
  actorLabel: string | null
  /** Raw performed_by ID — used as FriendlyRef fallback for old entries */
  actorRawId: string
  /** Resolved target name when available */
  targetLabel: string | null
  /** Raw target string — used as FriendlyRef fallback for old entries */
  targetRawId: string | null
  recordId: string | null
  detail: string
  severity?: string
  timestamp: string
}

function fromTrail(e: AuditTrailEntry): LogRow {
  return { id: e.id, action: e.action, actorLabel: null, actorRawId: '', targetLabel: null, targetRawId: null, recordId: e.record_id ?? null, detail: e.detail, timestamp: e.timestamp }
}
function fromAdminLog(e: AuditLogOut): LogRow {
  const actorLabel = e.actor_name
    ? `${e.actor_name}${e.actor_role ? ` (${e.actor_role})` : ''}`
    : null
  return {
    id: e.id,
    action: e.action,
    actorLabel,
    actorRawId: e.performed_by,
    targetLabel: e.target_name ?? null,
    targetRawId: e.target ?? null,
    recordId: null,
    detail: e.detail ?? '',
    severity: e.severity,
    timestamp: e.timestamp,
  }
}

function LogEntry({ row, idMaps }: { row: LogRow; idMaps: IdMaps }) {
  const [expanded, setExpanded] = useState(false)
  const meta = getMeta(row.action)
  const Icon = meta.icon
  const description = buildDescription(row)
  return (
    <div className="flex items-start gap-3 py-4 border-b border-sand-light last:border-0">
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', meta.bg)}>
        <Icon className={cn('w-4 h-4', meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-body font-medium text-charcoal-deep">{meta.label}</p>
          {row.severity && row.severity !== 'info' && (
            <Badge variant={row.severity === 'critical' ? 'error' : row.severity === 'warning' ? 'warning' : 'default'} className="text-[10px] capitalize">{row.severity}</Badge>
          )}
        </div>

        {/* Human-readable description */}
        <p className="text-xs text-stone font-body leading-relaxed">{description}</p>

        {/* Affected / actor chips */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {(row.actorLabel || row.actorRawId) && (
            <span className="inline-flex items-center gap-1 text-[11px] text-greige font-body">
              <User className="w-3 h-3 shrink-0" />
              <span className="font-medium text-charcoal-warm">By:</span>
              <span className="truncate max-w-[220px]">
                {row.actorLabel
                  ? <span className="text-charcoal-deep">{row.actorLabel}</span>
                  : <FriendlyRef refValue={row.actorRawId} maps={idMaps} inline />}
              </span>
            </span>
          )}
          {(row.targetLabel || row.targetRawId) && (
            <span className="inline-flex items-center gap-1 text-[11px] text-greige font-body">
              <Shield className="w-3 h-3 shrink-0" />
              <span className="font-medium text-charcoal-warm">Affected:</span>
              <span className="truncate max-w-[220px]">
                {row.targetLabel
                  ? <span className="text-charcoal-deep">{row.targetLabel}</span>
                  : <FriendlyRef refValue={row.targetRawId} maps={idMaps} inline />}
              </span>
            </span>
          )}
          {row.recordId && (
            <span className="inline-flex items-center gap-1 text-[11px] text-greige font-body">
              <FileText className="w-3 h-3 shrink-0" />
              <span className="font-medium text-charcoal-warm">Record:</span>
              <span className="truncate max-w-[140px]">{row.recordId}</span>
            </span>
          )}
        </div>

        {/* Timestamp + details toggle */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[11px] text-greige font-body">{formatDate(row.timestamp)}</span>
          {row.detail && (
            <>
              <span className="text-greige">·</span>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[11px] text-gold-deep font-body hover:underline transition-colors"
              >
                {expanded ? 'Hide details' : 'Details'}
              </button>
            </>
          )}
        </div>

        {/* Expandable raw detail */}
        {expanded && row.detail && (
          <div className="mt-2 px-3 py-2 bg-parchment border border-sand-light rounded-lg space-y-1">
            <p className="text-[10px] font-body font-semibold text-greige uppercase tracking-wider">Raw detail</p>
            <p className="text-[11px] font-body text-stone leading-relaxed break-words">{row.detail}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Filter bar shared component ─────────────────────────────────────────────

interface FilterOption { value: string; label: string }

function FilterDropdown({ label, options, selected, onChange, searchable = false }: {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (v: string[]) => void
  searchable?: boolean
}) {
  const [open, setOpen]         = useState(false)
  const [query, setQuery]       = useState('')
  const ref                     = useRef<HTMLDivElement>(null)
  const searchInputRef          = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  useEffect(() => {
    if (open && searchable) setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [open, searchable])

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  const filtered = searchable && query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const displayLabel = selected.length === 0 ? `All ${label}` : `${label} (${selected.length})`

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-body transition-all',
          selected.length > 0
            ? 'bg-charcoal-deep text-ivory-cream border-charcoal-deep'
            : 'bg-white text-greige border-sand-light hover:border-gold-soft hover:text-charcoal-deep'
        )}
      >
        <Filter className="w-3 h-3" />
        {displayLabel}
        <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-20 bg-white border border-sand-light rounded-xl shadow-lg min-w-[220px] flex flex-col max-h-72">
          {searchable && (
            <div className="px-3 pt-2.5 pb-1.5 border-b border-sand-light shrink-0">
              <div className="flex items-center gap-2 bg-parchment rounded-lg px-2.5 py-1.5">
                <Search className="w-3 h-3 text-greige shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}…`}
                  className="flex-1 bg-transparent text-xs font-body text-charcoal-deep placeholder:text-greige outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-greige hover:text-charcoal-deep transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="overflow-y-auto flex-1 py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-greige font-body text-center py-4">No results</p>
            ) : filtered.map((o) => (
              <label
                key={o.value}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-parchment cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="w-3.5 h-3.5 accent-charcoal-deep shrink-0"
                />
                <span className="text-xs font-body text-charcoal-deep">{o.label}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-sand-light pt-1.5 pb-2 px-3 shrink-0">
              <button
                onClick={() => { onChange([]); setOpen(false); setQuery('') }}
                className="text-[11px] text-greige hover:text-charcoal-deep font-body transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const PAGE_SIZE = 20

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const fromConsent = searchParams.get('from') === 'consent'

  // Shared
  const [rows, setRows]     = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  // Friendly-name maps for FriendlyRef (admin-only fetch).
  const [users, setUsers] = useState<Record<string, AdminUserOut>>({})
  const [orgs,  setOrgs ] = useState<Record<string, AdminOrgItem>>({})
  const idMaps: IdMaps = { users, orgs }

  useEffect(() => {
    if (!getAccessToken()) return
    // Seed the current user's own entry so their ID resolves to their name
    // even without admin permissions to fetch the full user list.
    if (user?.id) {
      const nameParts = (user.name ?? '').split(' ')
      const selfEntry: AdminUserOut = {
        id: user.id,
        email: user.email ?? '',
        first_name: nameParts[0] ?? '',
        last_name: nameParts.slice(1).join(' '),
        role: user.role ?? '',
        is_active: true,
        email_verified: true,
        organization: null,
        location: null,
        created_at: null,
      }
      setUsers((prev) => ({ ...prev, [user.id]: selfEntry }))
    }
    if (!isAdmin) return
    let alive = true
    Promise.all([
      adminApi.listUsers('').catch(() => [] as AdminUserOut[]),
      adminApi.listAllOrgs('').catch(() => [] as AdminOrgItem[]),
      adminApi.listDoctors().catch(() => [] as import('@/lib/api').AdminDoctorOut[]),
      adminApi.listPatients().catch(() => [] as import('@/lib/api').AdminPatientOut[]),
    ]).then(([u, o, doctors, patients]) => {
      if (!alive) return
      const userMap: Record<string, AdminUserOut> = Object.fromEntries(u.map((x) => [x.id, x]))
      doctors.forEach((d) => {
        if (!userMap[d.id]) userMap[d.id] = { id: d.id, email: d.email, first_name: d.first_name ?? '', last_name: d.last_name ?? '', role: 'doctor', is_active: true, email_verified: true, organization: d.org_id ?? null, location: null, created_at: null }
      })
      patients.forEach((p) => {
        if (!userMap[p.id]) userMap[p.id] = { id: p.id, email: p.email, first_name: p.first_name ?? '', last_name: p.last_name ?? '', role: 'patient', is_active: true, email_verified: true, organization: null, location: null, created_at: null }
      })
      setUsers(userMap)
      setOrgs(Object.fromEntries(o.map((x) => [x.id, x])))
    })
    return () => { alive = false }
  }, [isAdmin, user?.id])

  // Admin-specific filters
  const [severity, setSeverity]         = useState<string[]>([])
  const [actionFilter, setActionFilter] = useState<string[]>([])

  // Patient/doctor-specific filters (client-side)
  const [actionType, setActionType] = useState<string[]>([])
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef   = useRef(search)
  searchRef.current = search

  function reloadAdmin(q: string) {
    setLoading(true)
    adminApi.getAuditLogs({ search: q || undefined, limit: 500 })
      .then((logs) => setRows(logs.map(fromAdminLog)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }

  // Initial data load
  useEffect(() => {
    if (!getAccessToken()) { setLoading(false); return }
    if (isAdmin) {
      reloadAdmin(search)
    } else {
      Promise.all([
        intakeApi.getAuditTrail(500).catch(() => [] as AuditTrailEntry[]),
        adminApi.getAuditLogs({ limit: 500 }).catch(() => [] as AuditLogOut[]),
      ])
        .then(([trail, sysLogs]) => {
          const merged: LogRow[] = [...trail.map(fromTrail), ...sysLogs.map(fromAdminLog)]
          const seen = new Set<string>()
          const uniqueRows = merged.filter((row) => {
            const minuteTimestamp = row.timestamp.substring(0, 16)
            const compositeKey = `${row.action}|${minuteTimestamp}|${row.detail}`
            if (seen.has(row.id) || seen.has(compositeKey)) return false
            seen.add(row.id)
            return true
          })
          uniqueRows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
          setRows(uniqueRows)
        })
        .finally(() => setLoading(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  // Admin: debounced search re-fetch
  function handleSearch(q: string) {
    setSearch(q)
    setPage(1)
    if (!isAdmin) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => reloadAdmin(q), 400)
  }

  // Derive exact action pills from data present in rows (patient/doctor only)
  const availableActions = [...new Set(rows.map((r) => r.action))].sort()

  // Patient/doctor: client-side filtering — search + action multi-select + date range
  const patientFiltered = rows.filter((r) => {
    if (search) {
      const q = search.toLowerCase()
      const label = getMeta(r.action).label.toLowerCase()
      const matches =
        r.action.toLowerCase().includes(q) ||
        label.includes(q) ||
        r.detail.toLowerCase().includes(q) ||
        (r.actorLabel ?? r.actorRawId ?? '').toLowerCase().includes(q) ||
        (r.targetLabel ?? r.targetRawId ?? '').toLowerCase().includes(q) ||
        (r.recordId ?? '').toLowerCase().includes(q)
      if (!matches) return false
    }
    if (actionType.length > 0 && !actionType.includes(r.action)) return false
    if (dateFrom && r.timestamp < dateFrom) return false
    if (dateTo   && r.timestamp > dateTo + 'T23:59:59') return false
    return true
  })

  // Admin: apply severity + action filters client-side
  const adminFiltered = rows.filter((r) => {
    if (severity.length > 0 && !severity.includes(r.severity ?? 'info')) return false
    if (actionFilter.length > 0 && !actionFilter.includes(r.action)) return false
    return true
  })

  const displayRows = isAdmin ? adminFiltered : patientFiltered

  // Reset page whenever any filter changes
  useEffect(() => { setPage(1) }, [actionType, severity, actionFilter, dateFrom, dateTo, search])

  const totalEvents  = rows.length
  const viewCount    = isAdmin
    ? rows.filter((r) => r.severity === 'warning').length
    : rows.filter((r) => r.action === 'read').length
  const exportCount  = isAdmin
    ? rows.filter((r) => r.severity === 'critical').length
    : rows.filter((r) => r.action === 'download_url').length

  const adminActions = [...new Set(rows.map((r) => r.action))].sort()

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        {fromConsent && (
          <div className="mb-4">
            <Link
              href="/consent"
              aria-label="Back to Consent Management"
              title="Back to Consent Management"
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-greige hover:text-charcoal-deep hover:bg-parchment rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-body font-medium">Back to Consent</span>
            </Link>
          </div>
        )}
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Audit Logs</h1>
        <p className="text-sm text-greige font-body mt-1">
          {isAdmin ? 'Full system audit trail — all user actions' : 'Immutable record of all activity on your health data'}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Events',                          value: loading ? '—' : totalEvents, icon: Activity },
          { label: isAdmin ? 'Warnings'    : 'Record Views', value: loading ? '—' : viewCount,   icon: isAdmin ? AlertTriangle : Eye      },
          { label: isAdmin ? 'Critical'    : 'Downloads',    value: loading ? '—' : exportCount,  icon: isAdmin ? Shield        : Download },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <s.icon className="w-4 h-4 text-gold-soft mx-auto mb-1.5" />
            <p className="font-display text-2xl text-charcoal-deep">{s.value}</p>
            <p className="text-[11px] text-greige font-body">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-sand-light rounded-xl px-4 py-3 focus-within:border-gold-soft transition-all">
        <Search className="w-4 h-4 text-greige shrink-0" />
        <input
          type="text"
          placeholder={isAdmin ? 'Search by action, target, or user name…' : 'Search logs…'}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm font-body text-charcoal-deep placeholder:text-greige outline-none"
        />
        {search && (
          <button onClick={() => handleSearch('')} className="text-greige hover:text-charcoal-deep transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Admin filters */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Severity"
            options={['info', 'warning', 'critical'].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            selected={severity}
            onChange={setSeverity}
          />
          <FilterDropdown
            label="Action"
            options={adminActions.map((a) => ({ value: a, label: getMeta(a).label }))}
            selected={actionFilter}
            onChange={setActionFilter}
            searchable
          />
          {(severity.length > 0 || actionFilter.length > 0) && (
            <button
              onClick={() => { setSeverity([]); setActionFilter([]) }}
              className="text-xs text-greige hover:text-charcoal-deep font-body transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Patient / Doctor filters */}
      {!isAdmin && (
        <div className="space-y-3 p-4 bg-parchment rounded-xl border border-sand-light">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-greige" />
            <span className="text-xs font-body font-semibold text-greige">Filters</span>
            <FilterDropdown
              label="Type"
              options={availableActions.map((a) => ({ value: a, label: getMeta(a).label }))}
              selected={actionType}
              onChange={(v) => { setActionType(v); setPage(1) }}
              searchable
            />
            {actionType.length > 0 && (
              <button
                onClick={() => setActionType([])}
                className="text-xs text-greige hover:text-charcoal-deep font-body transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] text-greige font-body font-semibold uppercase tracking-wider">Date:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs border border-sand-light rounded-lg px-2.5 py-1.5 bg-white font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
            />
            <span className="text-xs text-greige">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs border border-sand-light rounded-lg px-2.5 py-1.5 bg-white font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-xs text-greige hover:text-charcoal-deep transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <Tabs tabs={TABS} defaultTab={fromConsent ? 'access' : undefined} onChange={() => setPage(1)}>
        {(activeTab) => {
          const tabRows = activeTab === 'activity'
            ? displayRows.filter((r) => !ACCESS_ACTIONS.has(r.action))
            : displayRows.filter((r) => ACCESS_ACTIONS.has(r.action))
          const tabTotal = tabRows.length
          const tabTotalPages = Math.ceil(tabTotal / PAGE_SIZE)
          const list = tabRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
          return (
            <Card>
              <CardHeader>
                <CardTitle className="font-body text-base">
                  {activeTab === 'activity' ? 'Activity Events' : 'Data Access Events'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'activity'
                    ? `${tabTotal} non-access event${tabTotal !== 1 ? 's' : ''}${tabTotalPages > 1 ? ` · page ${page} of ${tabTotalPages}` : ''}`
                    : `${tabTotal} access event${tabTotal !== 1 ? 's' : ''} — who viewed your data`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 px-5">
                {loading ? (
                  <div className="space-y-4 py-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-sand-light shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-sand-light rounded w-1/3" />
                          <div className="h-2 bg-sand-light rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : list.length === 0 ? (
                  <div className="py-10 text-center">
                    <Activity className="w-10 h-10 text-greige mx-auto mb-3" />
                    <p className="text-sm text-greige font-body">No logs found</p>
                  </div>
                ) : (
                  list.map((row) => <LogEntry key={row.id} row={row} idMaps={idMaps} />)
                )}
              </CardContent>
              {tabTotalPages > 1 && (
                <div className="px-5 pb-4">
                  <Pagination page={page} totalPages={tabTotalPages} onPageChange={setPage} />
                </div>
              )}
            </Card>
          )
        }}
      </Tabs>
    </div>
  )
}
