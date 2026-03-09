import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function generateAdminUser() {
    console.log('Creating admin user admin@allegra.com...');

    const { data, error } = await supabase.auth.admin.createUser({
        email: 'admin@allegra.com',
        password: 'allegra2026',
        email_confirm: true,
    });

    if (error) {
        if (error.message.includes('User already registered') || error.message.includes('already exists')) {
            console.log('✅ Admin user already exists.');
        } else {
            console.error('❌ Failed to create admin user:', error.message);
        }
    } else {
        console.log('✅ Admin user created successfully:', data.user.id);
    }
}

generateAdminUser().catch(console.error);
