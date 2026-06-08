import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form,
  FormControl,
  FormField,
  Input,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useSiteCreateMutation } from '@/data/sites/site-create-mutation'
import type { SiteTlsMode } from '@/lib/api/self-hosted/hosting/types'
import { TLS_OPTIONS } from './Sites.constants'

const FormSchema = z.object({
  slug: z
    .string()
    .min(1, 'A slug is required')
    .max(63, 'Keep the slug under 64 characters')
    .regex(
      /^[a-z0-9][a-z0-9-]*$/,
      'Use lowercase letters, numbers and hyphens, starting with a letter or number'
    ),
  domain: z
    .string()
    .min(1, 'A domain is required')
    .regex(/^[a-zA-Z0-9.-]+$/, 'Enter a valid host name, e.g. app.example.com'),
  tls: z.enum(['off', 'acme', 'byo']),
  spaFallback: z.boolean(),
  apiProxy: z.boolean(),
})

type FormValues = z.infer<typeof FormSchema>

const DEFAULT_VALUES: FormValues = {
  slug: '',
  domain: '',
  tls: 'off',
  spaFallback: true,
  apiProxy: false,
}

interface CreateSiteSheetProps {
  projectRef?: string
  visible: boolean
  onClose: () => void
}

export const CreateSiteSheet = ({ projectRef, visible, onClose }: CreateSiteSheetProps) => {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { mutate: createSite, isPending: isCreating } = useSiteCreateMutation({
    onSuccess: (site) => {
      toast.success(`Created site “${site.slug}”`)
      onClose()
      if (projectRef) router.push(`/project/${projectRef}/sites/${site.slug}`)
    },
  })

  // Reset the form each time the sheet is opened.
  useEffect(() => {
    if (visible) form.reset(DEFAULT_VALUES)
  }, [visible])

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!projectRef) return
    createSite({ projectRef, ...values })
  }

  return (
    <Sheet open={visible} onOpenChange={(open) => !open && onClose()}>
      <SheetContent showClose={!isCreating} size="lg" className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Create a new site</SheetTitle>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto">
          <Form {...form}>
            <form id="create-site-form" onSubmit={form.handleSubmit(onSubmit)}>
              <SheetSection className="space-y-6">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="vertical"
                      label="Slug"
                      description="Internal identifier and the default folder served on disk. Cannot be changed later."
                    >
                      <FormControl>
                        <Input {...field} placeholder="my-app" autoComplete="off" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="vertical"
                      label="Domain"
                      description="The host name visitors use. Point its DNS to this server."
                    >
                      <FormControl>
                        <Input {...field} placeholder="app.example.com" autoComplete="off" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tls"
                  render={({ field }) => (
                    <FormItemLayout layout="vertical" label="TLS">
                      <FormControl>
                        <RadioGroupStacked
                          value={field.value}
                          onValueChange={(value: SiteTlsMode) => field.onChange(value)}
                        >
                          {TLS_OPTIONS.map((option) => (
                            <RadioGroupStackedItem
                              key={option.value}
                              value={option.value}
                              id={`tls-${option.value}`}
                              label={option.label}
                              description={option.description}
                            />
                          ))}
                        </RadioGroupStacked>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spaFallback"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Single-page app routing"
                      description="Serve index.html for unknown routes so client-side routers (React Router, Vue Router…) work on refresh."
                    >
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apiProxy"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Proxy API to the backend"
                      description="Expose /rest, /auth, /storage and /functions on the same origin so your front-end can call Supabase without CORS."
                    >
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>
            </form>
          </Form>
        </div>

        <SheetFooter>
          <Button type="default" disabled={isCreating} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form="create-site-form"
            loading={isCreating}
            disabled={!projectRef}
          >
            Create site
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
