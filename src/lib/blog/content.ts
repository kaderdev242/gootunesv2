/**
 * Contenu des articles du blog : document Tiptap (JSON ProseMirror).
 * On ne stocke et n'affiche qu'une liste fermée de blocs et de styles :
 * tout le reste est retiré à l'enregistrement, et le rendu applique la même liste.
 */

export type BlogMark =
  | { type: "bold" | "italic" | "underline" | "strike" | "code" }
  | { type: "link"; attrs: { href: string } };

export type BlogNode =
  | { type: "doc"; content: BlogNode[] }
  | { type: "paragraph"; content?: BlogNode[] }
  | { type: "heading"; attrs: { level: 2 | 3 }; content?: BlogNode[] }
  | { type: "bulletList" | "orderedList"; content: BlogNode[] }
  | { type: "listItem"; content: BlogNode[] }
  | { type: "blockquote"; content: BlogNode[] }
  | { type: "codeBlock"; content?: BlogNode[] }
  | { type: "horizontalRule" }
  | { type: "hardBreak" }
  | { type: "image"; attrs: { src: string; alt: string } }
  | { type: "text"; text: string; marks?: BlogMark[] };

export type BlogDoc = { type: "doc"; content: BlogNode[] };

export const EMPTY_DOC: BlogDoc = { type: "doc", content: [] };

type Raw = { type?: unknown; attrs?: Record<string, unknown>; content?: unknown; text?: unknown; marks?: unknown };

const SIMPLE_MARKS = new Set(["bold", "italic", "underline", "strike", "code"]);
const CONTAINERS = new Set(["paragraph", "bulletList", "orderedList", "listItem", "blockquote", "codeBlock"]);

/** Liens autorisés : web, e-mail, téléphone, ou chemin interne. */
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (!href || href.length > 2000) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Images autorisées : HTTPS uniquement (nos uploads R2). */
export function safeImageSrc(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanMarks(raw: unknown): BlogMark[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const marks: BlogMark[] = [];
  for (const m of raw as Raw[]) {
    const type = typeof m?.type === "string" ? m.type : "";
    if (SIMPLE_MARKS.has(type)) {
      marks.push({ type: type as "bold" });
    } else if (type === "link") {
      const href = safeHref(m.attrs?.href);
      if (href) marks.push({ type: "link", attrs: { href } });
    }
  }
  return marks.length ? marks : undefined;
}

function cleanChildren(raw: unknown, depth: number): BlogNode[] {
  if (!Array.isArray(raw) || depth > 20) return [];
  const out: BlogNode[] = [];
  for (const child of raw as Raw[]) {
    const node = cleanNode(child, depth + 1);
    if (node) out.push(node);
  }
  return out;
}

function cleanNode(raw: Raw, depth: number): BlogNode | null {
  const type = typeof raw?.type === "string" ? raw.type : "";

  if (type === "text") {
    const text = typeof raw.text === "string" ? raw.text : "";
    if (!text) return null;
    const marks = cleanMarks(raw.marks);
    return marks ? { type: "text", text, marks } : { type: "text", text };
  }
  if (type === "hardBreak" || type === "horizontalRule") return { type };
  if (type === "image") {
    const src = safeImageSrc(raw.attrs?.src);
    if (!src) return null;
    const alt = typeof raw.attrs?.alt === "string" ? raw.attrs.alt.slice(0, 300) : "";
    return { type: "image", attrs: { src, alt } };
  }
  if (type === "heading") {
    const level = Number(raw.attrs?.level) <= 2 ? 2 : 3;
    return { type: "heading", attrs: { level }, content: cleanChildren(raw.content, depth) };
  }
  if (CONTAINERS.has(type)) {
    return { type, content: cleanChildren(raw.content, depth) } as BlogNode;
  }
  return null;
}

/** Reconstruit un document sûr à partir de n'importe quel JSON reçu. */
export function sanitizeDoc(raw: unknown): BlogDoc {
  // Accepte le document sous forme de texte JSON (envoi depuis l'éditeur).
  if (typeof raw === "string") {
    if (raw.length > 500_000) return EMPTY_DOC;
    try {
      raw = JSON.parse(raw);
    } catch {
      return EMPTY_DOC;
    }
  }
  const root = (raw ?? {}) as Raw;
  if (root.type !== "doc") return EMPTY_DOC;
  return { type: "doc", content: cleanChildren(root.content, 0) };
}

/** Texte brut (extrait automatique, temps de lecture). */
export function docPlainText(doc: BlogDoc): string {
  const parts: string[] = [];
  const walk = (nodes: BlogNode[]) => {
    for (const n of nodes) {
      if (n.type === "text") parts.push(n.text);
      else if (n.type === "hardBreak") parts.push(" ");
      else if ("content" in n && n.content) {
        walk(n.content);
        parts.push(" ");
      }
    }
  };
  walk(doc.content);
  return parts.join("").replace(/\s+/g, " ").trim();
}

export function readingMinutes(text: string): number {
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 220));
}

export function autoExcerpt(text: string, max = 200): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 30)).trim()}…`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 120;
}
