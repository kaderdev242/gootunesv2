/** Envoie une image du blog au serveur, qui la convertit en WebP optimisé. */
export async function uploadBlogImage(file: File, kind: "cover" | "inline"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choisis un fichier image.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Image trop lourde (15 Mo maximum).");

  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);

  let res: Response;
  try {
    res = await fetch("/api/blog/upload", { method: "POST", body: form });
  } catch {
    throw new Error("Connexion impossible. Vérifie ton réseau et réessaie.");
  }
  const data = (await res.json().catch(() => ({}))) as { fileUrl?: string; error?: string };
  if (!res.ok || !data.fileUrl) throw new Error(data.error || "Envoi de l'image impossible.");
  return data.fileUrl;
}
