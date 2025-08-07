import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

interface Database {
  users: {
    id: string;
    email: string;
    hashed_password?: string;
    created_at: string;
  };
  sessions: {
    id: string;
    user_id: string;
    expires_at: string;
  };
  email_verification_codes: {
    id: string;
    user_id: string;
    code: string;
    expires_at: string;
  };
  password_reset_tokens: {
    id: string;
    user_id: string;
    token: string;
    expires_at: string;
  };
}

export const createAuth = (env: Env) => {
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: env.DB_AUTH }),
  });

  return betterAuth({
    database: db,
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      github: {
        // Cambia process.env por env
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
      google: {
        // Cambia process.env por env
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    baseURL: env.BETTER_AUTH_URL,
  });
};
