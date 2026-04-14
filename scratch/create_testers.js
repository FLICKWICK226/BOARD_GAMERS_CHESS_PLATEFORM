import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://jxkyfemkwlnwnskpxmcu.supabase.co';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const testerPassword = process.env.TESTER_PASSWORD;

if (!testerPassword) {
  console.error('ERROR: TESTER_PASSWORD env variable is required. Run: TESTER_PASSWORD=... node scratch/create_testers.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testers = [
  { email: 'beginner_tester@chess.com', level: 'beginner' },
  { email: 'intermediate_tester@chess.com', level: 'intermediate' },
  { email: 'expert_tester@chess.com', level: 'expert' }
];

async function createTesters() {
  for (const tester of testers) {
    console.log(`Creating tester: ${tester.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: tester.email,
      password: testerPassword,
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
