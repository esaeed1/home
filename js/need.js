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

// Load existing items with UPC=0
async function loadNeededItems(filterTag = null) {
    try {
        showLoading();
        console.log('Fetching items from database...');
        
        let query = supabase
            .from('items')
            .select('*')
            .eq('upc', 0);

        if (filterTag) {
            // Filter items where tags string contains the filter tag
            query = query.filter('tags', 'ilike', `%${filterTag}%`);
        }

        const { data, error } = await query;

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
            console.log('No items found with UPC=0');
            shoppingList.innerHTML = '<p>No items in your shopping list yet.</p>';
            return;
        }

        // Update tag buttons based on available tags
        updateTagButtons(sortedData);

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

// Update tag buttons based on available tags
function updateTagButtons(items) {
    const tagButtons = document.getElementById('tagButtons');
    if (!tagButtons) return;

    // Collect all unique tags
    const uniqueTags = new Set();
    items.forEach(item => {
        if (item.tags) {
            // Split the comma-separated string into individual tags
            const tags = item.tags.split(',').map(tag => tag.trim());
            tags.forEach(tag => uniqueTags.add(tag));
        }
    });

    // Create buttons for each tag
    const buttons = Array.from(uniqueTags).map(tag => {
        return `<button onclick="filterByTag('${tag}')" class="filter-btn" data-tag="${tag}">${tag}</button>`;
    }).join('');

    tagButtons.innerHTML = buttons;
}

// Filter tag buttons based on search input
function filterTagButtons() {
    const searchInput = document.getElementById('tagSearch');
    const searchTerm = searchInput.value.toLowerCase();
    const buttons = document.querySelectorAll('.tag-buttons .filter-btn');

    buttons.forEach(button => {
        const tag = button.dataset.tag.toLowerCase();
        button.style.display = tag.includes(searchTerm) ? '' : 'none';
    });
}

// Add tag filter functionality
function filterByTag(tag) {
    // Update active state of buttons
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (btn.dataset.tag === tag) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // If "All Items" is clicked, remove active state from all buttons
    if (!tag) {
        buttons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filter-btn[onclick="loadNeededItems()"]').classList.add('active');
    }

    loadNeededItems(tag);
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

    // Display tags from comma-separated string
    const tagsDisplay = item.tags ? item.tags : '';

    shoppingItem.innerHTML = `
        <div class="item-details">
            <p><strong>Name:</strong> ${item.name}</p>
            <p><strong>Quantity:</strong> ${item.quantity}</p>
            ${tagsDisplay ? `<p><strong>Tags:</strong> ${tagsDisplay}</p>` : ''}
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
    const tagsInput = document.getElementById('tags').value;

    if (!itemName || !quantity) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Process tags - keep as comma-separated string
    const tags = tagsInput ? tagsInput.trim() : '';

    console.log('Form data:', { itemName, dimensions, quantity, notes, tags });

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
                    tags: tags,
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