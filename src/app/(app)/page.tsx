import type { Metadata } from "next";
import { HomeFeed } from "@/components/feed/HomeFeed";
import { listPageMetadata } from "@/lib/seo";

export const metadata: Metadata = listPageMetadata({
  title: "Discover",
  description:
    "Écoute et achète la musique africaine directement auprès des artistes. Hits, nouveautés et catalogue Mobile Money sur Gootunes.",
  path: "/",
});

export default function HomePage() {
  return <HomeFeed />;
}
