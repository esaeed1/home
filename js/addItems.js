import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ymyztsxdqmiklnsjurhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteXp0c3hkcW1pa2xuc2p1cmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNDA3MzQsImV4cCI6MjA0OTgxNjczNH0.dGJ9LjCTGvGzUrSQfln_nxiIrxXNBy57Z98b8G7yZqk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to fetch and display items from Supabase
async function fetchItems() {
    try {
        const { data, error } = await supabase.from('items').select('*');
        if (error) {
            console.error('Supabase error:', error);
            return;
        }

        // Sort items by quantity in descending order
        const sortedData = data.sort((a, b) => b.quantity - a.quantity);

        const itemGrid = document.getElementById('item-grid');
        itemGrid.innerHTML = '';

        sortedData.forEach(item => {
            const itemCard = document.createElement('a');
            itemCard.href = item.link;
            itemCard.target = '_blank';
            itemCard.className = 'item-card';
            itemCard.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>UPC: ${item.upc}</p>
                <p>Quantity: ${item.quantity}</p>
            `;
            itemGrid.appendChild(itemCard);
        });
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

document.addEventListener('DOMContentLoaded', fetchItems);
