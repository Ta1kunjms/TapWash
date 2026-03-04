import { suspendUserAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listUsers } from "@/services/admin";

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      {users.map((user) => (
        <Card key={user.id}>
          <p className="font-semibold">{user.full_name}</p>
          <p className="text-sm text-text-secondary">{user.role}</p>
          <p className="text-xs text-text-muted">Status: {user.is_suspended ? "Suspended" : "Active"}</p>
          <form action={suspendUserAction} className="mt-3">
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="isSuspended" value={user.is_suspended ? "false" : "true"} />
            <Button type="submit" variant={user.is_suspended ? "secondary" : "primary"}>
              {user.is_suspended ? "Activate" : "Suspend"}
            </Button>
          </form>
        </Card>
      ))}
    </main>
  );
}
