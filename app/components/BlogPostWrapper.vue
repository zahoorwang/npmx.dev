<script setup lang="ts">
import type { BlogPostFrontmatter } from '#shared/schemas/blog'

const props = defineProps<{
  frontmatter?: BlogPostFrontmatter
}>()

useSeoMeta({
  title: props.frontmatter?.title,
  description: props.frontmatter?.description || props.frontmatter?.excerpt,
  ogTitle: props.frontmatter?.title,
  ogDescription: props.frontmatter?.description || props.frontmatter?.excerpt,
  ogType: 'article',
})

// Hardcoded values for reference/testing
// const BSKY_DID = 'did:plc:jbeaa5kdaladzwq3r7f5xgwe'
// const BSKY_DID = 'did:plc:5ixnpdbogli5f7fbbee5fmuq' // Albie
// const BSKY_POST_ID = '3mcg6svsgsm2k'
// const BSKY_POST_ID = '3mdoijswyz22u'

const slug = computed(() => props.frontmatter?.slug)

// Use Constellation to find the Bluesky post linking to this blog post
const { data: blueskyLink } = useBlogPostBlueskyLink(slug)
const blueskyPostUri = computed(() => blueskyLink.value?.postUri ?? null)
</script>

<template>
  <main class="container w-full py-8">
    <article class="prose dark:prose-invert mx-auto">
      <slot />
    </article>

    <LazyBlueskyComments v-if="blueskyPostUri" :post-uri="blueskyPostUri" />
  </main>
</template>
