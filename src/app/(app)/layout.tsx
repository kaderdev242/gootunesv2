import { DiscoverAppFrame } from "@/components/feed/DiscoverAppFrame";

export const dynamic = "force-dynamic";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DiscoverAppFrame>{children}</DiscoverAppFrame>;
}
