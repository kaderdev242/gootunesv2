import type { Metadata } from "next";
import { BlogCard, BlogFeatured } from "@/components/blog/BlogCard";
import { listPublishedPosts } from "@/lib/blog/queries";
import { listPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = listPageMetadata({
  title: "Blog",
  description:
    "Actualités, annonces et coulisses de Gootunes : la musique africaine, les artistes et l'écosystème Direct-to-Fan.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await listPublishedPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">Blog</h1>
        <p className="mt-2 max-w-xl text-sm text-white/45">
          Actualités, annonces et histoires autour de la musique et de l&apos;écosystème Gootunes.
        </p>
      </header>

      {featured ? (
        <>
          <BlogFeatured post={featured} />
          {rest.length > 0 ? (
            <section className="border-t border-white/[0.08] pt-8">
              <h2 className="text-[15px] font-semibold text-white">Tous les articles</h2>
              <div className="mt-5 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <BlogCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-14 text-center text-sm text-white/45">
          Aucun article publié pour le moment. Reviens bientôt.
        </p>
      )}

    </div>
  );
}
