import { type NextApiRequest, type NextApiResponse } from 'next'

import apiWrapper from '@/lib/api/apiWrapper'
import { getHostingAgentClient, getSitesStore } from '@/lib/api/self-hosted/hosting'

export default function handlerWithErrorCatching(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  const store = getSitesStore()
  const sites = await store.listSites()
  return res.status(200).json(sites)
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, domain, docroot, spaFallback, tls, apiProxy } = req.body ?? {}
  if (typeof slug !== 'string' || typeof domain !== 'string') {
    return res.status(400).json({ error: { message: 'slug and domain are required' } })
  }

  const store = getSitesStore()
  let site
  try {
    site = await store.createSite({ slug, domain, docroot, spaFallback, tls, apiProxy })
  } catch (error) {
    // Validation failures (duplicate slug, invalid domain…) carry a useful
    // message; surface it as a 400 instead of apiWrapper's opaque 500.
    return res
      .status(400)
      .json({ error: { message: error instanceof Error ? error.message : 'Failed to create site' } })
  }

  // Best-effort apply to nginx — the site is registered regardless, so the UI can
  // surface a warning (e.g. when the nginx profile isn't running) without failing.
  let agentApplied = true
  let agentError: string | undefined
  try {
    await getHostingAgentClient().applySite(site)
  } catch (error) {
    agentApplied = false
    agentError = error instanceof Error ? error.message : 'Failed to apply nginx configuration'
  }

  return res.status(201).json({ ...site, agentApplied, agentError })
}
