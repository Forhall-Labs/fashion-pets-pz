import "dotenv/config";
import { definePrismaConfig } from "@prisma/cli-engine";
import postgresAdapter from "@prisma/orm-target-postgres/adapter/control";
import { defineConfig } from "@prisma/orm-toolchain/cli/config-types";
import postgresDriver from "@prisma/orm-target-postgres/driver/control";
import supabasePack from "@prisma/orm-extension-supabase/pack";
import sql from "@prisma/orm-family-sql/family/control";
import { prismaContract } from "@prisma/orm-family-sql/contract-psl/provider";
import postgres from "@prisma/orm-target-postgres/target/control";
import postgresPackRef from "@prisma/orm-target-postgres/target/pack";
import { postgresCreateNamespace } from "@prisma/orm-target-postgres/target/types";

// Low-level config (not the `@prisma/orm-postgres/config` façade) — required
// because the Supabase extension has no `/control` subpath yet. Mirrors
// Prisma Next's own `examples/supabase/prisma.config.ts`, wrapped in
// definePrismaConfig as this CLI version requires.
export default definePrismaConfig({
  orm: defineConfig({
    family: sql,
    target: postgres,
    adapter: postgresAdapter,
    driver: postgresDriver,
    extensions: [supabasePack],
    contract: prismaContract("./src/prisma/contract.prisma", {
      output: "src/prisma/contract.json",
      target: postgresPackRef,
      createNamespace: postgresCreateNamespace,
    }),
    migrations: { dir: "migrations" },
    db: {
      connection: process.env["DATABASE_URL"]!,
    },
  }),
});
