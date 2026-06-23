import { format, parseISO } from "date-fns";
import type { InboxNote } from "@/lib/types";

export function noteDisplayTitle(note: InboxNote): string {
  const title = note.title.trim();
  if (title) return title;
  const firstLine = note.body.trim().split("\n")[0]?.trim();
  return firstLine || "New Note";
}

export function notePreview(body: string, maxLen = 80): string {
  const flat = body.trim().replace(/\s+/g, " ");
  if (!flat) return "No additional text";
  return flat.length > maxLen ? `${flat.slice(0, maxLen)}…` : flat;
}

export function formatNoteDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return "";
  }
}

export function sortNotes(notes: InboxNote[]): InboxNote[] {
  return [...notes].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function createInboxNote(
  partial?: Partial<Pick<InboxNote, "title" | "body">>
): InboxNote {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: partial?.title?.trim() ?? "",
    body: partial?.body ?? "",
    created_at: now,
    updated_at: now,
  };
}
