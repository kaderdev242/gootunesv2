import { getAudienceCounts, listBroadcasts } from "@/lib/actions/admin-broadcast";
import { BroadcastView } from "@/components/admin/BroadcastView";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const [counts, history] = await Promise.all([getAudienceCounts(), listBroadcasts("push")]);
  return <BroadcastView channel="push" counts={counts} history={history} />;
}
