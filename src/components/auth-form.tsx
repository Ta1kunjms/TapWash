"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { roleToPath } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/domain";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import tapWashLogo from "../../Logo/tapwash-logo.png";

type Mode = "signin" | "signup" | "forgot-password";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        toast.success("Welcome back");
        router.replace(nextPath);
      }

      if (mode === "signup") {
        const fullName = `${firstName.trim()} ${surname.trim()}`.trim();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              first_name: firstName.trim(),
              surname: surname.trim(),
              username: username.trim(),
              phone: phone.trim(),
              role,
            },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is enabled.");
        router.replace(roleToPath(role));

        if (phone.trim()) {
          await supabase.from("profiles").update({ phone: phone.trim() }).eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
        }
      }

      if (mode === "forgot-password") {
        if (!resetValue.includes("@")) {
          toast.error("Please enter an email address to reset password.");
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(resetValue.trim());
        if (error) throw error;
        toast.success("Password reset link sent. Please check your email.");
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  }

  const heading = mode === "signin" ? "Welcome back!" : mode === "signup" ? "Create account" : "Forgot password?";
  const subtitle =
    mode === "signin"
      ? "Sign in to your account."
      : mode === "signup"
        ? "Join TapWash now!"
        : "Enter your email address or phone number to reset the password.";
  const ctaText =
    mode === "signin" ? "Login" : mode === "signup" ? "Create Account" : "Reset Password";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col bg-background-app px-6 pb-10 pt-12">
      <div className="mb-10 flex flex-col items-center">
        <Image src={tapWashLogo} alt="TapWash" priority className="h-auto w-[210px]" />
      </div>

      <h1 className="text-[44px] leading-none font-bold text-primary-500">{heading}</h1>
      <p className="mt-1 max-w-[320px] text-sm text-text-secondary/60">{subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="First Name"
              className="rounded-md bg-white"
            />
            <Input
              required
              value={surname}
              onChange={(event) => setSurname(event.target.value)}
              placeholder="Surname"
              className="rounded-md bg-white"
            />
          </div>
        )}

        {mode === "signin" && (
          <Input
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Username or Email"
            className="rounded-md bg-white"
          />
        )}

        {mode === "signup" && (
          <>
            <Input
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              className="rounded-md bg-white"
            />
            <Input
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone Number"
              className="rounded-md bg-white"
            />
            <Input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="rounded-md bg-white"
            />
          </>
        )}

        {mode !== "forgot-password" && (
          <Input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="rounded-md bg-white"
          />
        )}

        {mode === "forgot-password" && (
          <Input
            required
            value={resetValue}
            onChange={(event) => setResetValue(event.target.value)}
            placeholder="Email / Phone"
            className="rounded-md bg-white"
          />
        )}

        {mode === "signin" && (
          <div className="flex items-center justify-between text-sm text-text-secondary/60">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-border-muted" />
              <span>Remember for 30 days</span>
            </label>
            <Link href="/forgot-password" className="font-medium text-primary-500">
              Forgot password?
            </Link>
          </div>
        )}

        <Button disabled={loading} className="mt-1 h-12 w-full rounded-md" type="submit">
          {loading ? "Please wait..." : `${ctaText} →`}
        </Button>

        {mode === "signin" && (
          <>
            <p className="pt-1 text-center text-sm text-text-secondary/45">or continue with</p>
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="secondary" className="h-11 rounded-md border-0 bg-white text-text-secondary/65">
                Google
              </Button>
              <Button type="button" variant="secondary" className="h-11 rounded-md border-0 bg-white text-text-secondary/65">
                Facebook
              </Button>
              <Button type="button" variant="secondary" className="h-11 rounded-md border-0 bg-white text-text-secondary/65">
                Apple
              </Button>
            </div>
          </>
        )}
      </form>

      <div className="mt-auto pt-12 text-center text-[26px] text-text-secondary/40">
        {mode === "signin" && (
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary-500">
              Sign up
            </Link>
          </p>
        )}
        {mode === "signup" && (
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary-500">
              Sign in
            </Link>
          </p>
        )}
        {mode === "forgot-password" && (
          <p>
            Remembered your password?{" "}
            <Link href="/login" className="font-semibold text-primary-500">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
