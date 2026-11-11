import readline from "node:readline/promises";
import process from "node:process";
import bcrypt from "bcryptjs";

function argument(name) {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const email = (argument("email") || process.env.ADMIN_EMAIL || await terminal.question("Admin email: ")).trim().toLowerCase();
    const password = argument("password") || process.env.ADMIN_PASSWORD || await terminal.question("Admin password (input is visible; ADMIN_PASSWORD is recommended): ");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) throw new Error("Enter a valid administrator email address.");
    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      throw new Error("Password must be 12-72 bytes and include uppercase, lowercase, number, and special character.");
    }
    const hash = await bcrypt.hash(password, 12);
    const safeEmail = email.replace(/'/g, "''");
    process.stdout.write(
      `\nINSERT INTO admin_users (email, password_hash, is_active) VALUES ('${safeEmail}', '${hash}', TRUE) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE, updated_at = CURRENT_TIMESTAMP;\n`,
    );
  } finally {
    terminal.close();
  }
}

main().catch((error) => {
  process.stderr.write(`SQL generation failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
