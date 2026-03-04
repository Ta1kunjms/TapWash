import { PROTECTED_PREFIXES } from "@/lib/constants";
import { updateSession } from "@/lib/supabase/middleware";
import type { UserRole } from "@/types/domain";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = await updateSession(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith(PROTECTED_PREFIXES.customer) || path.startsWith(PROTECTED_PREFIXES.shop) || path.startsWith(PROTECTED_PREFIXES.admin)) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: UserRole }>();

    if (!profile) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = profile.role;

    if (path.startsWith(PROTECTED_PREFIXES.customer) && role !== "customer") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (path.startsWith(PROTECTED_PREFIXES.shop) && role !== "shop_owner") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (path.startsWith(PROTECTED_PREFIXES.admin) && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/customer/:path*", "/shop/:path*", "/admin/:path*"],
};
