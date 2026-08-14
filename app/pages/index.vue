<script setup lang="ts">
type ButtonColor = 'info' | 'error' | 'success' | 'primary' | 'secondary' | 'warning' | 'neutral'
type ButtonVariant = 'solid' | 'outline' | 'soft' | 'ghost' | 'link' | 'subtle'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface PageLink {
  label: string
  to: string
  icon?: string
  size?: ButtonSize
  trailing?: boolean
  color?: ButtonColor
  variant?: ButtonVariant
}

interface PageSectionFeature {
  name?: string
  description?: string
  icon?: string
}

interface PageSection {
  title?: string
  description?: string
  orientation?: 'vertical' | 'horizontal'
  reverse?: boolean
  image?: string
  features?: PageSectionFeature[]
}

interface PageFeatureItem {
  title?: string
  description?: string
  icon?: string
  to?: string
}

interface TestimonialUser {
  name: string
  description?: string
  avatar?: { src: string }
}

interface TestimonialItem {
  quote: string
  user: TestimonialUser
}

interface PageCTA {
  title?: string
  description?: string
  links?: PageLink[]
}

interface PageData {
  title: string
  description: string
  seo?: {
    title?: string
    description?: string
  }
  hero?: {
    title?: string
    description?: string
    links?: PageLink[]
  }
  sections?: PageSection[]
  features?: {
    title?: string
    description?: string
    items?: PageFeatureItem[]
  }
  testimonials?: {
    headline?: string
    title?: string
    description?: string
    items?: TestimonialItem[]
  }
  cta?: PageCTA
}

type QueryCollection = (key: string) => { first: () => Promise<PageData> }

const { data: page } = await useAsyncData<PageData>('index', () => (queryCollection as QueryCollection)('index').first())

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  titleTemplate: '',
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  ogImage: 'https://images.bilter.my.id/kelasbilie.png'
})
</script>

<template>
  <div v-if="page">
    <UPageHero
      :title="page.title"
      :description="page.description"
      :links="page.hero?.links"
    >
      <template #top>
        <HeroBackground />
      </template>

      <template #title>
        <MDC
          :value="page.title"
          unwrap="p"
        />
      </template>

      <PromotionalVideo />
    </UPageHero>

    <UPageSection
      v-for="(section, index) in page.sections"
      :key="index"
      :title="section.title"
      :description="section.description"
      :orientation="section.orientation"
      :reverse="section.reverse"
      :features="section.features"
    >
      <ImagePlaceholder>
        <img
          :src="section.image"
          :alt="section.title"
          loading="lazy"
          class="w-full h-full object-cover"
        >
      </ImagePlaceholder>
    </UPageSection>

    <UPageSection
      v-if="page.features"
      :title="page.features.title"
      :description="page.features.description"
    >
      <UPageGrid>
        <UPageCard
          v-for="(item, index) in page.features.items"
          :key="index"
          v-bind="item"
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      v-if="page.testimonials"
      id="testimonials"
      :headline="page.testimonials.headline"
      :title="page.testimonials.title"
      :description="page.testimonials.description"
    >
      <UPageColumns class="xl:columns-4">
        <UPageCard
          v-for="(testimonial, index) in page.testimonials.items"
          :key="index"
          variant="subtle"
          :description="testimonial.quote"
          :ui="{ description: 'before:content-[open-quote] after:content-[close-quote]' }"
        >
          <template #footer>
            <UUser
              v-bind="testimonial.user"
              size="lg"
            />
          </template>
        </UPageCard>
      </UPageColumns>
    </UPageSection>

    <USeparator />

    <UPageCTA
      v-if="page.cta"
      v-bind="page.cta"
      variant="naked"
      class="overflow-hidden"
    >
      <LazyStarsBg />
    </UPageCTA>
  </div>
</template>
