import { ConsoleHeader, ConsoleLink } from "@/components/admin/console/ui";

export function AdminPageHeader({
  title,
  description,
  action,
  kicker,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  kicker?: string;
}) {
  return (
    <ConsoleHeader
      kicker={kicker}
      title={title}
      description={description}
      actions={
        action ? (
          <ConsoleLink href={action.href} tone="primary">
            {action.label}
          </ConsoleLink>
        ) : null
      }
    />
  );
}
