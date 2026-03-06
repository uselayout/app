import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
  user: {
    modelName: "sd_aistudio_user",
  },
  account: {
    modelName: "sd_aistudio_account",
  },
  verification: {
    modelName: "sd_aistudio_verification",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    modelName: "sd_aistudio_session",
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3000",
    ...(process.env.NEXT_PUBLIC_APP_URL
      ? [process.env.NEXT_PUBLIC_APP_URL.replace("https://", "http://"),
         process.env.NEXT_PUBLIC_APP_URL.replace("http://", "https://")]
      : []),
  ],
});

export type Session = typeof auth.$Infer.Session;
