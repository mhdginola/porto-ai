import "./_loadEnv";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { demoUsers } from "@/lib/db/schema";
import { seedDefaultPermissions } from "@/lib/auth-demo/permission-store";

const PASSWORD = "demo123";

const USERS = [
  {
    email: "superadmin@demo.local",
    name: "Demo Superadmin",
    role: "superadmin",
  },
  {
    email: "admin@demo.local",
    name: "Demo Admin",
    role: "admin",
  },
  {
    email: "editor@demo.local",
    name: "Demo Editor",
    role: "editor",
  },
  {
    email: "viewer@demo.local",
    name: "Demo Viewer",
    role: "viewer",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const user of USERS) {
    await db
      .insert(demoUsers)
      .values({ ...user, passwordHash })
      .onConflictDoNothing({ target: demoUsers.email });
  }

  await seedDefaultPermissions();

  console.log("✓ Seeded auth demo users (password for all: demo123)");
  console.log("  - superadmin@demo.local (superadmin)");
  console.log("  - admin@demo.local (admin)");
  console.log("  - editor@demo.local (editor)");
  console.log("  - viewer@demo.local (viewer)");
  console.log("✓ Seeded default role permissions");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
