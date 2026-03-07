import { getUnreadNotificationCount } from "@/services/notifications";

export async function GET() {
  const count = await getUnreadNotificationCount();
  return Response.json({ count });
}
