import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(projectRoot, ".env");

async function run() {
  const args = process.argv.slice(2);
  const emailArg = args[0]?.trim();
  const passwordArg = args[1]?.trim();
  const phoneArg = args[2]?.trim();

  let envContent = "";
  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }
  } catch (err) {
    console.error("Gagal membaca .env:", err.message);
  }

  function updateEnvKey(content, key, value) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;
    if (regex.test(content)) {
      return content.replace(regex, line);
    }
    return content ? `${content.trim()}\n${line}\n` : `${line}\n`;
  }

  if (emailArg && passwordArg) {
    if (passwordArg.length < 16) {
      console.error("Error: Password admin minimal 16 karakter!");
      process.exit(1);
    }

    envContent = updateEnvKey(envContent, "ADMIN_EMAIL", emailArg);
    envContent = updateEnvKey(envContent, "ADMIN_PASSWORD", passwordArg);
    if (phoneArg) {
      envContent = updateEnvKey(envContent, "ADMIN_PHONE", phoneArg);
    }

    fs.writeFileSync(envPath, envContent, "utf8");
    console.log(" Berhasil memperbarui kredensial admin di .env!");
  }

  const {
    hasConfiguredAdminCredentials,
    verifyAdminCredentials,
    adminIdentifiers,
    getAdminEmail,
    getAdminPassword,
  } = await import("../server/auth.js");

  console.log("\n=== STATUS KREDENSIAL ADMIN ===");
  console.log("File .env:", envPath);
  console.log("Admin Email:", getAdminEmail());
  console.log("Admin Password Length:", getAdminPassword().length, "karakter");
  console.log("Admin Identifiers Terdaftar:", adminIdentifiers());
  console.log("hasConfiguredAdminCredentials():", hasConfiguredAdminCredentials());

  const currentEmail = getAdminEmail() || "admin@gmail.com";
  const currentPassword = getAdminPassword();

  if (currentPassword) {
    const testDirect = verifyAdminCredentials(currentEmail, currentPassword);
    const testAdminGmail = verifyAdminCredentials("admin@gmail.com", currentPassword);
    const testAdminUsername = verifyAdminCredentials("ADMIN", currentPassword);

    console.log(`Test Login (${currentEmail}):`, testDirect ? " BERHASIL" : "❌ GAGAL");
    console.log("Test Login (admin@gmail.com):", testAdminGmail ? " BERHASIL" : "❌ GAGAL");
    console.log("Test Login (username ADMIN):", testAdminUsername ? " BERHASIL" : "❌ GAGAL");
  } else {
    console.warn("⚠️  ADMIN_PASSWORD belum diatur di .env!");
  }
  console.log("================================\n");
}

run().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
