import { Cloud, Folder as FolderIcon, FolderOpen, HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WorkspaceStorageIcon({ kind, className }: { kind: 'cloud' | 'local'; className?: string }) {
  const Icon = kind === 'cloud' ? Cloud : HardDrive
  return (
    <Icon
      aria-hidden="true"
      className={cn('workspace-storage-icon', `workspace-storage-icon-${kind}`, className)}
      size={16}
      strokeWidth={1.8}
    />
  )
}

export function CollectionFolderIcon({ open }: { open: boolean }) {
  const Icon = open ? FolderOpen : FolderIcon
  return <Icon aria-hidden="true" className="folder-glyph" size={15} strokeWidth={1.8} />
}
