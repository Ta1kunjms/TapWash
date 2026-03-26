import { AuthForm } from "@/components/auth-form";
import { normalizeLocale } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function ForgotPasswordPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("tapwash.locale")?.value);

  return <AuthForm mode="forgot-password" locale={locale} />;
}
