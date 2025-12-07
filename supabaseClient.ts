
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// ⚠️ IMPORTANT: REPLACE THESE WITH YOUR SUPABASE PROJECT DETAILS
// ------------------------------------------------------------------
export const SUPABASE_URL = 'https://oixsqvhknpqhjwojmupe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9peHNxdmhrbnBxaGp3b2ptdXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTI5NTMsImV4cCI6MjA4MDA4ODk1M30.lR6LNsuw-NG5duPi53BYuVH_TqFUyfuPtXSLUH4i8vc';

// Set this to your production URL (e.g. 'https://myapp.com') to ensure emails link correctly.
// If left empty, it will default to window.location.origin (which is localhost in dev).
export const SITE_URL = ''; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper to check if Supabase is actually configured
export const isSupabaseConfigured = () => {
  // Simple check to ensure keys are present and not empty
  return SUPABASE_URL && 
         SUPABASE_ANON_KEY && 
         SUPABASE_URL.length > 10 && 
         SUPABASE_ANON_KEY.length > 10 &&
         !SUPABASE_URL.includes('YOUR_SUPABASE_URL');
};
