import Link from "next/link";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="rounded-xl bg-[#5b8def] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#5b8def]/25 transition hover:bg-[#4a7de0]"
        >
          {action.label}
        </Link>
      ) : null}
    </header>
  );
}
