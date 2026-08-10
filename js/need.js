// Initialize Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://oaoigvrysdzdrkbdgweu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2lndnJ5c2R6ZHJrYmRnd2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzYzNDgsImV4cCI6MjA3MjcxMjM0OH0.zzbdgJA32dKIoy5vgqOH_Kl-hkdeQGXjp5fxWp-G0Mc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allItems = [];

// -------------------- Delete Item --------------------
window.deleteItem = async function(id) {
    console.log('Attempting to delete item:', id);

    if (!confirm('Are you sure you want to remove this item?')) {
        console.log('Delete cancelled by user');
        return;
    }

    try {
        showLoading();
        console.log('Deleting item from database...');

        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        const itemElement = document.querySelector(`.shopping-item[data-id="${id}"]`);
        if (itemElement) itemElement.remove();

        showToast('Item removed successfully');
        fetchItems();
    } catch (error) {
        console.error('Error removing item:', error);
        showToast('Error removing item: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// -------------------- Loading & Toast Helpers --------------------
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
}
function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}
function showToast(message, type = 'success') {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        className: `toast-${type}`,
    }).showToast();
}

// -------------------- Fetch & Display Items --------------------
async function fetchItems() {
    try {
        showLoading();
        console.log('Fetching items from database...');

        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('upc', 0);

        if (error) throw error;

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

function displayItems(items) {
    const shoppingList = document.getElementById('shoppingList');
    if (!shoppingList) return;

    shoppingList.innerHTML = '';

    if (items.length === 0) {
        shoppingList.innerHTML = '<p>No items match your current filters.</p>';
        return;
    }

    items.sort((a, b) => b.quantity - a.quantity);

    items.forEach(item => {
        const shoppingItem = document.createElement('div');
        shoppingItem.className = 'shopping-item';
        shoppingItem.dataset.id = item.id;

        if (item.quantity >= 5) shoppingItem.classList.add('high-priority');
        else if (item.quantity >= 3) shoppingItem.classList.add('medium-priority');

        const tagsDisplay = item.tags
            ? item.tags.split(',').map(tag => tag.trim()).filter(tag => tag.toLowerCase() !== 'need').join(', ')
            : '';

        shoppingItem.innerHTML = `
            <div class="item-details">
                <div class="item-header">
                    <div class="item-name">${item.name} (#${item.id})</div>
                    <div class="quantity-badge">${item.quantity}</div>
                </div>
                ${tagsDisplay ? `
                    <div class="item-tags">
                        ${tagsDisplay.split(',').map(tag => `<span class="item-tag">${tag.trim()}</span>`).join('')}
                    </div>
                ` : ''}
                ${item.notes ? `<div class="item-notes">${item.notes.replace(/\n/g, '<br>')}</div>` : ''}
                <button class="delete-btn" onclick="deleteItem(${item.id})">Remove Item</button>
            </div>
        `;

        shoppingList.appendChild(shoppingItem);
    });
}

// -------------------- Tag Filtering --------------------
function populateTags(items) {
    const uniqueTags = new Set();
    items.forEach(item => {
        if (item.tags) {
            item.tags.split(',').forEach(tag => {
                const trimmedTag = tag.trim();
                if (trimmedTag.toLowerCase() !== 'need') uniqueTags.add(trimmedTag);
            });
        }
    });

    const tagFilterContent = document.getElementById('tag-filter-content');
    tagFilterContent.innerHTML = '';

    uniqueTags.forEach(tag => {
        const container = document.createElement('div');
        container.className = 'tag-checkbox-container';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = tag;
        checkbox.className = 'tag-checkbox';
        checkbox.onclick = filterItemsByTags;

        const label = document.createElement('label');
        label.setAttribute('for', tag);
        label.textContent = tag;

        container.appendChild(checkbox);
        container.appendChild(label);
        tagFilterContent.appendChild(container);
    });
}

function filterItemsByTags() {
    const selectedTags = Array.from(document.querySelectorAll('.tag-checkbox:checked')).map(cb => cb.id);
    let filteredItems = allItems;

    if (selectedTags.length > 0) {
        filteredItems = filteredItems.filter(item => {
            if (!item.tags) return false;
            const itemTags = item.tags.split(',').map(tag => tag.trim());
            return selectedTags.every(tag => itemTags.includes(tag));
        });
    }

    const quantityFilter = document.getElementById('quantityFilter').value;
    filteredItems = filterByQuantityValue(filteredItems, quantityFilter);

    displayItems(filteredItems);
}

function filterByQuantityValue(items, quantityFilter) {
    switch (quantityFilter) {
        case 'high': return items.filter(item => item.quantity >= 5);
        case 'medium': return items.filter(item => item.quantity >= 3 && item.quantity <= 4);
        case 'low': return items.filter(item => item.quantity <= 2);
        default: return items;
    }
}

// -------------------- Quantity Filter --------------------
window.filterByQuantity = function() {
    filterItemsByTags();
};

// -------------------- Toggle Tag Filter --------------------
window.toggleTagFilter = function() {
    const tagContent = document.getElementById('tag-filter-content');
    tagContent.classList.toggle('open');
};

// -------------------- Form Submission --------------------
document.getElementById('shoppingForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const itemName = document.getElementById('itemName').value;
    const dimensions = document.getElementById('dimensions').value;
    const quantity = document.getElementById('quantity').value;
    const notes = document.getElementById('notes').value;
    const tagsInput = document.getElementById('tags').value;

    if (!itemName || !quantity) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const tags = tagsInput ? `Need,${tagsInput.trim()}` : 'Need';

    try {
        showLoading();
        const { data, error } = await supabase
            .from('items')
            .insert([{
                name: itemName,
                quantity: parseInt(quantity),
                notes: notes + (dimensions ? `\nDimensions: ${dimensions}` : ''),
                tags: tags,
                upc: 0,
                img: '',
                link: ''
            }])
            .select();

        if (error) throw error;

        showToast('Item added successfully');
        this.reset();
        fetchItems();
    } catch (error) {
        showToast('Error adding item: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// -------------------- Load Items on Page Load --------------------
document.addEventListener('DOMContentLoaded', fetchItems);
