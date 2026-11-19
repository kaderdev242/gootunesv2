"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Delete02Icon,
  Heading02Icon,
  Heading03Icon,
  Image01Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  MinusSignIcon,
  ParagraphIcon,
  QuoteDownIcon,
  Redo02Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextUnderlineIcon,
  Undo02Icon,
  Upload04Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pill, consoleButtonClass, cx } from "@/components/admin/console/ui";
import { deleteBlogPost, saveBlogPost } from "@/lib/actions/blog";
import { safeHref, slugify } from "@/lib/blog/content";
import type { BlogPostStatus } from "@/lib/supabase/database.types";
import { toastError, toastFromAction } from "@/lib/toast";
import { uploadBlogImage } from "./blog-upload";

type IconType = typeof TextBoldIcon;

export type BlogEditorPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string | null;
  content: unknown;
  status: BlogPostStatus;
};

const field =
  "w-full rounded-xl border border-white/[0.1] bg-black/30 px-3 text-[14px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/25";

/* ─────────── Barre d'outils ─────────── */

function ToolButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: IconType;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cx(
        "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-30",
        active ? "bg-white text-black" : "text-white/70 hover:bg-white/[0.08] hover:text-white",
      )}
    >
      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.6} />
    </button>
  );
}

function Toolbar({
  editor,
  onPickImage,
  onToggleLink,
  imageBusy,
}: {
  editor: Editor;
  onPickImage: () => void;
  onToggleLink: () => void;
  imageBusy: boolean;
}) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      p: e.isActive("paragraph"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();
  const sep = <span className="mx-1 h-5 w-px shrink-0 bg-white/[0.08]" />;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none] border-b border-white/[0.06] bg-[#0f0f10]/95 px-2 py-1.5 backdrop-blur">
      <ToolButton icon={ParagraphIcon} label="Paragraphe" active={s.p} onClick={() => chain().setParagraph().run()} />
      <ToolButton icon={Heading02Icon} label="Titre" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <ToolButton icon={Heading03Icon} label="Sous-titre" active={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
      {sep}
      <ToolButton icon={TextBoldIcon} label="Gras" active={s.bold} onClick={() => chain().toggleBold().run()} />
      <ToolButton icon={TextItalicIcon} label="Italique" active={s.italic} onClick={() => chain().toggleItalic().run()} />
      <ToolButton icon={TextUnderlineIcon} label="Souligné" active={s.underline} onClick={() => chain().toggleUnderline().run()} />
      <ToolButton icon={TextStrikethroughIcon} label="Barré" active={s.strike} onClick={() => chain().toggleStrike().run()} />
      {sep}
      <ToolButton icon={LeftToRightListBulletIcon} label="Liste à puces" active={s.bullet} onClick={() => chain().toggleBulletList().run()} />
      <ToolButton icon={LeftToRightListNumberIcon} label="Liste numérotée" active={s.ordered} onClick={() => chain().toggleOrderedList().run()} />
      <ToolButton icon={QuoteDownIcon} label="Citation" active={s.quote} onClick={() => chain().toggleBlockquote().run()} />
      <ToolButton icon={MinusSignIcon} label="Séparateur" onClick={() => chain().setHorizontalRule().run()} />
      {sep}
      <ToolButton icon={Link01Icon} label="Lien" active={s.link} onClick={onToggleLink} />
      <ToolButton icon={Image01Icon} label="Insérer une image" disabled={imageBusy} onClick={onPickImage} />
      {sep}
      <ToolButton icon={Undo02Icon} label="Annuler" disabled={!s.canUndo} onClick={() => chain().undo().run()} />
      <ToolButton icon={Redo02Icon} label="Rétablir" disabled={!s.canRedo} onClick={() => chain().redo().run()} />
    </div>
  );
}

function LinkBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [value, setValue] = useState(() => (editor.getAttributes("link").href as string | undefined) ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  const apply = () => {
    const raw = value.trim();
    if (!raw) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      onClose();
      return;
    }
    const withScheme = /^(https?:|mailto:|tel:|\/)/i.test(raw) ? raw : `https://${raw}`;
    const href = safeHref(withScheme);
    if (!href) {
      toastError("Lien invalide", "Utilise une adresse web, un e-mail ou un chemin du site.");
      return;
    }
    const { empty } = editor.state.selection;
    if (empty && !editor.isActive("link")) {
      editor.chain().focus().insertContent({ type: "text", text: raw, marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    onClose();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-[#141415] px-3 py-2">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        placeholder="https://… ou /discover/…"
        className={`${field} h-9 min-w-0 flex-1`}
      />
      <button type="button" onClick={apply} className={consoleButtonClass("primary", "sm")}>
        Appliquer
      </button>
      {editor.isActive("link") ? (
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            onClose();
          }}
          className={consoleButtonClass("subtle", "sm")}
        >
          Retirer le lien
        </button>
      ) : null}
      <button type="button" onClick={onClose} className={consoleButtonClass("subtle", "sm")}>
        Fermer
      </button>
    </div>
  );
}

/* ─────────── Éditeur ─────────── */

export function BlogEditor({ post }: { post: BlogEditorPost | null }) {
  const router = useRouter();
  const [id, setId] = useState(post?.id ?? null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(post?.coverUrl ?? null);
  const [status, setStatus] = useState<BlogPostStatus>(post?.status ?? "draft");
  const [dirty, setDirty] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const imageInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);

  const insertImages = useCallback(async (files: File[], at?: number) => {
    const editor = editorRef.current;
    if (!editor || files.length === 0) return;
    setImageBusy(true);
    try {
      for (const file of files) {
        const src = await uploadBlogImage(file, "inline");
        const node = { type: "image", attrs: { src, alt: "" } };
        if (typeof at === "number") editor.chain().focus().insertContentAt(at, node).run();
        else editor.chain().focus().insertContent(node).run();
      }
    } catch (e) {
      toastError("Image non ajoutée", e instanceof Error ? e.message : undefined);
    } finally {
      setImageBusy(false);
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
          HTMLAttributes: { rel: "noopener noreferrer", target: null },
        },
      }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "Écris ton article…" }),
    ],
    content: (post?.content as object | undefined) ?? "",
    editorProps: {
      attributes: { class: "blog-prose px-5 py-6 sm:px-8" },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        void insertImages(files);
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        void insertImages(files, pos);
        return true;
      },
    },
    onUpdate: () => setDirty(true),
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Prévenir avant de quitter la page avec des modifications non enregistrées.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = (nextStatus: BlogPostStatus) => {
    if (!editor) return;
    startSaving(async () => {
      const res = await saveBlogPost({
        id,
        title,
        slug,
        excerpt,
        coverUrl,
        content: editor.getJSON(),
        status: nextStatus,
      });
      toastFromAction(res);
      if (res.error || !res.id) return;
      setDirty(false);
      setStatus(res.status ?? nextStatus);
      if (res.slug) setSlug(res.slug);
      setSlugTouched(true);
      if (!id) {
        setId(res.id);
        router.replace(`/goo-admin/blog/${res.id}`);
      } else {
        router.refresh();
      }
    });
  };

  const onCover = async (file: File | undefined) => {
    if (!file) return;
    setCoverBusy(true);
    try {
      setCoverUrl(await uploadBlogImage(file, "cover"));
      setDirty(true);
    } catch (e) {
      toastError("Couverture non ajoutée", e instanceof Error ? e.message : undefined);
    } finally {
      setCoverBusy(false);
    }
  };

  const published = status === "published";

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/goo-admin/blog" aria-label="Retour aux articles" className={consoleButtonClass("ghost", "sm")}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.6} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-semibold text-white">{id ? "Modifier l'article" : "Nouvel article"}</h1>
            <div className="mt-0.5 flex items-center gap-3">
              <Pill tone={published ? "ok" : "neutral"}>{published ? "Publié" : "Brouillon"}</Pill>
              {dirty ? <span className="text-[12px] text-white/40">Modifications non enregistrées</span> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {id && published ? (
            <Link href={`/blog/${slug}`} target="_blank" className={consoleButtonClass("ghost", "md")}>
              <HugeiconsIcon icon={ViewIcon} size={16} strokeWidth={1.6} />
              Voir
            </Link>
          ) : null}
          <button
            type="button"
            disabled={saving || !editor}
            onClick={() => save("draft")}
            className={consoleButtonClass("ghost", "md")}
          >
            {published ? "Repasser en brouillon" : "Enregistrer le brouillon"}
          </button>
          <button
            type="button"
            disabled={saving || !editor}
            onClick={() => save("published")}
            className={consoleButtonClass("primary", "md")}
          >
            {saving ? "Un instant…" : published ? "Mettre à jour" : "Publier"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Colonne principale : titre + contenu */}
        <div className="min-w-0 space-y-4">
          <textarea
            value={title}
            onChange={(e) => {
              setTitle(e.target.value.replace(/\n/g, " "));
              if (!slugTouched) setSlug(slugify(e.target.value));
              setDirty(true);
            }}
            rows={1}
            maxLength={160}
            placeholder="Titre de l'article"
            className="font-display field-sizing-content w-full resize-none bg-transparent text-[30px] font-bold leading-tight text-white outline-none placeholder:text-white/25 sm:text-[36px]"
          />
          <div className="blog-editor overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f10]">
            {editor ? (
              <>
                <Toolbar
                  editor={editor}
                  imageBusy={imageBusy}
                  onPickImage={() => imageInput.current?.click()}
                  onToggleLink={() => setLinkOpen((v) => !v)}
                />
                {linkOpen ? <LinkBar editor={editor} onClose={() => setLinkOpen(false)} /> : null}
                {imageBusy ? (
                  <p className="border-b border-white/[0.06] px-4 py-2 text-[13px] text-white/50">
                    Optimisation de l&apos;image…
                  </p>
                ) : null}
              </>
            ) : null}
            <EditorContent editor={editor} />
          </div>
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              void insertImages(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <p className="text-[12px] text-white/35">
            Astuce : tu peux aussi coller ou glisser une image dans le texte. Elle est convertie en WebP et allégée
            automatiquement.
          </p>
        </div>

        {/* Colonne latérale : réglages */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/[0.06] bg-[#0f0f10] p-4">
            <h2 className="text-[14px] font-semibold text-white">Image de couverture</h2>
            <div className="mt-3">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="aspect-[16/9] w-full rounded-xl object-cover" />
              ) : (
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  disabled={coverBusy}
                  className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] text-[13px] text-white/45 transition-colors hover:border-white/25 hover:text-white/70"
                >
                  <HugeiconsIcon icon={Upload04Icon} size={20} strokeWidth={1.5} />
                  {coverBusy ? "Optimisation…" : "Ajouter une image"}
                </button>
              )}
              {coverUrl ? (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={coverBusy}
                    onClick={() => coverInput.current?.click()}
                    className={consoleButtonClass("subtle", "sm")}
                  >
                    {coverBusy ? "Optimisation…" : "Remplacer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverUrl(null);
                      setDirty(true);
                    }}
                    className={consoleButtonClass("danger", "sm")}
                  >
                    Retirer
                  </button>
                </div>
              ) : null}
              <input
                ref={coverInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  void onCover(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/[0.06] bg-[#0f0f10] p-4">
            <label className="block space-y-1.5">
              <span className="text-[13px] text-white/50">Adresse de l&apos;article</span>
              <div className="flex items-center rounded-xl border border-white/[0.1] bg-black/30 pl-3 focus-within:border-white/25">
                <span className="shrink-0 text-[13px] text-white/35">/blog/</span>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                    setSlugTouched(true);
                    setDirty(true);
                  }}
                  onBlur={() => setSlug((v) => slugify(v))}
                  placeholder="titre-de-l-article"
                  className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-[14px] text-white outline-none placeholder:text-white/30"
                />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[13px] text-white/50">Résumé</span>
              <textarea
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  setDirty(true);
                }}
                rows={4}
                maxLength={320}
                placeholder="Laisse vide pour reprendre le début de l'article."
                className={`${field} resize-none py-2.5`}
              />
              <span className="block text-right text-[12px] text-white/30">{excerpt.length}/320</span>
            </label>
          </section>

          {id ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={cx(consoleButtonClass("danger", "md"), "w-full")}
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={1.6} />
              Supprimer l&apos;article
            </button>
          ) : null}
        </aside>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer cet article ?"
        description="L'article sera retiré du blog définitivement. Cette action est irréversible."
        isPending={deleting}
        onConfirm={() =>
          startDeleting(async () => {
            if (!id) return;
            const res = await deleteBlogPost(id);
            toastFromAction(res);
            if (res.error) return;
            setDirty(false);
            setConfirmDelete(false);
            router.replace("/goo-admin/blog");
          })
        }
      />
    </div>
  );
}
