import { deleteCustomerAddress } from "@/services/addresses";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ addressId: string }> },
) {
  const { addressId } = await params;

  if (!addressId) {
    return Response.json({ error: "Missing addressId" }, { status: 400 });
  }

  try {
    await deleteCustomerAddress(addressId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
