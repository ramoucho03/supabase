import type { Site, SiteTlsMode } from '@/lib/api/self-hosted/hosting/types'

/** Public origin nginx serves the site on (https unless TLS is disabled). */
export function getSiteUrl(site: Pick<Site, 'domain' | 'tls'>): string {
  const scheme = site.tls === 'off' ? 'http' : 'https'
  return `${scheme}://${site.domain}`
}

/** Public URL of a single deployed file, served directly by nginx. */
export function getSiteFileUrl(site: Pick<Site, 'domain' | 'tls'>, relativePath: string): string {
  const normalized = relativePath.split('/').map(encodeURIComponent).join('/')
  return `${getSiteUrl(site)}/${normalized}`
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export const TLS_LABELS: Record<SiteTlsMode, string> = {
  off: 'HTTP only',
  acme: 'Auto TLS',
  byo: 'Custom certificate',
}

/** File extensions the in-browser editor can safely open as text. */
const EDITABLE_EXTENSIONS = new Set([
  'html',
  'htm',
  'css',
  'scss',
  'sass',
  'less',
  'js',
  'mjs',
  'cjs',
  'jsx',
  'ts',
  'tsx',
  'json',
  'map',
  'txt',
  'md',
  'markdown',
  'xml',
  'svg',
  'yml',
  'yaml',
  'toml',
  'csv',
  'webmanifest',
  'env',
  'conf',
  'ini',
])

export function getFileExtension(path: string): string {
  const base = path.split('/').pop() ?? path
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot + 1).toLowerCase()
}

export function isEditableFile(path: string): boolean {
  return EDITABLE_EXTENSIONS.has(getFileExtension(path))
}

/** Maps a file path to a Monaco language id (falls back to plaintext). */
export function getMonacoLanguage(path: string): string {
  switch (getFileExtension(path)) {
    case 'html':
    case 'htm':
      return 'html'
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css'
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'jsx':
      return 'javascript'
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'json':
    case 'map':
    case 'webmanifest':
      return 'json'
    case 'xml':
    case 'svg':
      return 'xml'
    case 'yml':
    case 'yaml':
      return 'yaml'
    case 'md':
    case 'markdown':
      return 'markdown'
    default:
      return 'plaintext'
  }
}
