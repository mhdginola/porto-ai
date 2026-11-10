import type { ContactCategory } from "@/lib/contact/schema";

export const LEAD_STATUSES = ["new", "read", "archived", "spam"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Inbox views → which statuses they show. */
export const LEAD_VIEWS = {
  inbox: ["new", "read"],
  unread: ["new"],
  archived: ["archived"],
  spam: ["spam"],
  all: ["new", "read", "archived", "spam"],
} as const satisfies Record<string, readonly LeadStatus[]>;
export type LeadView = keyof typeof LEAD_VIEWS;

export type Lead = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  message: string;
  locale: string;
  category: ContactCategory | null;
  confidence: number | null;
  priority: "high" | "normal" | "low" | null;
  summary: string | null;
  suggestedReply: string | null;
  aiModel: string | null;
  aiError: string | null;
  status: LeadStatus;
  notifiedAt: string | null;
  autoRepliedAt: string | null;
  createdAt: string;
};

export type LeadStats = {
  unread: number;
  highPriorityUnread: number;
  spam: number;
  total: number;
  last30Days: Partial<Record<ContactCategory | "unclassified", number>>;
};

export type LeadsResponse = {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  stats: LeadStats;
};
