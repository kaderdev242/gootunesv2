import { getAudienceCounts, listBroadcasts } from "@/lib/actions/admin-broadcast";
import { BroadcastView } from "@/components/admin/BroadcastView";

export const dynamic = "force-dynamic";

export default async function AdminMailsPage() {
  const [counts, history] = await Promise.all([getAudienceCounts(), listBroadcasts("email")]);
  return <BroadcastView channel="email" counts={counts} history={history} />;
}
