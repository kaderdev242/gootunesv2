import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import type { BlogPost } from "@/lib/supabase/database.types";
import { sanitizeDoc, type BlogDoc } from "./content";

export type BlogListItem = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "cover_url" | "reading_minutes" | "published_at"
>;

export type BlogArticle = BlogListItem & { content: BlogDoc; updated_at: string };

const LIST_COLUMNS = "id, slug, title, excerpt, cover_url, reading_minutes, published_at";

/** Articles publiés, du plus récent au plus ancien (RLS : publiés uniquement). */
export async function listPublishedPosts(limit = 60): Promise<BlogListItem[]> {
  try {
    const { data } = await createPublicClient()
      .from("blog_posts")
      .select(LIST_COLUMNS)
      .order("published_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getPublishedPost(slug: string): Promise<BlogArticle | null> {
  try {
    const { data } = await createPublicClient()
      .from("blog_posts")
      .select(`${LIST_COLUMNS}, content, updated_at`)
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;
    return { ...data, content: sanitizeDoc(data.content) };
  } catch {
    return null;
  }
}

/* ─────────── Admin (service role, appelé derrière requireAdmin) ─────────── */

export type AdminBlogRow = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "cover_url" | "status" | "published_at" | "updated_at" | "reading_minutes"
>;

export async function listPostsAdmin(): Promise<AdminBlogRow[]> {
  const { data } = await createAdminClient()
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_url, status, published_at, updated_at, reading_minutes")
    .order("updated_at", { ascending: false })
    .limit(500);
  return data ?? [];
}

export async function getPostAdmin(id: string): Promise<BlogPost | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createAdminClient().from("blog_posts").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
