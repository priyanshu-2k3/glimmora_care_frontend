import { Lock, Unlock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export function EncryptionBadge({ isEncrypted }: { isEncrypted: boolean }) {
  return (
    <Badge variant={isEncrypted ? 'dark' : 'warning'}>
      {isEncrypted ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
      {isEncrypted ? 'AES-256 Encrypted' : 'Unencrypted'}
    </Badge>
  )
}
