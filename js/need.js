// Initialize Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ymyztsxdqmiklnsjurhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteXp0c3hkcW1pa2xuc2p1cmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNDA3MzQsImV4cCI6MjA0OTgxNjczNH0.dGJ9LjCTGvGzUrSQfln_nxiIrxXNBy57Z98b8G7yZqk';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make deleteItem function globally available
window.deleteItem = async function(id) {
    console.log('Attempting to delete item:', id);
    
    if (!confirm('Are you sure you want to remove this item?')) {
        console.log('Delete cancelled by user');
        return;
    }

    try {
        showLoading();
        console.log('Updating item in database...');
        
        const { error } = await supabase
            .from('items')
            .update({ tags: null })
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Remove item from display
        const itemElement = document.querySelector(`.shopping-item[data-id="${id}"]`);
        if (itemElement) {
            itemElement.remove();
            console.log('Item removed from display');
        } else {
            console.warn('Item element not found in DOM');
        }
        
        showToast('Item removed successfully');
    } catch (error) {
        console.error('Error removing item:', error);
        showToast('Error removing item: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// Show loading spinner
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'success') {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        className: `toast-${type}`,
    }).showToast();
}

// Load existing items with "Need" tag
async function loadNeededItems() {
    try {
        showLoading();
        console.log('Fetching items from database...');
        
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('tags', 'Need');

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Fetched items:', data);

        // Sort items by quantity in descending order
        const sortedData = data.sort((a, b) => b.quantity - a.quantity);

        const shoppingList = document.getElementById('shoppingList');
        if (!shoppingList) {
            console.error('Shopping list element not found!');
            return;
        }
        
        shoppingList.innerHTML = ''; // Clear existing items

        if (sortedData.length === 0) {
            console.log('No items found with Need tag');
            shoppingList.innerHTML = '<p>No items in your shopping list yet.</p>';
            return;
        }

        sortedData.forEach(item => {
            addItemToDisplay(item);
        });

        console.log('Successfully loaded and displayed items');
    } catch (error) {
        console.error('Error loading items:', error);
        showToast('Error loading items: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Add item to display
function addItemToDisplay(item) {
    console.log('Adding item to display:', item);
    
    const shoppingList = document.getElementById('shoppingList');
    if (!shoppingList) {
        console.error('Shopping list element not found!');
        return;
    }

    const shoppingItem = document.createElement('div');
    shoppingItem.className = 'shopping-item';
    shoppingItem.dataset.id = item.id;

    shoppingItem.innerHTML = `
        <div class="item-details">
            <p><strong>Name:</strong> ${item.name}</p>
            <p><strong>Quantity:</strong> ${item.quantity}</p>
            ${item.notes ? `<p><strong>Notes:</strong><br>${item.notes.replace(/\n/g, '<br>')}</p>` : ''}
            <button class="delete-btn" onclick="deleteItem(${item.id})">Remove Item</button>
        </div>
    `;

    shoppingList.appendChild(shoppingItem);
    console.log('Item added to display successfully');
}

// Handle form submission
document.getElementById('shoppingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Form submitted');
    
    const itemName = document.getElementById('itemName').value;
    const dimensions = document.getElementById('dimensions').value;
    const quantity = document.getElementById('quantity').value;
    const notes = document.getElementById('notes').value;

    if (!itemName || !quantity) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    console.log('Form data:', { itemName, dimensions, quantity, notes });

    try {
        showLoading();
        console.log('Inserting item into database...');
        
        const { data, error } = await supabase
            .from('items')
            .insert([
                {
                    name: itemName,
                    quantity: parseInt(quantity),
                    notes: notes + (dimensions ? `\nDimensions: ${dimensions}` : ''),
                    tags: 'Need',
                    // Default values for required fields
                    upc: 0,
                    img: '',
                    link: ''
                }
            ])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Item added to database:', data[0]);
        addItemToDisplay(data[0]);
        showToast('Item added successfully');
        this.reset();
    } catch (error) {
        console.error('Error adding item:', error);
        showToast('Error adding item: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Load items when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');
    loadNeededItems();
}); 