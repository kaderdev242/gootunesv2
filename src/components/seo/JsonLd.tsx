/**
 * JSON-LD schema.org — rendu serveur, visible sans JS.
 * Un bloc <script> par objet : certains navigateurs intégrés (Facebook, Instagram)
 * lisent `data["@context"]` et plantent sur un tableau.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // `<` échappé : un titre contenant « </script> » ne peut pas casser la page
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
