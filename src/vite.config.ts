import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Synchronous public assets cloning at startup
try {
  const srcImagesDir = path.resolve(__dirname, 'src/assets/images');
  const publicImagesDir = path.resolve(__dirname, 'public/assets/images');

  if (fs.existsSync(srcImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
    const files = fs.readdirSync(srcImagesDir);
    for (const file of files) {
      const srcFile = path.join(srcImagesDir, file);
      const destFile = path.join(publicImagesDir, file);
      if (fs.lstatSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
    console.log(`[Asset Setup] Successfully cloned ${files.length} static assets from src/assets/images to public/assets/images`);
  }
} catch (err) {
  console.error('[Asset Setup] Error copying runtime case images:', err);
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
