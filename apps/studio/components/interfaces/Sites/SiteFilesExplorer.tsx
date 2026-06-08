import { useParams } from 'common'
import { ExternalLink, FilePlus, Loader2, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useEffect, useState, type ComponentProps } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Input,
} from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import AlertError from '@/components/ui/AlertError'
import CodeEditor from '@/components/ui/CodeEditor/CodeEditor'
import { useSiteFileContentQuery } from '@/data/sites/site-file-content-query'
import { useSiteFileDeleteMutation } from '@/data/sites/site-file-delete-mutation'
import { useSiteFileSaveMutation } from '@/data/sites/site-file-save-mutation'
import { useSiteFilesQuery } from '@/data/sites/site-files-query'
import { useSiteQuery } from '@/data/sites/site-query'
import {
  formatBytes,
  getFileExtension,
  getMonacoLanguage,
  getSiteFileUrl,
  isEditableFile,
} from './Sites.utils'

type MonacoLanguage = ComponentProps<typeof CodeEditor>['language']

const NEW_FILE_TEMPLATES: Record<string, string> = {
  html: '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n  </head>\n  <body>\n  </body>\n</html>\n',
  json: '{\n  \n}\n',
}

export const SiteFilesExplorer = () => {
  const { ref, slug } = useParams()

  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [editorValue, setEditorValue] = useState('')
  const [loadedContent, setLoadedContent] = useState<string | null>(null)
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [showNewFile, setShowNewFile] = useState(false)
  const [newFilePath, setNewFilePath] = useState('')

  const { data: site } = useSiteQuery({ projectRef: ref, slug })
  const {
    data: files,
    error,
    isPending,
    isError,
    isSuccess,
    refetch,
    isRefetching,
  } = useSiteFilesQuery({ projectRef: ref, slug })

  const isEditable = selectedPath ? isEditableFile(selectedPath) : false

  const {
    data: fileContent,
    isFetching: isLoadingContent,
    isError: isContentError,
    error: contentError,
  } = useSiteFileContentQuery(
    { projectRef: ref, slug, path: selectedPath ?? undefined },
    { enabled: !!selectedPath && isEditable }
  )

  const { mutate: saveFile, isPending: isSaving } = useSiteFileSaveMutation({
    onSuccess: (_data, variables) => {
      toast.success('File saved')
      setLoadedContent(variables.content)
    },
  })

  const { mutate: deleteFile, isPending: isDeleting } = useSiteFileDeleteMutation({
    onSuccess: (_data, variables) => {
      toast.success('File deleted')
      if (variables.path === selectedPath) clearSelection()
      setFileToDelete(null)
    },
  })

  const isDirty = !!selectedPath && isEditable && loadedContent !== null && editorValue !== loadedContent

  // Seed the editor only on the FIRST load of a file (loadedContent === null).
  // Guarding on null means a background/post-save refetch never clobbers edits
  // the user is actively typing.
  useEffect(() => {
    if (fileContent && fileContent.path === selectedPath && loadedContent === null) {
      setEditorValue(fileContent.content)
      setLoadedContent(fileContent.content)
    }
  }, [fileContent, selectedPath, loadedContent])

  const clearSelection = () => {
    setSelectedPath(null)
    setEditorValue('')
    setLoadedContent(null)
  }

  const doSelect = (path: string) => {
    setSelectedPath(path)
    setEditorValue('')
    setLoadedContent(null)
  }

  const selectFile = (path: string) => {
    if (path === selectedPath) return
    if (isDirty) setPendingPath(path)
    else doSelect(path)
  }

  const onSave = () => {
    if (!ref || !slug || !selectedPath) return
    saveFile({ projectRef: ref, slug, path: selectedPath, content: editorValue })
  }

  const onCreateFile = () => {
    if (!ref || !slug) return
    const path = newFilePath.trim().replace(/^\/+/, '')
    if (path.length === 0) return toast.error('Enter a file name')
    if (path.includes('..')) return toast.error('Path cannot contain “..”')
    if ((files ?? []).some((file) => file.relativePath === path)) {
      return toast.error('A file with that path already exists')
    }
    const template = NEW_FILE_TEMPLATES[getFileExtension(path)] ?? ''
    saveFile(
      { projectRef: ref, slug, path, content: template },
      {
        onSuccess: () => {
          toast.success(`Created ${path}`)
          setShowNewFile(false)
          setNewFilePath('')
          // Auto-open the new file in the editor, but never discard unsaved edits
          // in the file that's currently open — leave it be if the buffer is dirty.
          if (isEditableFile(path) && !isDirty) {
            setSelectedPath(path)
            setEditorValue(template)
            setLoadedContent(template)
          }
        },
      }
    )
  }

  const sortedFiles = [...(files ?? [])].sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath)
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,20rem)_1fr] gap-6 h-full">
      {/* File list */}
      <Card className="flex flex-col overflow-hidden h-fit lg:h-[calc(100vh-16rem)] lg:sticky lg:top-32">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-control">
          <span className="text-sm text-foreground">Files</span>
          <div className="flex items-center gap-1">
            <Button
              type="text"
              className="px-1.5"
              icon={<RefreshCw size={14} className={cn(isRefetching && 'animate-spin')} />}
              onClick={() => refetch()}
            />
            <Button
              type="default"
              icon={<FilePlus size={14} />}
              onClick={() => setShowNewFile(true)}
            >
              New
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isPending && (
            <div className="p-3">
              <GenericSkeletonLoader />
            </div>
          )}
          {isError && (
            <div className="p-3">
              <AlertError error={error} subject="Failed to list files" />
            </div>
          )}
          {isSuccess && sortedFiles.length === 0 && (
            <p className="p-4 text-sm text-foreground-light">
              No files yet. Create one or deploy a build from the Overview tab.
            </p>
          )}
          {isSuccess &&
            sortedFiles.map((file) => (
              <button
                key={file.relativePath}
                type="button"
                onClick={() => selectFile(file.relativePath)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs font-mono border-b border-control/50 hover:bg-surface-200 transition-colors',
                  selectedPath === file.relativePath && 'bg-surface-200 text-foreground'
                )}
              >
                <span className="truncate">{file.relativePath}</span>
                <span className="shrink-0 text-foreground-lighter">{formatBytes(file.size)}</span>
              </button>
            ))}
        </div>
      </Card>

      {/* Editor / preview pane */}
      <Card className="flex flex-col overflow-hidden lg:h-[calc(100vh-16rem)] min-h-[24rem]">
        {!selectedPath ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 p-8">
            <p className="text-sm text-foreground">Select a file to edit</p>
            <p className="text-xs text-foreground-lighter">
              Text files open in the editor. Other files can be opened in the browser or deleted.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-control">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-mono text-foreground truncate">{selectedPath}</span>
                {isDirty && (
                  <span className="text-xs text-warning shrink-0">• Unsaved</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {site && (
                  <Button
                    asChild
                    type="text"
                    className="px-1.5"
                    icon={<ExternalLink size={14} />}
                  >
                    <a
                      href={getSiteFileUrl(site, selectedPath)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in browser"
                    />
                  </Button>
                )}
                <Button
                  type="text"
                  className="px-1.5 text-destructive hover:text-destructive"
                  icon={<Trash2 size={14} />}
                  onClick={() => setFileToDelete(selectedPath)}
                />
                {isEditable && (
                  <Button
                    type="primary"
                    icon={<Save size={14} />}
                    loading={isSaving}
                    disabled={!isDirty}
                    onClick={onSave}
                  >
                    Save
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 relative min-h-[20rem]">
              {!isEditable ? (
                <div className="flex flex-col items-center justify-center text-center gap-2 h-full p-8">
                  <p className="text-sm text-foreground">This file can't be edited here</p>
                  <p className="text-xs text-foreground-lighter max-w-sm">
                    Binary and unsupported file types aren't editable in the browser. Open it in a
                    new tab, or re-deploy to replace it.
                  </p>
                  {site && (
                    <Button
                      asChild
                      type="default"
                      icon={<ExternalLink size={14} />}
                      className="mt-2"
                    >
                      <a href={getSiteFileUrl(site, selectedPath)} target="_blank" rel="noreferrer">
                        Open in browser
                      </a>
                    </Button>
                  )}
                </div>
              ) : isContentError ? (
                <div className="p-4">
                  <AlertError error={contentError} subject="Failed to load file" />
                </div>
              ) : (
                <>
                  <CodeEditor
                    id={selectedPath}
                    language={getMonacoLanguage(selectedPath) as MonacoLanguage}
                    value={editorValue}
                    loading={isLoadingContent}
                    className="h-full"
                    onInputChange={(value) => setEditorValue(value ?? '')}
                  />
                  {isLoadingContent && loadedContent === null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-100">
                      <Loader2 size={20} className="animate-spin text-foreground-light" />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </Card>

      {/* New file dialog */}
      <Dialog open={showNewFile} onOpenChange={(open) => !open && setShowNewFile(false)}>
        <DialogContent size="small">
          <DialogHeader>
            <DialogTitle>Create a new file</DialogTitle>
          </DialogHeader>
          <DialogSection className="space-y-2">
            <label className="text-sm text-foreground-light" htmlFor="new-file-path">
              File path
            </label>
            <Input
              id="new-file-path"
              autoFocus
              placeholder="e.g. index.html or assets/app.js"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreateFile()
              }}
            />
            <p className="text-xs text-foreground-lighter">
              Relative to the document root. Sub-folders are created automatically.
            </p>
          </DialogSection>
          <DialogFooter>
            <Button type="default" onClick={() => setShowNewFile(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} disabled={newFilePath.trim().length === 0} onClick={onCreateFile}>
              Create file
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard unsaved changes when switching files */}
      <ConfirmationModal
        variant="warning"
        visible={!!pendingPath}
        title="Discard unsaved changes?"
        confirmLabel="Discard changes"
        onCancel={() => setPendingPath(null)}
        onConfirm={() => {
          if (pendingPath) doSelect(pendingPath)
          setPendingPath(null)
        }}
      >
        <p className="text-sm text-foreground-light">
          You have unsaved edits in {selectedPath}. Switching files will discard them.
        </p>
      </ConfirmationModal>

      {/* Delete file */}
      <ConfirmationModal
        variant="destructive"
        visible={!!fileToDelete}
        loading={isDeleting}
        title={`Delete ${fileToDelete}`}
        confirmLabel="Delete file"
        confirmLabelLoading="Deleting"
        onCancel={() => setFileToDelete(null)}
        onConfirm={() => {
          if (ref && slug && fileToDelete) {
            deleteFile({ projectRef: ref, slug, path: fileToDelete })
          }
        }}
      >
        <p className="text-sm text-foreground-light">
          This permanently removes the file from the site. This action cannot be undone.
        </p>
      </ConfirmationModal>
    </div>
  )
}
