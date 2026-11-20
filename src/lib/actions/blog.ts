"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerError, mapDbError } from "@/lib/errors";
import {
  autoExcerpt,
  docPlainText,
  isValidSlug,
  readingMinutes,
  safeImageSrc,
  sanitizeDoc,
  slugify,
} from "@/lib/blog/content";
import type { BlogPostStatus } from "@/lib/supabase/database.types";

export type BlogSaveInput = {
  id?: string | null;
  title: string;
  slug?: string;
  excerpt?: string;
  coverUrl?: string | null;
  /** Document Tiptap sérialisé en JSON (texte). */
  content: string;
  status: BlogPostStatus;
};

export type BlogSaveResult = {
  error?: string;
  success?: string;
  id?: string;
  slug?: string;
  status?: BlogPostStatus;
};

function touchBlog(slug?: string, previousSlug?: string) {
  revalidatePath("/blog");
  revalidatePath("/goo-admin/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/blog/${previousSlug}`);
  revalidatePath("/sitemap.xml");
}

/** Premier slug libre : « mon-article », puis « mon-article-2 »… */
async function freeSlug(base: string, excludeId: string | null): Promise<string> {
  const db = createAdminClient();
  const { data } = await db.from("blog_posts").select("id, slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).filter((r) => r.id !== excludeId).map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 500; i += 1) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function saveBlogPost(input: BlogSaveInput): Promise<BlogSaveResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const title = String(input.title ?? "").trim().slice(0, 160);
  if (!title) return { error: "Donne un titre à l'article." };

  const status: BlogPostStatus = input.status === "published" ? "published" : "draft";
  const content = sanitizeDoc(input.content);
  const text = docPlainText(content);
  if (status === "published" && text.length < 20) {
    return { error: "L'article est trop court pour être publié." };
  }

  const id = input.id && /^[0-9a-f-]{36}$/i.test(input.id) ? input.id : null;
  const db = createAdminClient();

  const existing = id
    ? (await db.from("blog_posts").select("slug, published_at").eq("id", id).maybeSingle()).data
    : null;
  if (id && !existing) return { error: "Article introuvable." };

  // Slug : saisi par l'admin (vérifié) ou dérivé du titre (rendu unique).
  const wanted = slugify(String(input.slug ?? ""));
  let slug: string;
  if (wanted) {
    if (!isValidSlug(wanted)) return { error: "Adresse de l'article invalide." };
    slug = wanted;
  } else {
    slug = await freeSlug(slugify(title) || "article", id);
  }

  const excerptInput = String(input.excerpt ?? "").trim().slice(0, 320);
  const coverUrl = input.coverUrl ? safeImageSrc(input.coverUrl) : null;

  const row = {
    title,
    slug,
    excerpt: excerptInput || autoExcerpt(text),
    cover_url: coverUrl,
    content,
    reading_minutes: readingMinutes(text),
    status,
    published_at:
      status === "published" ? existing?.published_at ?? new Date().toISOString() : existing?.published_at ?? null,
  };

  const query = id
    ? db.from("blog_posts").update(row).eq("id", id).select("id, slug").single()
    : db.from("blog_posts").insert({ ...row, author_id: admin.userId }).select("id, slug").single();

  const { data, error } = await query;
  if (error || !data) {
    if (error?.code === "23505") {
      return { error: "Cette adresse est déjà utilisée par un autre article." };
    }
    logServerError("admin.blog.save", error);
    return { error: mapDbError(error, "Enregistrement impossible.") };
  }

  touchBlog(data.slug, existing?.slug);
  return {
    id: data.id,
    slug: data.slug,
    status,
    success: status === "published" ? "Article publié." : "Brouillon enregistré.",
  };
}

export async function deleteBlogPost(id: string): Promise<BlogSaveResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Article invalide." };

  const db = createAdminClient();
  const { data: post } = await db.from("blog_posts").select("title, slug").eq("id", id).maybeSingle();
  if (!post) return { error: "Article introuvable." };

  const { error } = await db.from("blog_posts").delete().eq("id", id);
  if (error) {
    logServerError("admin.blog.delete", error);
    return { error: mapDbError(error, "Suppression impossible.") };
  }
  touchBlog(post.slug);
  return { success: `« ${post.title} » a été supprimé.` };
}
