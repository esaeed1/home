// Initialize Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ymyztsxdqmiklnsjurhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteXp0c3hkcW1pa2xuc2p1cmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNDA3MzQsImV4cCI6MjA0OTgxNjczNH0.dGJ9LjCTGvGzUrSQfln_nxiIrxXNBy57Z98b8G7yZqk';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allItems = [];

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
        // Refresh the items list
        fetchItems();
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

// Fetch and display items
async function fetchItems() {
    try {
        showLoading();
        console.log('Fetching items from database...');
        
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('upc', 0);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Fetched items:', data);
        allItems = data;
        displayItems(data);
        populateTags(data);
    } catch (error) {
        console.error('Error loading items:', error);
        showToast('Error loading items: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Display items
function displayItems(items) {
    const shoppingList = document.getElementById('shoppingList');
    if (!shoppingList) {
        console.error('Shopping list element not found!');
        return;
    }
    
    shoppingList.innerHTML = ''; // Clear existing items

    if (items.length === 0) {
        shoppingList.innerHTML = '<p>No items match your current filters.</p>';
        return;
    }

    // Sort items by quantity in descending order
    items.sort((a, b) => b.quantity - a.quantity);

    items.forEach(item => {
        const shoppingItem = document.createElement('div');
        shoppingItem.className = 'shopping-item';
        shoppingItem.dataset.id = item.id;

        // Determine priority based on quantity
        if (item.quantity >= 5) {
            shoppingItem.classList.add('high-priority');
        } else if (item.quantity >= 3) {
            shoppingItem.classList.add('medium-priority');
        }

        // Filter out "Need" from tags display
        const tagsDisplay = item.tags 
            ? item.tags.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.toLowerCase() !== 'need')
                .join(', ')
            : '';

        shoppingItem.innerHTML = `
            <div class="item-details">
                <div class="item-header">
                    <div class="item-name">${item.name}</div>
                    <div class="quantity-badge">${item.quantity}</div>
                </div>
                ${tagsDisplay ? `
                    <div class="item-tags">
                        ${tagsDisplay.split(',').map(tag => `
                            <span class="item-tag">${tag.trim()}</span>
                        `).join('')}
                    </div>
                ` : ''}
                ${item.notes ? `
                    <div class="item-notes">
                        ${item.notes.replace(/\n/g, '<br>')}
                    </div>
                ` : ''}
                <button class="delete-btn" onclick="deleteItem(${item.id})">Remove Item</button>
            </div>
        `;

        shoppingList.appendChild(shoppingItem);
    });
}

// Populate tag filters
function populateTags(items) {
    const uniqueTags = new Set();
    items.forEach(item => {
        if (item.tags) {
            item.tags.split(',').forEach(tag => {
                const trimmedTag = tag.trim();
                // Don't add "Need" tag to the filter options
                if (trimmedTag.toLowerCase() !== 'need') {
                    uniqueTags.add(trimmedTag);
                }
            });
        }
    });

    const tagFilterContent = document.getElementById('tag-filter-content');
    tagFilterContent.innerHTML = ''; // Clear current filter content

    uniqueTags.forEach(tag => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'tag-checkbox-container';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = tag;
        checkbox.className = 'tag-checkbox';
        checkbox.onclick = () => filterItemsByTags();

        const label = document.createElement('label');
        label.setAttribute('for', tag);
        label.textContent = tag;

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        tagFilterContent.appendChild(checkboxContainer);
    });
}

// Filter items by selected tags and quantity
function filterItemsByTags() {
    const selectedTags = [];
    const checkboxes = document.querySelectorAll('.tag-checkbox');
    const quantityFilter = document.getElementById('quantityFilter').value;

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedTags.push(checkbox.id);
        }
    });

    let filteredItems = allItems;

    // Apply tag filtering
    if (selectedTags.length > 0) {
        filteredItems = filteredItems.filter(item => {
            if (!item.tags) return false;
            const itemTags = item.tags.split(',').map(tag => tag.trim());
            return selectedTags.every(tag => itemTags.includes(tag));
        });
    }

    // Apply quantity filtering
    filteredItems = filterByQuantityValue(filteredItems, quantityFilter);

    displayItems(filteredItems);
}

// Filter by quantity value
function filterByQuantityValue(items, quantityFilter) {
    switch (quantityFilter) {
        case 'high':
            return items.filter(item => item.quantity >= 5);
        case 'medium':
            return items.filter(item => item.quantity >= 3 && item.quantity <= 4);
        case 'low':
            return items.filter(item => item.quantity <= 2);
        default:
            return items;
    }
}

// Filter by quantity
window.filterByQuantity = function() {
    const quantityFilter = document.getElementById('quantityFilter').value;
    const selectedTags = [];
    const checkboxes = document.querySelectorAll('.tag-checkbox');

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedTags.push(checkbox.id);
        }
    });

    let filteredItems = allItems;

    // Apply tag filtering if any tags are selected
    if (selectedTags.length > 0) {
        filteredItems = filteredItems.filter(item => {
            if (!item.tags) return false;
            const itemTags = item.tags.split(',').map(tag => tag.trim());
            return selectedTags.every(tag => itemTags.includes(tag));
        });
    }

    // Apply quantity filtering
    filteredItems = filterByQuantityValue(filteredItems, quantityFilter);

    displayItems(filteredItems);
};

// Toggle tag filter visibility
window.toggleTagFilter = function() {
    const tagContent = document.getElementById('tag-filter-content');
    tagContent.classList.toggle('open');
};

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

    // Process tags - add "Need" tag automatically
    const tags = tagsInput ? `Need,${tagsInput.trim()}` : 'Need';

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
        showToast('Item added successfully');
        this.reset();
        // Refresh the items list
        fetchItems();
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
    fetchItems();
}); 