const os = require('os');
const fs = require('fs');
const path = require('path');

const platform = os.platform(); // 'darwin' for macOS, 'linux' for Linux
const targetDir = platform === 'darwin' ? 'node_modules_mac' : 'node_modules_linux';

const baseDir = path.resolve(__dirname, '..');
const symlinkPath = path.join(baseDir, 'node_modules');
const targetPath = path.join(baseDir, targetDir);

// Create the target directory if it doesn't exist
if (!fs.existsSync(targetPath)) {
  fs.mkdirSync(targetPath);
}

// Check if node_modules exists and is not a symlink
if (fs.existsSync(symlinkPath) && !fs.lstatSync(symlinkPath).isSymbolicLink()) {
  console.log(`⚠️ A pasta "node_modules" atual é um diretório comum e não um atalho (symlink).`);
  console.log(`⏳ Movendo "node_modules" para "${targetDir}" para preservar os pacotes atuais...`);
  fs.renameSync(symlinkPath, targetPath);
}

// Update the symlink
try {
  if (fs.existsSync(symlinkPath)) {
    const currentTarget = fs.readlinkSync(symlinkPath);
    // If it's already pointing to the right place, do nothing
    if (currentTarget === targetDir) {
      process.exit(0);
    }
    fs.unlinkSync(symlinkPath);
  }
  
  // Create a relative symlink
  fs.symlinkSync(targetDir, symlinkPath, 'dir');
  console.log(`✅ Ambiente configurado para ${platform} (usando ${targetDir})`);
} catch (err) {
  console.error("❌ Erro ao trocar a pasta node_modules:", err.message);
}
