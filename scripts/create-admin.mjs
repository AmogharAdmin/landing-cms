import readline from "node:readline/promises";
import process from "node:process";
import bcrypt from "bcryptjs";
import { createPostgresConnection, loadProjectEnvironment } from "./postgres-env.mjs";

function argument(name) {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function validPassword(password) {
  return password.length >= 6 && Buffer.byteLength(password, "utf8") <= 72;
}

async function main() {
  await loadProjectEnvironment(process.cwd());
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const email = (argument("email") || process.env.ADMIN_EMAIL || await terminal.question("Admin email: "))
      .trim()
      .toLowerCase();
    const password = argument("password") || process.env.ADMIN_PASSWORD || await terminal.question("Admin password (input is visible; ADMIN_PASSWORD is recommended): ");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
      throw new Error("Enter a valid administrator email address.");
    }
    if (!validPassword(password)) {
      throw new Error("Password must be at least 6 characters.");
    }

    const hash = await bcrypt.hash(password, 12);
    const connection = await createPostgresConnection();
    try {
      await connection.query(
        `INSERT INTO admin_users (email, password_hash, is_active)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             is_active = TRUE,
             updated_at = CURRENT_TIMESTAMP`,
        [email, hash],
      );
      process.stdout.write(`Administrator ready: ${email}\n`);
    } finally {
      await connection.end();
    }
  } finally {
    terminal.close();
  }
}

main().catch((error) => {
  process.stderr.write(`Admin creation failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
