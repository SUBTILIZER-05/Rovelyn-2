import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bljijobkbaqyuvfkfbol.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WFEdr3TCfT5UvvAEZo3Xiw_y5lu1sco';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
