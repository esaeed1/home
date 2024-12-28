import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ymyztsxdqmiklnsjurhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteXp0c3hkcW1pa2xuc2p1cmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNDA3MzQsImV4cCI6MjA0OTgxNjczNH0.dGJ9LjCTGvGzUrSQfln_nxiIrxXNBy57Z98b8G7yZqk';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchItems() {
    try {
        // Fetch items from Supabase and sort by quantity (descending)
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('quantity', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return;
        }
        console.log('Fetched and sorted items:', data);

        const itemGrid = document.getElementById('item-grid');
        itemGrid.innerHTML = ''; // Clear current items

        // Dynamically create item cards
        data.forEach(item => {
            const itemCard = document.createElement('a'); // Anchor tag for the whole card
            itemCard.href = item.link; // Link to Home Depot
            itemCard.target = "_blank"; // Open in a new tab
            itemCard.className = 'item-card';
            itemCard.innerHTML = `
                <div class="item-id">${item.id}</div>
                <img src="${item.img}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>UPC: ${item.upc}</p>
                <p>Quantity: ${item.quantity}</p>
                ${item.notes ? `<p class="item-notes">Notes: ${item.notes}</p>` : ''}
            `;
            itemGrid.appendChild(itemCard);
        });
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

// Call fetchItems when the page loads to display the current items
document.addEventListener('DOMContentLoaded', fetchItems);
