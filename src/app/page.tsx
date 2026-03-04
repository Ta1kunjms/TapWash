import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl p-4 pt-10">
      <section className="grid gap-4 md:grid-cols-2 md:items-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">TapWash</h1>
          <p className="text-text-secondary">
            Mobile-first laundry marketplace connecting customers and verified laundry shops.
          </p>
          <div className="flex gap-2">
            <Link href="/signup">
              <Button>Create account</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Login</Button>
            </Link>
          </div>
        </div>
        <Card>
          <h2 className="text-lg font-semibold">What you can do</h2>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-text-secondary">
            <li>Book laundry pickup and track status realtime</li>
            <li>Manage shop orders and services</li>
            <li>Run admin verification and analytics</li>
          </ul>
        </Card>
      </section>
    </main>
  );
}
