// Import the Supabase client
import { createClient } from '@supabase/supabase-js';

// Initialize the client with your Supabase URL and Key
const supabaseUrl = 'https://ymyztsxdqmiklnsjurhq.supabase.co';
const supabaseKey =  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteXp0c3hkcW1pa2xuc2p1cmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNDA3MzQsImV4cCI6MjA0OTgxNjczNH0.dGJ9LjCTGvGzUrSQfln_nxiIrxXNBy57Z98b8G7yZqk';
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch items from Supabase
async function fetchItems() {
    try {
        const { data, error } = await supabase
            .from('items')
            .select('*');

        if (error) {
            throw new Error(error.message);
        }

        return data;
    } catch (err) {
        console.error('Error fetching items:', err);
        return { error: err.message };
    }
}

export { fetchItems };
