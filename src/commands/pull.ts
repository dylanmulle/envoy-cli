import { writeFile } from 'fs/promises';
import { join } from 'path';
import { loadStore } from '../storage/fileStorage';
import { decryptEnvFile } from '../crypto/encryption';
import { loadConfig } from '../config/envoyConfig';

interface PullOptions {
  env: string;
  passphrase: string;
  output?: string;
  storeDir?: string;
}

export async function pullCommand(options: PullOptions): Promise<void> {
  const { env, passphrase } = options;
  const cwd = options.storeDir ?? process.cwd();

  const config = await loadConfig(cwd);
  const store = await loadStore(cwd);

  const entry = store.entries[env];
  if (!entry) {
    throw new Error(`No stored env found for environment: "${env}". Did you push it first?`);
  }

  let decrypted: string;
  try {
    decrypted = await decryptEnvFile(entry.ciphertext, entry.iv, entry.salt, passphrase);
  } catch {
    throw new Error(`Failed to decrypt env for "${env}". Check your passphrase.`);
  }

  const outputPath = options.output ?? join(cwd, env === 'development' ? '.env' : `.env.${env}`);
  await writeFile(outputPath, decrypted, 'utf-8');

  console.log(`✔ Pulled "${env}" env to ${outputPath}`);
}

export default pullCommand;
