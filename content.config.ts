import { defineCollection, z } from '@nuxt/content'

const variantEnum = z.enum(['solid', 'outline', 'subtle', 'soft', 'ghost', 'link'])
const colorEnum = z.enum(['primary', 'secondary', 'neutral', 'error', 'warning', 'success', 'info'])
const sizeEnum = z.enum(['xs', 'sm', 'md', 'lg', 'xl'])
const orientationEnum = z.enum(['vertical', 'horizontal'])

const createBaseSchema = () => z.object({
  title: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional()
})

const createFeatureItemSchema = () => createBaseSchema().extend({
  icon: z.string().optional().editor({ input: 'icon' })
})

const createLinkSchema = () => z.object({
  label: z.string().optional(),
  to: z.string().optional(),
  icon: z.string().optional().editor({ input: 'icon' }),
  trailingIcon: z.string().optional(),
  size: sizeEnum.optional(),
  trailing: z.boolean().optional(),
  target: z.string().optional(),
  color: colorEnum.optional(),
  variant: variantEnum.optional()
})

const createImageSchema = () => z.object({
  src: z.string().optional().editor({ input: 'media' }),
  alt: z.string().optional(),
  loading: z.enum(['lazy', 'eager']).optional(),
  srcset: z.string().optional()
})

export const collections = {
  index: defineCollection({
    source: '0.index.yml',
    type: 'page',
    schema: z.object({
      hero: createBaseSchema().extend({
        links: z.array(createLinkSchema()).optional()
      }).optional(),
      sections: z.array(
        createBaseSchema().extend({
          id: z.string().optional(),
          orientation: orientationEnum.optional(),
          reverse: z.boolean().optional(),
          image: z.string().optional(),
          features: z.array(createFeatureItemSchema()).optional()
        })
      ).optional(),
      features: createBaseSchema().extend({
        items: z.array(createFeatureItemSchema()).optional()
      }).optional(),
      testimonials: createBaseSchema().extend({
        headline: z.string().optional(),
        items: z.array(
          z.object({
            quote: z.string().optional(),
            user: z.object({
              name: z.string().optional(),
              description: z.string().optional(),
              to: z.string().optional(),
              target: z.string().optional(),
              avatar: createImageSchema().optional()
            })
          })
        ).optional()
      }).optional(),
      cta: createBaseSchema().extend({
        links: z.array(createLinkSchema()).optional()
      }).optional()
    })
  }),
  docs: defineCollection({
    source: '1.docs/**/*',
    type: 'page'
  }),
  pricing: defineCollection({
    source: '2.pricing.yml',
    type: 'page'
  }),
  changelog: defineCollection({
    source: '4.changelog.yml',
    type: 'page'
  }),
  versions: defineCollection({
    source: '4.changelog/**/*',
    type: 'page'
  })
}
