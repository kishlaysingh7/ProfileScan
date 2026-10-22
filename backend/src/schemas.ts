import { z } from "zod";
import { PLATFORM_IDS } from "./platforms.js";

export const createJobSchema = z.object({
  consent: z.literal(true, { error: "Consent is required." }),
  name: z
    .string()
    .trim()
    .max(80)
    // eslint-disable-next-line no-control-regex
    .regex(/^[^\u0000-\u001f<>]*$/, "Name contains unsupported characters.")
    .default(""),
  usernames: z
    .array(z.string().trim().regex(/^[A-Za-z0-9._-]{1,30}$/, "Invalid username."))
    .max(5)
    .default([]),
  platforms: z.array(z.enum(PLATFORM_IDS as [string, ...string[]])).min(1).max(PLATFORM_IDS.length),
}).refine((v) => v.name !== "" || v.usernames.length > 0, {
  message: "Provide a name or at least one username.",
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const createVerificationSchema = z.object({
  consent: z.literal(true, { error: "Consent is required." }),
  platform: z.enum(PLATFORM_IDS as [string, ...string[]]),
  profileUrl: z.string().trim().max(300).url(),
});
