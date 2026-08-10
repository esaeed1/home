import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://pekbsvqrxxxusstbiuuv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBla2JzdnFyeHh4dXNzdGJpdXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NDM3MDUsImV4cCI6MjA2NzQxOTcwNX0.YOjHD8GqAK4LUwGNOZpVJzeYSMsnIUA-tXh1NZVllGs';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allItems = [];

async function fetchItems() {
    try {
        // Show loading state
        showLoading(true);
        
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('quantity', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            showError('Failed to load items. Please try again.');
            return;
        }

        console.log('Fetched items:', data);
        allItems = data;
        displayItems(data);
        populateTags(data);
        updateItemCountAndStock(data);
        updateHeroStats(data.length);
        
        // Hide filtered counter on initial load
        const filteredCounter = document.getElementById('filtered-counter');
        filteredCounter.style.display = 'none';
        
        // Hide loading state
        showLoading(false);
    } catch (err) {
        console.error('Fetch error:', err);
        showError('Network error. Please check your connection.');
        showLoading(false);
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const itemsGrid = document.getElementById('items-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (show) {
        loading.style.display = 'flex';
        itemsGrid.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loading.style.display = 'none';
        itemsGrid.style.display = 'grid';
    }
}

function showError(message) {
    const emptyState = document.getElementById('empty-state');
    const emptyIcon = emptyState.querySelector('.empty-icon i');
    const emptyTitle = emptyState.querySelector('.empty-title');
    const emptyText = emptyState.querySelector('.empty-text');
    
    emptyIcon.className = 'fas fa-exclamation-triangle';
    emptyTitle.textContent = 'Error Loading Items';
    emptyText.textContent = message;
    emptyState.style.display = 'block';
}

function updateItemCountAndStock(items) {
    const itemsCount = document.getElementById('items-count');
    const filteredCounter = document.getElementById('filtered-counter');
    const filteredCount = document.getElementById('filtered-count');

    const numSizes = items.length;
    const totalWindows = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

    itemsCount.textContent = `${numSizes} Size${numSizes !== 1 ? 's' : ''} · ${totalWindows} Window${totalWindows !== 1 ? 's' : ''}`;
    if (filteredCounter) {
        filteredCount.textContent = `${numSizes} Size${numSizes !== 1 ? 's' : ''} · ${totalWindows} Window${totalWindows !== 1 ? 's' : ''}`;
    }
}

function updateHeroStats(count) {
    const totalItems = document.getElementById('total-items');
    if (totalItems) {
        totalItems.textContent = count;
    }
}

function displayItems(items) {
    const itemGrid = document.getElementById('items-grid');
    const emptyState = document.getElementById('empty-state');
    
    itemGrid.innerHTML = '';

    if (items.length === 0) {
        emptyState.style.display = 'block';
        itemGrid.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    itemGrid.style.display = 'grid';

    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.onclick = () => {
            if (item.link) {
                window.open(item.link, '_blank');
            }
        };
        
        // Create tags HTML
        const tagsHTML = item.tags ? 
            item.tags.split(',').map(tag => `<span class="item-tag">${tag.trim()}</span>`).join('') : '';
        
        // Create price display from notes field
        const priceHTML = item.notes ? 
            `<div class="price-display">
                <div class="price-label">PRICE</div>
                <div class="price-value">$${item.notes}</div>
            </div>` : '';
        
        // Create enhanced quantity display
        const quantityDisplay = item.quantity && item.quantity > 0 ? 
            `<div class="quantity-display">${item.quantity} Available</div>` : 
            `<div class="quantity-display" style="background: linear-gradient(135deg, #dc3545, #c82333);">Out of Stock</div>`;
        
        // Create info section
        const infoHTML = `
            <div class="item-info">
                <div class="info-item">
                    <div class="info-label">UPC</div>
                    <div class="info-value">${item.upc || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Stock</div>
                    <div class="info-value">${item.quantity || 0}</div>
                </div>
            </div>
        `;
        
        itemCard.innerHTML = `
            <div class="item-badge">${item.id}</div>
            <img src="${item.img || 'https://via.placeholder.com/400x220/667eea/ffffff?text=Pro+Windows'}" 
                 alt="${item.name}" 
                 class="item-image"
                 onerror="this.src='https://via.placeholder.com/400x220/667eea/ffffff?text=Pro+Windows'">
            <div class="item-content">
                <h3 class="item-title">${item.name}</h3>
                <p class="item-description">
                    ${item.description || 'Premium Windows solution with advanced features and optimal performance.'}
                </p>
                ${quantityDisplay}
                ${infoHTML}
                ${tagsHTML ? `<div class="item-tags">${tagsHTML}</div>` : ''}
                ${priceHTML}
            </div>
        `;
        
        itemGrid.appendChild(itemCard);
    });
}

function populateTags(items) {
    const uniqueTags = new Set();
    items.forEach(item => {
        if (item.tags) {
            item.tags.split(',').forEach(tag => uniqueTags.add(tag.trim()));
        }
    });

    const filterContent = document.getElementById('filter-content');
    filterContent.innerHTML = ''; // Clear current filter content

    uniqueTags.forEach(tag => {
        const checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'filter-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `filter-${tag}`;
        checkbox.className = 'filter-checkbox-input';
        checkbox.onclick = () => filterItemsByTags();

        const label = document.createElement('label');
        label.setAttribute('for', `filter-${tag}`);
        label.textContent = tag;

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        filterContent.appendChild(checkboxContainer);
    });
}

function filterItemsByTags() {
    const selectedTags = [];
    const checkboxes = document.querySelectorAll('.filter-checkbox-input');

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedTags.push(checkbox.id.replace('filter-', ''));
        }
    });

    let filteredItems;
    if (selectedTags.length === 0) {
        filteredItems = allItems;
        // Hide filtered counter when no filters are applied
        const filteredCounter = document.getElementById('filtered-counter');
        filteredCounter.style.display = 'none';
    } else {
        filteredItems = allItems.filter(item => {
            if (!item.tags) return false;
            const itemTags = item.tags.split(',').map(tag => tag.trim());
            return selectedTags.every(tag => itemTags.includes(tag));
        });
        
        // Show filtered counter when filters are applied
        const filteredCounter = document.getElementById('filtered-counter');
        const filteredCount = document.getElementById('filtered-count');
        filteredCounter.style.display = 'inline-flex';
        filteredCount.textContent = filteredItems.length;
    }

    displayItems(filteredItems);
    updateItemCountAndStock(filteredItems);
    updateHeroStats(filteredItems.length);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchItems();
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
