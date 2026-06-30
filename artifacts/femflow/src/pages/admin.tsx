import { useAuth } from "@/hooks/use-auth";
import { useAdminGetAnalytics } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";

export default function Admin() {
  const { user } = useAuth();
  const { data: analytics } = useAdminGetAnalytics({ query: { enabled: !!user?.isAdmin } });

  if (!user?.isAdmin) {
    return <div className="p-6">Unauthorized</div>;
  }

  return (
    <div className="p-6 space-y-6 pb-24">
      <h1 className="text-2xl font-serif font-bold text-foreground">Admin Dashboard</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{analytics?.totalUsers || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active Subs</p>
          <p className="text-2xl font-bold">{analytics?.activeSubscriptions || 0}</p>
        </Card>
      </div>
    </div>
  );
}