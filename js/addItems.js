import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ymyztsxdqmiklnsjurhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteXp0c3hkcW1pa2xuc2p1cmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNDA3MzQsImV4cCI6MjA0OTgxNjczNH0.dGJ9LjCTGvGzUrSQfln_nxiIrxXNBy57Z98b8G7yZqk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to fetch and display items from Supabase
async function fetchItems() {
    console.log("Fetching items...");
    try {
        const { data, error } = await supabase.from('items').select('*');
        if (error) {
            console.error('Supabase error:', error);
            return;
        }
        console.log('Fetched items:', data);
        const container = document.getElementById('admin-items');
        container.innerHTML = ''; // Clear existing items

        data.forEach(item => {
            const div = document.createElement('div');
            div.innerHTML = `
                <img src="${item.img}" alt="${item.name}" style="max-width: 100px;">
                <p><strong><a href="${item.link}" target="_blank">${item.name}</a></strong></p>
                <p>UPC: ${item.upc}</p>
                <p>Quantity: <input type="number" value="${item.quantity}" onchange="updateQuantity(${item.id}, this.value)"></p>
                <button onclick="deleteItem(${item.id})">Delete Item</button>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

// Function to add a new item to Supabase
async function addItem() {
    console.log("addItem function called");

    const upc = document.getElementById('upc').value;
    const quantity = document.getElementById('quantity').value;

    if (!upc || !quantity) {
        alert('Please enter UPC code and quantity.');
        return;
    }

    // Fetch item data based on UPC
    const itemData = await getItemData(upc);
    console.log("Item data fetched:", itemData);

    // Save to Supabase
    try {
        const { data, error } = await supabase
            .from('items')
            .insert([
                {
                    name: itemData.name,
                    upc: upc,
                    quantity: parseInt(quantity, 10),
                    img: itemData.img,
                    link: itemData.link
                }
            ]);

        if (error) {
            console.error('Error adding item:', error);
        } else {
            alert('Item added successfully');
            fetchItems(); // Refresh items list after adding
        }
    } catch (error) {
        console.error("Error adding to Supabase:", error);
    }
}

// Function to fetch item data using the UPC (example placeholder)
async function getItemData(upc) {
    const url = `https://www.homedepot.com/s/${upc}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const metaTag = doc.querySelector('meta[property="og:title"]');
        const titleTag = doc.querySelector('title');
        const title = metaTag ? metaTag.getAttribute('content') : titleTag ? titleTag.textContent.trim() : 'Title not found';
        const imgTag = doc.querySelector('img');
        const img = imgTag ? imgTag.getAttribute('src') : null;

        return {
            name: title,
            img: img,
            link: url
        };
    } catch (error) {
        console.error('Error fetching item data:', error);
        return { name: 'Error fetching data', img: null, link: url };
    }
}

// Function to update item quantity in Supabase
async function updateQuantity(itemId, newQuantity) {
    console.log(`Updating quantity for item ID: ${itemId}`);
    try {
        const { data, error } = await supabase
            .from('items')
            .update({ quantity: parseInt(newQuantity, 10) })
            .eq('id', itemId);

        if (error) {
            console.error('Error updating quantity:', error);
        } else {
            alert('Quantity updated');
        }
    } catch (error) {
        console.error("Error updating quantity:", error);
    }
}

// Function to delete an item from Supabase
async function deleteItem(itemId) {
    console.log(`Deleting item with ID: ${itemId}`);
    try {
        const { data, error } = await supabase
            .from('items')
            .delete()
            .eq('id', itemId);

        if (error) {
            console.error('Error deleting item:', error);
        } else {
            alert('Item deleted');
            fetchItems(); // Refresh items list after deletion
        }
    } catch (error) {
        console.error("Error deleting item:", error);
    }
}

// Function to download items as JSON (optional feature)
function downloadItems() {
    const items = loadFromCookies(); // Replace with actual logic
    const jsonData = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'items.json';
    link.click();
}

// Load items on page load
window.onload = function() {
    // Initialize addItem button click event listener
    document.getElementById('add-item-btn').addEventListener('click', addItem);

    // Fetch the items from Supabase
    fetchItems();
}
