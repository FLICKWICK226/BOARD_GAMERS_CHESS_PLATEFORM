const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxkyfemkwlnwnskpxmcu.supabase.co';
const supabaseKey = 'sb_publishable_KH28Nu8TjLubWCdiE_d4Qw_eyHaQOHo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTester(email, level) {
    console.log(`Creating tester: ${email}...`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'Password123!',
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
