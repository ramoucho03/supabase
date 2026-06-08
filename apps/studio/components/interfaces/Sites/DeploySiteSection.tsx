import { FolderUp, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, cn, Switch } from 'ui'

import { useSiteDeployMutation } from '@/data/sites/site-deploy-mutation'
import { formatBytes } from './Sites.utils'

interface DeploySiteSectionProps {
  projectRef?: string
  slug?: string
  /** Called after a successful deploy (e.g. to switch to the Files tab). */
  onDeployed?: () => void
}

export const DeploySiteSection = ({ projectRef, slug, onDeployed }: DeploySiteSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const [selected, setSelected] = useState<File[]>([])
  const [replace, setReplace] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const { mutate: deploy, isPending: isDeploying } = useSiteDeployMutation({
    onSuccess: (data) => {
      toast.success(
        `Deployed ${data.files} file${data.files === 1 ? '' : 's'}${data.replaced ? ' (replaced existing)' : ''}`
      )
      clearSelection()
      onDeployed?.()
    },
  })

  const totalSize = selected.reduce((sum, file) => sum + file.size, 0)

  const clearSelection = () => {
    setSelected([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const dropped = Array.from(event.dataTransfer.files ?? [])
    if (dropped.length > 0) setSelected(dropped)
  }

  const onDeploy = () => {
    if (!projectRef || !slug || selected.length === 0) return
    deploy({ projectRef, slug, files: selected, mode: replace ? 'replace' : 'merge' })
  }

  const onlyZip = selected.length === 1 && selected[0].name.toLowerCase().endsWith('.zip')

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-base text-foreground">Deploy files</h3>
        <p className="text-sm text-foreground-light">
          Upload your build output — individual files, a whole folder, or a single{' '}
          <code className="text-code-inline">.zip</code> that is extracted on the server.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed px-6 py-10 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-foreground-muted bg-surface-200'
            : 'border-control bg-surface-100 hover:border-foreground-muted'
        )}
      >
        <UploadCloud size={22} strokeWidth={1.5} className="text-foreground-light" />
        <p className="text-sm text-foreground">Drag and drop files here, or click to browse</p>
        <p className="text-xs text-foreground-lighter">Up to 100 MB per file</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="default" onClick={() => fileInputRef.current?.click()}>
          Select files
        </Button>
        <Button type="default" icon={<FolderUp />} onClick={() => folderInputRef.current?.click()}>
          Select folder
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => setSelected(Array.from(e.target.files ?? []))}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        // webkitdirectory isn't in the React types but is widely supported.
        {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
        onChange={(e) => setSelected(Array.from(e.target.files ?? []))}
      />

      {selected.length > 0 && (
        <div className="rounded-md border border-control bg-surface-100">
          <div className="flex items-center justify-between px-4 py-2 border-b border-control">
            <span className="text-sm text-foreground">
              {selected.length} file{selected.length === 1 ? '' : 's'} selected
              <span className="text-foreground-lighter"> · {formatBytes(totalSize)}</span>
            </span>
            <Button
              type="text"
              className="px-1.5"
              icon={<X size={14} />}
              onClick={clearSelection}
            />
          </div>
          <ul className="max-h-40 overflow-y-auto px-4 py-2 text-xs font-mono text-foreground-light space-y-1">
            {selected.slice(0, 50).map((file, index) => {
              const path =
                (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
              return (
                <li key={`${path}-${index}`} className="flex items-center justify-between gap-4">
                  <span className="truncate">{path}</span>
                  <span className="text-foreground-lighter shrink-0">{formatBytes(file.size)}</span>
                </li>
              )
            })}
            {selected.length > 50 && (
              <li className="text-foreground-lighter">…and {selected.length - 50} more</li>
            )}
          </ul>
        </div>
      )}

      <label className="flex items-center gap-3 text-sm text-foreground-light">
        <Switch checked={replace} onCheckedChange={setReplace} />
        Replace all existing files (clears the site before uploading)
      </label>

      <div className="flex items-center gap-2">
        <Button
          icon={<UploadCloud />}
          loading={isDeploying}
          disabled={selected.length === 0}
          onClick={onDeploy}
        >
          Deploy{selected.length > 0 ? ` ${onlyZip ? 'archive' : `(${selected.length})`}` : ''}
        </Button>
        {selected.length > 0 && !isDeploying && (
          <Button type="default" onClick={clearSelection}>
            Clear
          </Button>
        )}
      </div>
    </Card>
  )
}
