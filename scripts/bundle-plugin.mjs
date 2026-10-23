#!/usr/bin/env node

// Run from any directory: node /path/to/scripts/bundle-plugin.mjs
import { spawnSync } from 'node:child_process';
import { copyFile, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { remoteConfig } from './configure-mcp.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = path.join(root, 'temp');
const output = path.join(outputDirectory, 'interview-rehearsal.zip');
// Explicit release inputs keep scripts, Git data, and local artifacts out.
const inputs = [
  'plugin.json', '.codex-plugin/plugin.json', 'skills', 'images',
  'README.md', 'LICENSE', 'PRIVACY.md', 'TERMS.md',
  'server/README.md',
];

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd, encoding: 'utf8', env: { ...process.env, ZIPOPT: '', UNZIP: '', UNZIPOPT: '' },
  });
  if (result.error) throw new Error(`Cannot run ${command}: ${result.error.message}`);
  requireCondition(result.status === 0,
    `${command} failed: ${result.stderr || result.stdout || result.signal}`);
  return result.stdout;
}

async function copyInput(relative, destination, inventory) {
  const source = path.join(root, relative);
  const stat = await lstat(source);
  requireCondition(!stat.isSymbolicLink(), `Symlinks cannot be packaged: ${relative}`);
  if (stat.isDirectory()) {
    for (const name of (await readdir(source)).sort()) {
      // Finder metadata, hidden local files, and dependency trees are not assets.
      if (name.startsWith('.') || name === 'node_modules' || name === '__MACOSX') continue;
      await copyInput(`${relative}/${name}`, destination, inventory);
    }
  } else {
    requireCondition(stat.isFile(), `Not a regular file: ${relative}`);
    requireCondition(!/[\r\n]/.test(relative), `Unsupported filename: ${relative}`);
    const target = path.join(destination, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    inventory.push(relative);
  }
}

async function bundle() {
  const manifests = await Promise.all(['plugin.json', '.codex-plugin/plugin.json'].map(
    async (name) => JSON.parse(await readFile(path.join(root, name), 'utf8')),
  ));
  const [portable, compatibility] = manifests;
  requireCondition(portable.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
    'The root manifest must use the Agent Plugins 1.0 schema.');
  requireCondition(portable.name === 'interview-rehearsal', 'Unexpected plugin identity.');
  requireCondition(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(portable.version),
    'The plugin must declare a semantic version.');
  for (const manifest of manifests) {
    requireCondition(manifest.apps == null && manifest.extensions?.['com.openai']?.apps == null,
      'Public uploads cannot contain app bindings; configure required integrations with portable MCP first.');
  }
  for (const key of ['name', 'version', 'description', 'author', 'keywords', 'homepage', 'repository', 'license']) {
    requireCondition(isDeepStrictEqual(portable[key], compatibility[key]), `Manifest mismatch: ${key}`);
  }
  requireCondition(isDeepStrictEqual(portable.extensions?.['com.openai']?.interface, compatibility.interface),
    'Manifest interface metadata must be synchronized.');
  requireCondition(isDeepStrictEqual(portable.extensions?.['com.openai']?.review,
    compatibility.extensions?.['com.openai']?.review)
    && isDeepStrictEqual(portable.extensions?.['com.openai']?.publication,
      compatibility.extensions?.['com.openai']?.publication),
  'Manifest review and publication metadata must be synchronized.');

  await mkdir(outputDirectory, { recursive: true });
  const staging = await mkdtemp(path.join(outputDirectory, '.bundle-'));
  try {
    const packageDirectory = path.join(staging, portable.name);
    const inventory = [];
    for (const input of inputs) await copyInput(input, packageDirectory, inventory);
    requireCondition(inventory.includes('skills/mock-interview/SKILL.md'), 'Missing mock-interview skill.');
    const listing = portable.extensions['com.openai'].interface;
    for (const key of ['logo', 'composerIcon', 'logoDark', 'composerIconDark']) {
      if (listing[key] === undefined) continue;
      requireCondition(typeof listing[key] === 'string', `Invalid icon path: ${key}`);
      const relative = path.posix.normalize(listing[key]);
      requireCondition(!path.posix.isAbsolute(relative) && inventory.includes(relative),
        `Icon is missing or outside the package: ${listing[key]}`);
    }
    // Optional portable integrations are included rather than silently dropped.
    try {
      await lstat(path.join(root, 'mcp.json'));
      const config = JSON.parse(await readFile(path.join(root, 'mcp.json'), 'utf8'));
      const endpoint = config.mcpServers?.['interview-workspace']?.url;
      requireCondition(endpoint && isDeepStrictEqual(config, remoteConfig(endpoint)),
        'mcp.json must contain the verified HTTPS interview-workspace configuration without credentials.');
      await copyInput('mcp.json', packageDirectory, inventory);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      console.log('No production mcp.json configured: building the conversational fallback package.');
    }
    const archive = path.join(staging, 'interview-rehearsal.zip');
    run('zip', ['-q', '-X', '-r', archive, portable.name], staging);
    run('unzip', ['-t', archive], staging);
    const actual = run('unzip', ['-Z1', archive], staging).trim().split('\n')
      .filter((entry) => !entry.endsWith('/')).sort();
    const expected = inventory.map((entry) => `${portable.name}/${entry}`).sort();
    requireCondition(isDeepStrictEqual(actual, expected), 'ZIP inventory differs from release inputs.');
    for (const [index, name] of ['plugin.json', '.codex-plugin/plugin.json'].entries()) {
      const packed = JSON.parse(run('unzip', ['-p', archive, `${portable.name}/${name}`], staging));
      requireCondition(isDeepStrictEqual(packed, manifests[index]), `ZIP manifest changed: ${name}`);
    }
    // Replace the previous archive only after the new archive passes inspection.
    await rename(archive, output);
    console.log(`Created ${output} (${inventory.length} files, version ${portable.version}).`);
    console.log('Archive integrity checked. Public listing URLs and host behavior are not verified by this script.');
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

bundle().catch((error) => {
  console.error(`Bundle failed: ${error.message}`);
  process.exitCode = 1;
});
