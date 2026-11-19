import Link from "next/link";
import type { BlogListItem } from "@/lib/blog/queries";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function formatBlogDate(iso: string | null) {
  return iso ? dateFmt.format(new Date(iso)) : "";
}

function Cover({ src, className }: { src: string | null; className: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" decoding="async" className={`${className} object-cover`} />
  ) : (
    <div className={`${className} bg-gradient-to-br from-white/[0.08] to-white/[0.02]`} />
  );
}

function Meta({ post }: { post: BlogListItem }) {
  return (
    <p className="text-[13px] text-white/45">
      {formatBlogDate(post.published_at)} · {post.reading_minutes} min de lecture
    </p>
  );
}

/** Article mis en avant (le plus récent). */
export function BlogFeatured({ post }: { post: BlogListItem }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group grid gap-5 md:grid-cols-[1.35fr_1fr] md:items-center md:gap-8">
      <div className="overflow-hidden rounded-[22px]">
        <Cover src={post.cover_url} className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-[1.02]" />
      </div>
      <div className="min-w-0">
        <Meta post={post} />
        <h2 className="font-display mt-2 text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-white/60">{post.excerpt}</p>
        ) : null}
        <span className="mt-4 inline-block text-[14px] font-medium text-white underline decoration-white/25 underline-offset-4 transition group-hover:decoration-white">
          Lire l&apos;article
        </span>
      </div>
    </Link>
  );
}

export function BlogCard({ post }: { post: BlogListItem }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex min-w-0 flex-col">
      <div className="overflow-hidden rounded-2xl">
        <Cover src={post.cover_url} className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="mt-3">
        <Meta post={post} />
        <h3 className="mt-1.5 line-clamp-2 text-[17px] font-semibold leading-snug text-white">{post.title}</h3>
        {post.excerpt ? <p className="mt-1.5 line-clamp-2 text-[14px] text-white/50">{post.excerpt}</p> : null}
      </div>
    </Link>
  );
}
