const { execSync } = require('child_process');

// Downgrade tailwindcss to v3 (this project uses v3 conventions: tailwind.config.js, @tailwind base, border-border, etc.)
// Install all other missing dependencies too
const packages = [
  // Tailwind v3 ecosystem
  'tailwindcss@3',
  'autoprefixer',
  'tailwindcss-animate',

  // UI & icons
  'lucide-react',
  'react-router-dom',
  'sonner',
  'date-fns',
  'recharts',
  'clsx',
  'tailwind-merge',
  'class-variance-authority',
  'cmdk',
  'vaul',
  'react-day-picker',
  'input-otp',
  'react-resizable-panels',

  // TanStack
  '@tanstack/react-query',

  // Radix UI
  '@radix-ui/react-accordion',
  '@radix-ui/react-alert-dialog',
  '@radix-ui/react-aspect-ratio',
  '@radix-ui/react-avatar',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-label',
  '@radix-ui/react-menubar',
  '@radix-ui/react-navigation-menu',
  '@radix-ui/react-popover',
  '@radix-ui/react-progress',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-select',
  '@radix-ui/react-separator',
  '@radix-ui/react-slider',
  '@radix-ui/react-slot',
  '@radix-ui/react-switch',
  '@radix-ui/react-tabs',
  '@radix-ui/react-toggle',
  '@radix-ui/react-toggle-group',
  '@radix-ui/react-toast',
  '@radix-ui/react-tooltip',
];

console.log(`\nInstalling ${packages.length} packages (this may take a few minutes)...\n`);

try {
  execSync('npm install ' + packages.join(' '), {
    stdio: 'inherit',
    cwd: __dirname,
  });
  console.log('\n✅ All packages installed successfully!');
} catch (err) {
  console.error('\n❌ Install failed:', err.message);
  process.exit(1);
}
