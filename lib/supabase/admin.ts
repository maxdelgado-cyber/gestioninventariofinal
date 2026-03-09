/**
 * Supabase Admin Client — uses the SERVICE_ROLE_KEY to bypass Row Level Security.
 * IMPORTANT: This client should ONLY be used in server-side code (API routes, Server Actions).
 * For a single-admin app like Allegra, it is acceptable to use this pattern since
 * the app sits behind a password-protected login page with no public access.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Singleton pattern — one admin client instance
let adminClient: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
    if (!adminClient) {
        adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return adminClient;
}
