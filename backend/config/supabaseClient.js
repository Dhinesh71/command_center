const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://sfjxvfkloumldltihjvr.supabase.co';
// Fallback is Anon key. For admin, process.env.SUPABASE_KEY should be set to service_role.
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmanh2Zmtsb3VtbGRsdGloanZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODMwMDIsImV4cCI6MjA4MTE1OTAwMn0.your_placeholder_key';

if (!process.env.SUPABASE_KEY) {
    console.warn('⚠️  SUPABASE_KEY env var not found. Using fallback ANON key. Writes might fail if RLS is on.');
} else {
    console.log('✅ Using provided SUPABASE_KEY from environment.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
