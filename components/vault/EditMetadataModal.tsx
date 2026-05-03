import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { HealthRecord } from '@/types/intake'

interface EditMetadataModalProps {
  record: HealthRecord
  onClose: () => void
  onSave: (data: { title: string; date: string; source: string; type: string }) => Promise<void>
}

const RECORD_TYPES = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'vitals', label: 'Vitals' },
  { value: 'ngo_field_entry', label: 'NGO Field Entry' },
]

export function EditMetadataModal({ record, onClose, onSave }: EditMetadataModalProps) {
  const [title, setTitle] = useState(record.title)
  const [date, setDate] = useState(record.date)
  const [source, setSource] = useState(record.source)
  const [type, setType] = useState(record.type)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave({ title, date, source, type })
      onClose()
    } catch (err) {
      console.error(err)
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-deep/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-sand-light">
          <h2 className="font-display text-lg text-charcoal-deep">Edit Metadata</h2>
          <button onClick={onClose} className="text-greige hover:text-charcoal-deep transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-body font-medium text-charcoal-deep mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-azure-whisper/30 border border-sand-light rounded-lg text-sm text-charcoal-deep focus:outline-none focus:ring-1 focus:ring-sapphire-mist transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-charcoal-deep mb-1.5">
              Record Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-azure-whisper/30 border border-sand-light rounded-lg text-sm text-charcoal-deep focus:outline-none focus:ring-1 focus:ring-sapphire-mist transition-all"
            >
              {RECORD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-charcoal-deep mb-1.5">
              Date <span className="text-greige">(YYYY-MM-DD)</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-azure-whisper/30 border border-sand-light rounded-lg text-sm text-charcoal-deep focus:outline-none focus:ring-1 focus:ring-sapphire-mist transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-charcoal-deep mb-1.5">
              Source / Clinic
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 bg-azure-whisper/30 border border-sand-light rounded-lg text-sm text-charcoal-deep focus:outline-none focus:ring-1 focus:ring-sapphire-mist transition-all"
            />
          </div>
        </div>
        <div className="p-4 border-t border-sand-light flex justify-end gap-3 bg-azure-whisper/10">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving || !title || !date}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
