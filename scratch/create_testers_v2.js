import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://jxkyfemkwlnwnskpxmcu.supabase.co';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const testerPassword = process.env.TESTER_PASSWORD;

if (!testerPassword) {
  console.error('ERROR: TESTER_PASSWORD env variable is required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTester(email, level) {
    console.log(`Creating tester: ${email}...`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: testerPassword,
      options: {
        data: { level }
      }
    });

    if (error) {
      console.error(`Error creating ${email}:`, error.message);
    } else {
      console.log(`Created ${email}. ID: ${data.user.id}`);
    }
}

async function run() {
  await createTester('intermediate_tester@chess.com', 'intermediate');
  // Wait 30s before next
  console.log('Waiting 30 seconds to bypass rate limit...');
  setTimeout(async () => {
    await createTester('expert_tester@chess.com', 'expert');
  }, 30000);
}

run();
