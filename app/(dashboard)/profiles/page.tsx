'use client'

import { useState } from 'react'
import { User, Plus, Check, Pencil, Trash2, Baby, Heart, Users } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import type { Profile, ProfileRelation } from '@/types/profile'

const RELATION_ICONS: Record<ProfileRelation, React.ElementType> = {
  self: User,
  spouse: Heart,
  child: Baby,
  parent: Users,
  sibling: Users,
}

const RELATION_OPTIONS = [
  { value: 'self', label: 'Self' },
  { value: 'spouse', label: 'Spouse / Partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
]

const BLOOD_OPTIONS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'].map((v) => ({ value: v, label: v }))

export default function ProfilesPage() {
  const { profiles, activeProfile, switchProfile, canSwitchProfile, createProfile, updateProfile, deleteProfile } = useProfile()
  const [showCreate, setShowCreate] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; dob: string; bloodGroup: string; gender: 'male' | 'female' | 'other'; relation: ProfileRelation }>({ name: '', dob: '', bloodGroup: 'B+', gender: 'female', relation: 'spouse' })
  const [form, setForm] = useState<{ name: string; dob: string; bloodGroup: string; gender: 'male' | 'female' | 'other'; relation: ProfileRelation }>({ name: '', dob: '', bloodGroup: 'B+', gender: 'female', relation: 'spouse' })

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingProfile) return
    await updateProfile(editingProfile.id, editForm)
    setEditingProfile(null)
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    createProfile(form)
    setShowCreate(false)
    setForm({ name: '', dob: '', bloodGroup: 'B+', gender: 'female', relation: 'spouse' })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Family Profiles</h1>
          <p className="text-sm text-greige font-body mt-1">
            {canSwitchProfile ? 'Switch between health profiles under your account' : 'Your family health profiles'}
          </p>
        </div>
        {canSwitchProfile && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="w-4 h-4" />
            Add Profile
          </Button>
        )}
      </div>

      {!canSwitchProfile && (
        <div className="bg-ivory-warm border border-sand-light rounded-xl p-4 flex items-start gap-3">
          <User className="w-4 h-4 text-greige shrink-0 mt-0.5" />
          <p className="text-xs text-greige font-body">Only the family account owner or admin can switch profiles. Contact your family account owner to change your access level.</p>
        </div>
      )}

      {/* Active profile banner */}
      {activeProfile && (
        <div className="bg-gold-whisper border border-gold-soft/40 rounded-xl p-4 flex items-center gap-3">
          <Avatar name={activeProfile.name} size="lg" />
          <div className="flex-1">
            <p className="text-xs text-gold-deep font-body font-medium uppercase tracking-wide mb-0.5">Active Profile</p>
            <p className="font-body font-semibold text-charcoal-deep">{activeProfile.name}</p>
            <p className="text-xs text-greige">{activeProfile.relation} · {activeProfile.bloodGroup} · DOB {activeProfile.dob}</p>
          </div>
          <Badge variant="gold">Active</Badge>
        </div>
      )}

      {/* Profile list */}
      <div className="space-y-3">
        {profiles.map((profile) => {
          const Icon = RELATION_ICONS[profile.relation]
          const isActive = activeProfile?.id === profile.id
          return (
            <Card
              key={profile.id}
              className={cn('transition-all duration-200', canSwitchProfile ? 'cursor-pointer' : 'cursor-default', isActive ? 'border-gold-soft shadow-sm' : canSwitchProfile ? 'hover:border-gold-soft/40 hover:shadow-sm' : '')}
              onClick={() => canSwitchProfile && switchProfile(profile.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn('w-11 h-11 rounded-full flex items-center justify-center border', isActive ? 'bg-gold-whisper border-gold-soft' : 'bg-ivory-warm border-sand-light')}>
                  <Icon className={cn('w-5 h-5', isActive ? 'text-gold-deep' : 'text-greige')} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-body font-semibold text-charcoal-deep">{profile.name}</p>
                    {isActive && <Check className="w-4 h-4 text-gold-deep" />}
                  </div>
                  <p className="text-xs text-greige capitalize">{profile.relation} · {profile.bloodGroup} · DOB {profile.dob}</p>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {!isActive && profile.relation !== 'self' && (
                    <button
                      onClick={() => deleteProfile(profile.id)}
                      className="p-1.5 text-greige hover:text-error-DEFAULT rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingProfile(profile)
                      setEditForm({ name: profile.name, dob: profile.dob, bloodGroup: profile.bloodGroup, gender: profile.gender, relation: profile.relation })
                    }}
                    className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create profile form */}
      {showCreate && (
        <Card className="border-gold-soft/40">
          <CardHeader>
            <CardTitle className="font-body text-lg">Add New Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="e.g. Rohit Sharma"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <Select
                label="Relation"
                options={RELATION_OPTIONS}
                value={form.relation}
                onChange={(e) => setForm((p) => ({ ...p, relation: e.target.value as ProfileRelation }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
                  required
                />
                <Select
                  label="Blood Group"
                  options={BLOOD_OPTIONS}
                  value={form.bloodGroup}
                  onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))}
                />
              </div>
              <Select
                label="Gender"
                options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'other', label: 'Other' }]}
                value={form.gender}
                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value as 'male' | 'female' | 'other' }))}
              />
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">Create Profile</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit profile form */}
      {editingProfile && (
        <Card className="border-gold-soft/40">
          <CardHeader>
            <CardTitle className="font-body text-lg">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEdit} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="e.g. Rohit Sharma"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <Select
                label="Relation"
                options={RELATION_OPTIONS}
                value={editForm.relation}
                onChange={(e) => setEditForm((p) => ({ ...p, relation: e.target.value as ProfileRelation }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={editForm.dob}
                  onChange={(e) => setEditForm((p) => ({ ...p, dob: e.target.value }))}
                />
                <Select
                  label="Blood Group"
                  options={BLOOD_OPTIONS}
                  value={editForm.bloodGroup}
                  onChange={(e) => setEditForm((p) => ({ ...p, bloodGroup: e.target.value }))}
                />
              </div>
              <Select
                label="Gender"
                options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
                value={editForm.gender}
                onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value as 'male' | 'female' | 'other' }))}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingProfile(null)}>Cancel</Button>
                <Button type="submit" className="flex-1">Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
