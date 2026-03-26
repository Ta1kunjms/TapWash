import { createClient } from "@/lib/supabase/server";
import type { SupportedLanguage, SupportTicketStatus, SupportTopic, UserRole } from "@/types/domain";

type HelpArticleRow = {
  id: string;
  topic: Exclude<SupportTopic, "other">;
  locale: SupportedLanguage;
  title: string;
  summary: string | null;
  content: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type SupportTicketRow = {
  id: string;
  customer_id: string;
  topic: SupportTopic;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

async function getCurrentUser(): Promise<{ id: string; role: UserRole } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  if (!profile) return null;

  return { id: user.id, role: profile.role };
}

export async function listHelpArticlesByTopic(topic: Exclude<SupportTopic, "other">, locale: SupportedLanguage): Promise<HelpArticleRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("help_articles")
    .select("id, topic, locale, title, summary, content, sort_order, is_published, created_at, updated_at")
    .eq("topic", topic)
    .eq("locale", locale)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message || "Unable to load help content.");
  }

  if ((data ?? []).length > 0 || locale === "en") {
    return (data ?? []) as HelpArticleRow[];
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("help_articles")
    .select("id, topic, locale, title, summary, content, sort_order, is_published, created_at, updated_at")
    .eq("topic", topic)
    .eq("locale", "en")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (fallbackError) {
    throw new Error(fallbackError.message || "Unable to load help content.");
  }

  return (fallbackData ?? []) as HelpArticleRow[];
}

export async function createSupportTicket(input: {
  topic: SupportTopic;
  subject: string;
  message: string;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("support_tickets").insert({
    customer_id: user.id,
    topic: input.topic,
    subject: input.subject.trim(),
    message: input.message.trim(),
  });

  if (error) {
    throw new Error(error.message || "Unable to submit support request.");
  }
}

export async function listCustomerSupportTickets(): Promise<SupportTicketRow[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, customer_id, topic, subject, message, status, admin_note, created_at, updated_at, resolved_at")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load support tickets.");
  }

  return (data ?? []) as SupportTicketRow[];
}

export async function listAdminSupportTickets(): Promise<(SupportTicketRow & { customer_name: string })[]> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, customer_id, topic, subject, message, status, admin_note, created_at, updated_at, resolved_at, profiles!support_tickets_customer_id_fkey(first_name, surname)")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load support tickets.");
  }

  return (data ?? []).map((ticket) => {
    const profile = Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles;
    const customerName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ").trim() || "Customer";

    return {
      id: ticket.id,
      customer_id: ticket.customer_id,
      topic: ticket.topic,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      admin_note: ticket.admin_note,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      resolved_at: ticket.resolved_at,
      customer_name: customerName,
    };
  });
}

export async function updateSupportTicketStatus(input: {
  ticketId: string;
  status: SupportTicketStatus;
  adminNote?: string;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const isResolved = input.status === "resolved" || input.status === "closed";
  const { error } = await supabase
    .from("support_tickets")
    .update({
      status: input.status,
      admin_note: input.adminNote?.trim() || null,
      updated_at: new Date().toISOString(),
      resolved_at: isResolved ? new Date().toISOString() : null,
    })
    .eq("id", input.ticketId);

  if (error) {
    throw new Error(error.message || "Unable to update support ticket.");
  }
}
