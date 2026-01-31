import { object, string, optional, array, boolean, pipe, isoDate } from 'valibot'
import type { InferOutput } from 'valibot'

export const BlogPostSchema = object({
  author: string(),
  title: string(),
  date: pipe(string(), isoDate()),
  description: string(),
  path: string(),
  slug: string(),
  excerpt: optional(string()),
  tags: optional(array(string())),
  draft: optional(boolean()),
})

/**
 * Inferred type for blog post frontmatter
 */
/** @public */
export type BlogPostFrontmatter = InferOutput<typeof BlogPostSchema>
