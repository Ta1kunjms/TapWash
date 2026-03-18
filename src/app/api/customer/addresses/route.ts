import {
  createCustomerAddress,
  listCustomerAddresses,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from "@/services/addresses";
import { z } from "zod";

const labelSchema = z.enum(["home", "work", "partner", "other"]);

const createSchema = z.object({
  label: labelSchema,
  address_line: z.string().trim().min(3),
  unit_details: z.string().trim().max(120).optional().nullable(),
  delivery_instructions: z.string().trim().max(300).optional().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  is_default: z.boolean().optional(),
});

const updateSchema = createSchema.extend({
  id: z.string().uuid(),
});

const setDefaultSchema = z.object({
  id: z.string().uuid(),
  action: z.literal("set_default"),
});

export async function GET() {
  try {
    const addresses = await listCustomerAddresses();
    return Response.json({ addresses });
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid address payload" }, { status: 400 });
  }

  try {
    const address = await createCustomerAddress(parsed.data);
    return Response.json({ address });
  } catch (error) {
    const message = getErrorMessage(error);
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);

  const asSetDefault = setDefaultSchema.safeParse(body);
  if (asSetDefault.success) {
    try {
      const address = await setDefaultCustomerAddress(asSetDefault.data.id);
      return Response.json({ address });
    } catch (error) {
      const message = getErrorMessage(error);
      return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
    }
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid address update payload" }, { status: 400 });
  }

  try {
    const address = await updateCustomerAddress(parsed.data.id, parsed.data);
    return Response.json({ address });
  } catch (error) {
    const message = getErrorMessage(error);
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}
