"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/notify";
import { roleToPath } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/domain";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import brandAsset from "../../Logo/Asset 16@300x.png";

type Mode = "signin" | "signup" | "forgot-password";

export function AuthForm({ mode }: { mode: Mode }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [resetValue, setResetValue] = useState("");
  const [loading, setLoading] = useState(false);
  const role: UserRole = "customer";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: identifier.trim(), password });
        if (error) throw error;

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user?.id ?? "")
          .single<{ role: UserRole }>();

        const nextPath = profile ? roleToPath(profile.role) : "/customer";
        notify.success("Welcome back");
        router.replace(nextPath);
      }

      if (mode === "signup") {
        if (password !== confirmPassword) {
          notify.error("Passwords do not match.");
          setLoading(false);
          return;
        }
        const fullName = `${firstName.trim()} ${surname.trim()}`.trim();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              surname: surname.trim(),
              full_name: fullName,
              username: username.trim(),
              phone: phone.trim(),
              role,
            },
          },
        });
        if (error) throw error;
        notify.success("Account created. Check your email if confirmation is enabled.");
        router.replace(roleToPath(role));

        if (phone.trim()) {
          await supabase.from("profiles").update({ phone: phone.trim() }).eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
        }
      }

      if (mode === "forgot-password") {
        if (!resetValue.includes("@")) {
          notify.error("Please enter an email address to reset password.");
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(resetValue.trim());
        if (error) throw error;
        notify.success("Password reset link sent. Please check your email.");
      }

      router.refresh();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot-password";

  const heading =
    mode === "signin" ? "Welcome back!" : isSignup ? "Create account" : "Reset password";
  const ctaText =
    mode === "signin" ? "Sign In" : isSignup ? "Create Account" : "Send Reset Link";

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-background-app px-6">
      {/* ── Brand header ── */}
      <div className="flex items-center justify-center pt-8 pb-4">
        <Image src={brandAsset} alt="TapWash by TopPix" priority className="h-auto w-[220px]" />
      </div>

      {/* ── Card ── */}
      <div className="flex flex-1 flex-col justify-center gap-0">
        {/* Heading */}
        <div className="mb-5">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">{heading}</h1>
          <p className="mt-1 text-sm text-text-secondary/55">
            {mode === "signin"
              ? "Sign in to continue to TapWash."
              : isSignup
                ? "Join TapWash and get started today."
                : "Enter your email and we'll send a reset link."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {isSignup && (
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="h-11 rounded-xl bg-white shadow-sm"
              />
              <Input
                required
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Surname"
                className="h-11 rounded-xl bg-white shadow-sm"
              />
            </div>
          )}

          {mode === "signin" && (
            <Input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or username"
              className="h-11 rounded-xl bg-white shadow-sm"
            />
          )}


          {isSignup && (
            <>
              <Input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="h-11 rounded-xl bg-white shadow-sm"
              />
              <Input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="h-11 rounded-xl bg-white shadow-sm"
              />
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="h-11 rounded-xl bg-white shadow-sm"
              />
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-11 rounded-xl bg-white shadow-sm pr-12"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fi fi-rr-${showPassword ? 'eye-crossed' : 'eye'} text-lg`} />
                </button>
              </div>
              <div className="relative">
                <Input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="h-11 rounded-xl bg-white shadow-sm pr-12"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fi fi-rr-${showConfirmPassword ? 'eye-crossed' : 'eye'} text-lg`} />
                </button>
              </div>
            </>
          )}

          {!isForgot && !isSignup && (
            <div className="relative">
              <Input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-11 rounded-xl bg-white shadow-sm pr-12"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`fi fi-rr-${showPassword ? 'eye-crossed' : 'eye'} text-lg`} />
              </button>
            </div>
          )}

          {isForgot && (
            <Input
              required
              value={resetValue}
              onChange={(e) => setResetValue(e.target.value)}
              placeholder="Email address"
              className="h-11 rounded-xl bg-white shadow-sm"
            />
          )}

          {mode === "signin" && (
            <div className="flex items-center justify-end pt-0.5">
              <Link href="/forgot-password" className="text-xs font-medium text-primary-500">
                Forgot password?
              </Link>
            </div>
          )}

          <div className="pt-1">
            <Button
              disabled={loading}
              className="h-12 w-full rounded-xl text-[15px] font-semibold tracking-wide shadow-md"
              type="submit"
            >
              {loading ? "Please wait…" : ctaText}
            </Button>
          </div>
        </form>

        {/* Footer link */}
        <p className="mt-5 text-center text-sm text-text-secondary/50">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-primary-500">
                Sign up
              </Link>
            </>
          ) : isSignup ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary-500">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Remembered your password?{" "}
              <Link href="/login" className="font-semibold text-primary-500">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>

      {/* ── Bottom spacer with TopPix credit ── */}
      <div className="pb-6 text-center">
        <p className="text-[10px] text-text-secondary/30 tracking-widest uppercase">
          TapWash &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
