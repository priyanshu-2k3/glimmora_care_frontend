'use client'

import { useEffect, useState } from 'react'
import { Tag, Plus, Edit2, Trash2, Loader2, X, AlertCircle, Star, Link2, Copy, Check } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { planApi, type PlanOut, type PlanCreate } from '@/lib/api'

const TYPE_LABEL: Record<string, string> = {
  org:     'Organisation',
  patient: 'Patient',
}

const DEFAULT_FORM: PlanCreate = {
  name: '',
  duration_months: 1,
  price: 0,
  discount_percent: 0,
  description: '',
  plan_type: 'org',
  is_popular: false,
  is_active: true,
}

export default function PlansPage() {
  const toast = useToast()
  const [plans, setPlans] = useState<PlanOut[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'org' | 'patient'>('org')
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanOut | null>(null)
  const [form, setForm] = useState<PlanCreate>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PlanOut | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copyPayLink(p: PlanOut) {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    navigator.clipboard.writeText(`${base}/pay?plan=${p.id}`)
    setCopiedId(p.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function load() {
    setLoading(true)
    try {
      const data = await planApi.adminListPlans()
      setPlans(data)
    } catch {
      setPlans([])
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditingPlan(null)
    setForm({ ...DEFAULT_FORM, plan_type: typeFilter })
    setShowModal(true)
  }

  function openEdit(p: PlanOut) {
    setEditingPlan(p)
    setForm({
      name: p.name,
      duration_months: p.duration_months,
      price: p.price,
      discount_percent: p.discount_percent,
      description: p.description ?? '',
      plan_type: p.plan_type,
      is_popular: p.is_popular,
      is_active: p.is_active,
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingPlan(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingPlan) {
        await planApi.updatePlan(editingPlan.id, form)
        toast.success('Plan updated')
      } else {
        await planApi.createPlan(form)
        toast.success('Plan created')
      }
      closeModal()
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await planApi.deletePlan(deleteTarget.id)
      toast.success(`Plan "${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Failed to delete plan')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = plans.filter((p) => p.plan_type === typeFilter)

  const perMonth = (p: PlanOut) =>
    p.duration_months > 0 ? Math.round(p.price / p.duration_months) : p.price

  return (
    <RoleGuard allowed={['super_admin']}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-body text-2xl lg:text-3xl font-bold text-charcoal-deep flex items-center gap-2">
              <Tag className="w-5 h-5 text-gold-soft" /> Subscription Plans
            </h1>
            <p className="text-sm text-stone font-body mt-1">
              Create and edit plans for organisations and patients. Changes reflect immediately on the subscription page.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> New Plan
          </Button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2">
          {(['org', 'patient'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-sm font-body font-medium px-4 py-1.5 rounded-full border transition-colors ${
                typeFilter === t
                  ? 'bg-gold-soft text-white border-gold-soft'
                  : 'bg-white text-stone border-sand-light hover:border-gold-soft hover:text-charcoal-deep'
              }`}
            >
              {TYPE_LABEL[t]} Plans
            </button>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent>
            {loading ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-greige font-body py-8 text-center">
                No {TYPE_LABEL[typeFilter].toLowerCase()} plans yet. Click &ldquo;New Plan&rdquo; to add one.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-stone border-b border-sand-light">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Duration</th>
                      <th className="py-2 pr-4 font-medium">Price</th>
                      <th className="py-2 pr-4 font-medium">Per Month</th>
                      <th className="py-2 pr-4 font-medium">Discount</th>
                      <th className="py-2 pr-4 font-medium">Popular</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-sand-light/50 last:border-0">
                        <td className="py-2.5 pr-4 font-body font-medium text-charcoal-deep">
                          {p.name}
                        </td>
                        <td className="py-2.5 pr-4 text-stone">
                          {p.duration_months} {p.duration_months === 1 ? 'month' : 'months'}
                        </td>
                        <td className="py-2.5 pr-4 font-body font-semibold text-charcoal-deep">
                          ₹{p.price.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 pr-4 text-stone text-xs">
                          ₹{perMonth(p).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 pr-4 text-xs">
                          {p.discount_percent > 0 ? (
                            <span className="bg-emerald-soft text-emerald-muted font-semibold px-2 py-0.5 rounded-full">
                              Save {p.discount_percent}%
                            </span>
                          ) : (
                            <span className="text-greige">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          {p.is_popular ? (
                            <Star className="w-4 h-4 text-gold-soft fill-gold-soft" />
                          ) : (
                            <span className="text-greige text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          {p.is_active ? (
                            <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-emerald-soft text-emerald-muted">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C]">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1">
                            {p.plan_type === 'org' && (
                              <button
                                onClick={() => copyPayLink(p)}
                                title="Copy shareable payment link"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-stone hover:text-charcoal-deep hover:bg-parchment transition-colors"
                              >
                                {copiedId === p.id
                                  ? <><Check className="w-3.5 h-3.5 text-[#059669]" /> Copied</>
                                  : <><Link2 className="w-3.5 h-3.5" /> Link</>
                                }
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(p)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-stone hover:text-charcoal-deep hover:bg-parchment transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-stone hover:text-[#B91C1C] hover:bg-error-soft transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-stone font-body">
          Showing {filtered.length} {TYPE_LABEL[typeFilter].toLowerCase()} plan{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-charcoal-deep/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative z-10 w-full max-w-md bg-white border border-sand-light rounded-2xl p-5 animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <p className="text-base font-body font-semibold text-charcoal-deep">
                  {editingPlan ? 'Edit Plan' : 'New Subscription Plan'}
                </p>
                <button onClick={closeModal} className="p-1.5 rounded-lg text-stone hover:text-charcoal-deep hover:bg-parchment transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-body font-medium text-stone block mb-1">Plan Name *</label>
                  <Input
                    placeholder="e.g. 6 Months"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-body font-medium text-stone block mb-1">Duration (months) *</label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 6"
                      value={form.duration_months}
                      onChange={(e) => setForm((f) => ({ ...f, duration_months: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-body font-medium text-stone block mb-1">Price (₹) *</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 8999"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-body font-medium text-stone block mb-1">Discount %</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="e.g. 25"
                    value={form.discount_percent}
                    onChange={(e) => setForm((f) => ({ ...f, discount_percent: Number(e.target.value) }))}
                  />
                  {(form.discount_percent ?? 0) > 0 && (
                    <p className="text-xs text-emerald-muted mt-1">Save {form.discount_percent}%</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-body font-medium text-stone block mb-1">Description (optional)</label>
                  <Input
                    placeholder="Short tagline shown on plan card"
                    value={form.description ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-body font-medium text-stone block mb-2">Plan Type *</label>
                  <div className="flex gap-4">
                    {(['org', 'patient'] as const).map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="plan_type"
                          value={t}
                          checked={form.plan_type === t}
                          onChange={() => setForm((f) => ({ ...f, plan_type: t }))}
                          className="accent-[var(--color-gold-soft,#B8860B)]"
                        />
                        <span className="text-sm font-body text-charcoal-deep">{TYPE_LABEL[t]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-charcoal-deep">Mark as Popular</span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_popular: !f.is_popular }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.is_popular ? 'bg-gold-soft' : 'bg-sand-light'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_popular ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-charcoal-deep">Active</span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-gold-soft' : 'bg-sand-light'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
                  <Button type="submit" size="sm" isLoading={saving}>
                    {editingPlan ? 'Save Changes' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirm modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-charcoal-deep/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <div className="relative z-10 w-full max-w-md bg-white border border-[#DC2626]/30 rounded-2xl p-5 animate-fade-in">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-body font-semibold text-[#B91C1C]">Delete plan?</p>
                  <p className="text-xs text-stone mt-1">
                    <span className="font-medium text-charcoal-deep">{deleteTarget.name}</span> will be permanently removed.
                    Existing subscriptions are unaffected (they store a snapshot of the plan).
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button variant="danger" size="sm" isLoading={deleting} onClick={handleDelete}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
