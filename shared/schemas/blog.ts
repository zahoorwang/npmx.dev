import { object, string, boolean, array, optional } from 'valibot'
import type { InferOutput } from 'valibot'

export const BlogPostSchema = object({
  author: string(),
  title: string(),
  date: string(),
  description: string(),
  slug: string(),
  excerpt: optional(string()),
  tags: optional(array(string())),
  draft: optional(boolean()),
})

/**
 * Inferred type for blog post frontmatter
 */
export type BlogPostFrontmatter = InferOutput<typeof BlogPostSchema>
