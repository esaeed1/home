import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ymyztsxdqmiklnsjurhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteXp0c3hkcW1pa2xuc2p1cmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNDA3MzQsImV4cCI6MjA0OTgxNjczNH0.dGJ9LjCTGvGzUrSQfln_nxiIrxXNBy57Z98b8G7yZqk';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allItems = [];

async function fetchItems() {
    try {
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('quantity', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return;
        }

        // Filter out items with tag "Need" or UPC 0
        const filteredData = data.filter(item => {
            if (item.upc === 0) return false;
            if (!item.tags) return true;
            const tags = item.tags.split(',').map(tag => tag.trim().toLowerCase());
            return !tags.includes('need');
        });

        console.log('Filtered items:', filteredData);
        allItems = filteredData;
        displayItems(filteredData);
        populateTags(filteredData);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

function displayItems(items) {
    const itemGrid = document.getElementById('item-grid');
    itemGrid.innerHTML = '';

    items.forEach(item => {
        const itemCard = document.createElement('a');
        itemCard.href = item.link;
        itemCard.target = "_blank";
        itemCard.className = 'item-card';
        itemCard.innerHTML = `
            <div class="item-id">${item.id}</div>
            <img src="${item.img}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>UPC: ${item.upc}</p>
            <p>Quantity: ${item.quantity}</p>
            ${item.tags ? `<p class="item-tags">Tags: ${item.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join(', ')}</p>` : ''}
            ${item.notes ? `<p class="item-notes">Notes: ${item.notes}</p>` : ''}
        `;
        itemGrid.appendChild(itemCard);
    });
}

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

function filterItemsByTags() {
    const selectedTags = [];
    const checkboxes = document.querySelectorAll('.tag-checkbox');

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedTags.push(checkbox.id);
        }
    });

    const filteredItems = allItems.filter(item => {
        if (!item.tags) return false;
        const itemTags = item.tags.split(',').map(tag => tag.trim());
        return selectedTags.every(tag => itemTags.includes(tag));
    });

    if (selectedTags.length === 0) {
        displayItems(allItems);
    } else {
        displayItems(filteredItems);
    }
}

document.addEventListener('DOMContentLoaded', fetchItems);
