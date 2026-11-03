import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  next: z.string().optional().default(""),
});

export const signUpSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(["fan", "artist", "label"]),
  display_name: z.string().trim().max(80).optional().default(""),
  country: z.string().trim().max(8).optional().default(""),
});

export const uploadKindSchema = z.enum(["cover", "audio", "avatar"]);

export const presignUploadSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(255)
    .transform((v) => v.replace(/[^a-zA-Z0-9._-]/g, "_")),
  contentType: z.string().min(1).max(120),
  kind: uploadKindSchema.default("cover"),
  /** Taille déclarée par le client (octets) — obligatoire pour anti-abus. */
  size: z.number().int().positive().max(50 * 1024 * 1024),
});

export const mbiyoWebhookSchema = z.object({
  transaction_id: z.string().min(1),
  amount: z.number(),
  fee: z.number().optional(),
  currency: z.string().min(1),
  order_id: z.string().min(1),
  status: z.string().min(1),
  charged_amount: z.number().optional(),
  type: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const payinFormSchema = z.object({
  releaseId: z.string().min(1),
  paymentMethod: z.string().min(1),
  phoneRaw: z.string().trim().min(6).max(32),
});

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
