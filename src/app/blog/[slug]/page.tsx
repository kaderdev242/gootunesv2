import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogContent } from "@/components/blog/BlogContent";
import { BlogCard, formatBlogDate } from "@/components/blog/BlogCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublishedPost, listPublishedPosts } from "@/lib/blog/queries";
import { absoluteMediaUrl, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Article introuvable" };

  const url = siteUrl(`/blog/${post.slug}`);
  const image = absoluteMediaUrl(post.cover_url);
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      siteName: "Gootunes",
      locale: "fr_FR",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      images: [{ url: image, alt: post.title }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [image] },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const [post, recent] = await Promise.all([getPublishedPost(slug), listPublishedPosts(4)]);
  if (!post) notFound();

  const others = recent.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <div className="flex flex-col gap-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: absoluteMediaUrl(post.cover_url),
          datePublished: post.published_at,
          dateModified: post.updated_at,
          mainEntityOfPage: siteUrl(`/blog/${post.slug}`),
          publisher: { "@type": "Organization", name: "Gootunes", logo: absoluteMediaUrl("/logo-gootunes.png") },
        }}
      />

      <article className="mx-auto w-full max-w-2xl">
        <Link href="/blog" className="text-sm text-white/45 transition hover:text-white">
          ← Blog
        </Link>
        <p className="mt-6 text-[13px] text-white/45">
          {formatBlogDate(post.published_at)} · {post.reading_minutes} min de lecture
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-[42px]">
          {post.title}
        </h1>
        {post.excerpt ? <p className="mt-4 text-lg leading-relaxed text-white/60">{post.excerpt}</p> : null}

        {post.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_url}
            alt=""
            fetchPriority="high"
            className="mt-8 aspect-[16/9] w-full rounded-[22px] object-cover"
          />
        ) : null}

        <div className="mt-10">
          <BlogContent doc={post.content} />
        </div>
      </article>

      {others.length > 0 ? (
        <section className="border-t border-white/[0.08] pt-8">
          <h2 className="text-[15px] font-semibold text-white">À lire aussi</h2>
          <div className="mt-5 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}

    </div>
  );
}
