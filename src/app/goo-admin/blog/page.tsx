import { listPostsAdmin } from "@/lib/blog/queries";
import { AdminBlogView } from "@/components/admin/blog/AdminBlogView";

export default async function AdminBlogPage() {
  const posts = await listPostsAdmin();
  return <AdminBlogView posts={posts} />;
}
