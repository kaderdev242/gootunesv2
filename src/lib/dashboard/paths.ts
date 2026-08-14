import type { UserRole } from "@/lib/supabase/database.types";

export type CreatorBase = "/artist" | "/label";

export function creatorHome(role: UserRole): CreatorBase | "/discover" {
  if (role === "artist") return "/artist";
  if (role === "label") return "/label";
  return "/discover";
}

export function creatorPath(
  role: Extract<UserRole, "artist" | "label">,
  path = "",
): string {
  const base = role === "label" ? "/label" : "/artist";
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
