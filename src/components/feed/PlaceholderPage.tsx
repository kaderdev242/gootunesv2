type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl font-bold text-white">{title}</h1>
      <p className="mt-3 text-white/50">{description}</p>
      <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center text-sm text-white/40">
        Contenu simulé à venir — navigation connectée.
      </div>
    </div>
  );
}
