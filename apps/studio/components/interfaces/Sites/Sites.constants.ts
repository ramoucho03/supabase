import type { SiteTlsMode } from '@/lib/api/self-hosted/hosting/types'

export type TlsOption = {
  value: SiteTlsMode
  label: string
  description: string
}

export const TLS_OPTIONS: TlsOption[] = [
  {
    value: 'off',
    label: 'HTTP only',
    description: 'No certificate. Best for local development or behind another proxy.',
  },
  {
    value: 'acme',
    label: "Automatic TLS (Let's Encrypt)",
    description: 'Issue and renew a certificate automatically. The domain must resolve to this server.',
  },
  {
    value: 'byo',
    label: 'Bring your own certificate',
    description: 'Use a certificate you provide on disk for this domain.',
  },
]

/** Default SFTP port from docker-compose (SFTP_PORT). */
export const DEFAULT_SFTP_PORT = 2222
