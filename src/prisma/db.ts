import "server-only";
import "dotenv/config";
import { supabase } from "@prisma/orm-extension-supabase/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

// Module-level singleton — constructed once, lives for the process. Every
// route/handler imports this `db`, never constructs its own client (a fresh
// client per request would open/close a pool on every call). See the
// prisma-8 skill's runtime.md for why `await using` doesn't belong here.
//
// Role-first: there is no top-level db.sql / db.orm — every call site binds
// a role first (db.asServiceRole() / db.asUser(jwt) / db.asAnon()), because
// this contract enforces RLS (see src/prisma/contract.prisma).
export const db = await supabase<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"]!,
  jwksUrl: process.env["SUPABASE_JWKS_URL"]!,
});
