const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxkyfemkwlnwnskpxmcu.supabase.co';
const supabaseKey = 'sb_publishable_KH28Nu8TjLubWCdiE_d4Qw_eyHaQOHo';
const supabase = createClient(supabaseUrl, supabaseKey);

const testers = [
  { email: 'beginner_tester@chess.com', password: 'Password123!', level: 'beginner' },
  { email: 'intermediate_tester@chess.com', password: 'Password123!', level: 'intermediate' },
  { email: 'expert_tester@chess.com', password: 'Password123!', level: 'expert' }
];

async function createTesters() {
  for (const tester of testers) {
    console.log(`Creating tester: ${tester.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: tester.email,
      password: tester.password,
      options: {
        data: {
          level: tester.level
        }
      }
    });

    if (error) {
      console.error(`Error creating ${tester.email}:`, error.message);
    } else {
      console.log(`Created ${tester.email}. ID: ${data.user.id}`);
    }
  }
}

createTesters();
