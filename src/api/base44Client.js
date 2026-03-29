import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 1. Create the official Supabase client
export const supabase = createClient(url, key);

// 2. Create the "Bridge" so old code still works
export const base44 = supabase;

console.log("Supabase URL:", url); // This should show your URL in the browser console
console.log("Supabase Key:", key); // This should show your key in the browser console
