import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const packageName = pkg.name;
const currentVersion = pkg.version;

try {
  const publishedVersion = execSync(`npm view ${packageName} version`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  if (currentVersion <= publishedVersion) {
    console.error(`Version ${currentVersion} is not greater than published ${publishedVersion}`);
    process.exit(1);
  }
  console.log(`Version ${currentVersion} is greater than published ${publishedVersion}`);
} catch (e) {
  console.log('Package not published yet or error checking version');
}