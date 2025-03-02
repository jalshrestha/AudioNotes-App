import { createClient } from '@supabase/supabase-js';

// Replace these values with the ones from your new Supabase project
// You can find these in Project Settings > API in your Supabase dashboard
const supabaseUrl = 'https://rdehqrluaghypfobtxgx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZWhxcmx1YWdoeXBmb2J0eGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzA3NDEsImV4cCI6MjA1NjUwNjc0MX0.poH6rX69SrgnEGw7TGFv8NU7_0TZIAgjpwsJChDeC7M';

// If you're seeing database connection errors, make sure to:
// 1. Replace the URL and key above with your own project's values
// 2. Run the SQL script to create the notes table in your Supabase project

export const supabase = createClient(supabaseUrl, supabaseAnonKey);