import { notFound } from "next/navigation";
import { getPostAdmin } from "@/lib/blog/queries";
import { BlogEditor } from "@/components/admin/blog/BlogEditor";

type Props = { params: Promise<{ id: string }> };

export default async function AdminBlogEditPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostAdmin(id);
  if (!post) notFound();

  return (
    <BlogEditor
      key={post.id}
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverUrl: post.cover_url,
        content: post.content,
        status: post.status,
      }}
    />
  );
}
