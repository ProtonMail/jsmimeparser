import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const testFilesToInclude = ['test/test_*.{js,ts}'];

// Serve the test fixtures verbatim (no Vite transforms): files under `publicDir`
// are served as-is at the server root, so `fetch('/<name>')` returns the raw bytes.
const publicDir = fileURLToPath(new URL('./data', import.meta.url));

export default defineConfig({
    publicDir,
    test: {
        globals: true,
        include: testFilesToInclude,
        testTimeout: 30000,
        browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            screenshotFailures: false,
            instances: [
                { browser: 'chromium' },
                { browser: 'firefox' },
                { browser: 'webkit' }
            ]
        }
    }
});
