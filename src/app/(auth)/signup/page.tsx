import { AuthForm } from "@/components/auth-form";
import { normalizeLocale } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function SignupPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("tapwash.locale")?.value);

  return <AuthForm mode="signup" locale={locale} />;
}
