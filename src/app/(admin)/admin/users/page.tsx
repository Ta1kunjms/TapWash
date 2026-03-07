import { suspendUserAction, updateUserProfileAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listUsers } from "@/services/admin";

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <p className="text-sm text-text-secondary">Update names, roles, and account status.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Name
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <Input form={`update-user-${user.id}`} name="firstName" defaultValue={user.first_name ?? ""} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Input form={`update-user-${user.id}`} name="surname" defaultValue={user.surname ?? ""} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    form={`update-user-${user.id}`}
                    name="role"
                    defaultValue={user.role}
                    className="h-11 rounded-2xl border border-border-muted bg-white px-3 text-sm"
                  >
                    <option value="customer">customer</option>
                    <option value="shop_owner">shop_owner</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_suspended
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.is_suspended ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <form id={`update-user-${user.id}`} action={updateUserProfileAction} className="inline">
                    <input type="hidden" name="userId" value={user.id} />
                    <Button type="submit" variant="secondary" size="sm">
                      Save
                    </Button>
                  </form>

                  <form action={suspendUserAction} className="inline">
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="isSuspended"
                      value={user.is_suspended ? "false" : "true"}
                    />
                    <Button
                      type="submit"
                      variant={user.is_suspended ? "secondary" : "primary"}
                      size="sm"
                    >
                      {user.is_suspended ? "Activate" : "Suspend"}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
