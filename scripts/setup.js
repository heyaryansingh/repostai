#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  console.log('\n');
  log('========================================', 'cyan');
  log('       RepostAI Setup Wizard           ', 'bright');
  log('========================================', 'cyan');
  console.log('\n');

  log('This wizard will help you set up your RepostAI instance.', 'yellow');
  console.log('\nYou will need FREE accounts at:');
  log('  1. Supabase    - https://supabase.com', 'blue');
  log('  2. Stripe      - https://stripe.com', 'blue');
  log('  3. OpenAI      - https://platform.openai.com', 'blue');
  log('  4. Vercel      - https://vercel.com (for deployment)', 'blue');
  console.log('\n');

  const proceed = await question('Ready to continue? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    log('\nSetup cancelled.', 'yellow');
    process.exit(0);
  }

  console.log('\n');
  log('Step 1: Supabase Configuration', 'green');
  log('--------------------------------', 'green');
  console.log('Go to your Supabase project settings > API\n');

  const supabaseUrl = await question('Supabase URL (https://xxx.supabase.co): ');
  const supabaseAnonKey = await question('Supabase Anon Key: ');
  const supabaseServiceKey = await question('Supabase Service Role Key: ');

  console.log('\n');
  log('Step 2: Stripe Configuration', 'green');
  log('--------------------------------', 'green');
  console.log('Go to Stripe Dashboard > Developers > API Keys\n');

  const stripeSecretKey = await question('Stripe Secret Key (sk_test_...): ');
  const stripePublishableKey = await question('Stripe Publishable Key (pk_test_...): ');

  console.log('\n');
  log('Step 3: OpenAI Configuration', 'green');
  log('--------------------------------', 'green');
  console.log('Go to platform.openai.com > API Keys\n');

  const openaiApiKey = await question('OpenAI API Key (sk-...): ');

  // Create .env.local file
  const envContent = `# Supabase
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Stripe
STRIPE_SECRET_KEY=${stripeSecretKey}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${stripePublishableKey}
STRIPE_WEBHOOK_SECRET=whsec_placeholder_update_after_deployment

# Stripe Price IDs (create products at stripe.com/dashboard/products)
STRIPE_STARTER_PRICE_ID=price_starter_placeholder
STRIPE_PRO_PRICE_ID=price_pro_placeholder
STRIPE_SCALE_PRICE_ID=price_scale_placeholder

# OpenAI
OPENAI_API_KEY=${openaiApiKey}

# App URL (update after deployment)
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

  fs.writeFileSync('.env.local', envContent);

  console.log('\n');
  log('✓ Created .env.local', 'green');

  console.log('\n');
  log('Step 4: Installing Dependencies', 'green');
  log('--------------------------------', 'green');

  try {
    execSync('npm install', { stdio: 'inherit' });
    log('✓ Dependencies installed', 'green');
  } catch (error) {
    log('✗ Failed to install dependencies', 'yellow');
    console.log('Run "npm install" manually');
  }

  console.log('\n');
  log('========================================', 'cyan');
  log('           Setup Complete!              ', 'bright');
  log('========================================', 'cyan');

  console.log('\n');
  log('Next Steps:', 'yellow');
  console.log(`
  1. Set up Supabase Database:
     - Go to Supabase Dashboard > SQL Editor
     - Copy contents of supabase/migrations/001_initial_schema.sql
     - Paste and run the SQL

  2. Create Stripe Products:
     - Go to stripe.com/dashboard/products
     - Create 3 products: Starter ($19), Pro ($49), Scale ($99)
     - Copy each Price ID and update .env.local

  3. Test Locally:
     npm run dev
     Visit http://localhost:3000

  4. Deploy to Vercel:
     npx vercel
     - Add all environment variables in Vercel dashboard
     - Update NEXT_PUBLIC_APP_URL to your Vercel URL

  5. Set up Stripe Webhook:
     - Go to stripe.com/dashboard/webhooks
     - Add endpoint: https://your-domain.vercel.app/api/webhooks/stripe
     - Select events: checkout.session.completed,
       customer.subscription.updated, customer.subscription.deleted
     - Copy webhook secret to STRIPE_WEBHOOK_SECRET in Vercel
`);

  log('Your SaaS is ready! 🚀', 'green');
  console.log('\n');

  rl.close();
}

main().catch((error) => {
  console.error('Setup error:', error);
  rl.close();
  process.exit(1);
});
