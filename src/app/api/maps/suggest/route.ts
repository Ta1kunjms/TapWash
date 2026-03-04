import { suggestAddresses } from "@/lib/delivery-quote";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();

  if (query.length < 3) {
    return Response.json({ suggestions: [] });
  }

  const suggestions = await suggestAddresses(query);
  return Response.json({ suggestions });
}
