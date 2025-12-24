// ============================================
// PRODUCT DATABASE CLASS - SECURE VERSION
// ============================================
class ProductDB {
    constructor() {
        this.storageKey = 'aymShopProducts';
        this.cartStorageKey = 'aymShopCart';
        this.originalCartStorageKey = 'aymShopOriginalCart';
        this.products = [];
        this.categories = [];
        this.cart = this.loadCart();
        this.currentProductId = null;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentSearchResults = [];
        this.currentCategory = 'all';
        this.isLoading = false;
        this.billSerial = null;
        this.customerInfo = {
            name: '',
            phone: '',
            address: ''
        };
    }
    
    async loadProductsFromAirtable() {
        try {
            // Use server-side API route to fetch products
            const response = await fetch('/api/products');
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`خطا در بارگیری محصولات: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'خطا در دریافت محصولات');
            }
            
            if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
                this.products = [];
                this.currentSearchResults = [];
                this.saveProducts();
                return this.products;
            }
            
            this.products = data.products;
            this.currentSearchResults = [...this.products];
            this.saveProducts();
            
            return this.products;
            
        } catch (error) {
            // Try to load from local storage if exists
            try {
                const localProducts = localStorage.getItem(this.storageKey);
                if (localProducts) {
                    this.products = JSON.parse(localProducts);
                    this.currentSearchResults = [...this.products];
                    return this.products;
                }
            } catch (e) {
                console.error('خطا در بارگیری از حافظه محلی:', e);
            }
            
            throw error;
        }
    }
    
    getProductPlaceholder(category) {
        const categoryEmojis = {
            'آرایشی و بهداشتی': '💄',
            'مراقبت مو': '🧴',
            'مراقبت پوست': '🧴',
            'بهداشتی': '🧼',
            'لوازم آرایشی': '💅',
            'عطر': '🌸',
            'کرم': '🧴',
            'شامپو': '🧴',
            'صابون': '🧼',
            'لوازم خانگی': '🏠',
            'لباس': '👕',
            'کفش': '👟',
            'اکسسوری': '👜',
            'لوازم الکترونیکی': '📱',
            'کتاب': '📚',
            'اسباب بازی': '🧸',
            'خوراکی': '🍎',
            'عمومی': '📦'
        };
        
        const emoji = categoryEmojis[category] || '📦';
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f5f5f5"/><text x="50" y="50" font-size="40" text-anchor="middle" dy=".3em" fill="%23999">${emoji}</text></svg>`;
    }
    
    getCategoryPlaceholder(category) {
        const categoryEmojis = {
            'آرایشی و بهداشتی': '💄',
            'مراقبت مو': '🧴',
            'مراقبت پوست': '🧴',
            'بهداشتی': '🧼',
            'لوازم آرایشی': '💅',
            'عطر': '🌸',
            'کرم': '🧴',
            'شامپو': '🧴',
            'صابون': '🧼',
            'لوازم خانگی': '🏠',
            'لباس': '👕',
            'کفش': '👟',
            'اکسسوری': '👜',
            'لوازم الکترونیکی': '📱',
            'کتاب': '📚',
            'اسباب بازی': '🧸',
            'خوراکی': '🍎',
            'عمومی': '📦'
        };
        
        return categoryEmojis[category] || '📦';
    }
    
    extractCategories() {
        const allCategories = this.products.map(p => p.category || 'عمومی');
        const uniqueCategories = ['همه', ...new Set(allCategories)];
        this.categories = uniqueCategories;
    }
    
    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        const mainContainer = document.getElementById('mainContainer');
        
        if (loadingEl && mainContainer) {
            if (show) {
                loadingEl.style.display = 'flex';
                mainContainer.style.display = 'none';
            } else {
                loadingEl.style.display = 'none';
                mainContainer.style.display = 'block';
            }
        }
    }
    
    showLoadingError(show, message = '') {
        const loadingError = document.getElementById('loadingError');
        if (loadingError) {
            if (show) {
                loadingError.style.display = 'block';
                if (message) {
                    const errorText = loadingError.querySelector('p');
                    if (errorText) {
                        errorText.innerHTML = message;
                    }
                }
            } else {
                loadingError.style.display = 'none';
            }
        }
    }
    
    saveProducts() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.products));
        } catch (e) {
            console.error('خطا در ذخیره محصولات در حافظه محلی:', e);
        }
    }
    
    loadCart() {
        try {
            const cartJson = localStorage.getItem(this.cartStorageKey);
            return cartJson ? JSON.parse(cartJson) : [];
        } catch (e) {
            console.error('خطا در بارگیری سبد خرید:', e);
            return [];
        }
    }
    
    saveCart() {
        try {
            localStorage.setItem(this.cartStorageKey, JSON.stringify(this.cart));
        } catch (e) {
            console.error('خطا در ذخیره سبد خرید:', e);
        }
    }
    
    saveOriginalCart() {
        try {
            localStorage.setItem(this.originalCartStorageKey, JSON.stringify(this.cart));
        } catch (e) {
            console.error('خطا در ذخیره سبد خرید اصلی:', e);
        }
    }
    
    getProductById(id) {
        return this.products.find(product => product.id === id);
    }
    
    searchProducts(query, category = this.currentCategory) {
        let filteredProducts = this.products;
        
        if (category !== 'all' && category !== 'همه') {
            filteredProducts = filteredProducts.filter(product => 
                product.category === category
            );
        }
        
        if (query && query.trim()) {
            const searchTerm = query.toLowerCase();
            filteredProducts = filteredProducts.filter(product => 
                (product.name && product.name.toLowerCase().includes(searchTerm)) || 
                (product.code && product.code.toLowerCase().includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.fullDescription && product.fullDescription.toLowerCase().includes(searchTerm))
            );
        }
        
        this.currentSearchResults = filteredProducts;
        this.currentCategory = category;
        
        return this.getPaginatedProducts();
    }
    
    getPaginatedProducts() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.currentSearchResults.slice(startIndex, endIndex);
    }
    
    getTotalPages() {
        return Math.ceil(this.currentSearchResults.length / this.itemsPerPage);
    }
    
    formatNumberWithCommas(number) {
        return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    }
    
    parsePrice(priceString) {
        if (!priceString) return 0;
        const cleanString = priceString.toString().replace(/[^\d,]/g, '').replace(/,/g, '');
        return parseInt(cleanString) || 0;
    }
    
    formatPrice(price) {
        if (typeof price === 'string') {
            const numericPart = this.parsePrice(price);
            const formattedNumber = this.formatNumberWithCommas(numericPart);
            return `${formattedNumber} افغانی`;
        }
        return `${this.formatNumberWithCommas(price)} افغانی`;
    }
    
    // Cart methods
    addToCart(productId, quantity = 1) {
        const product = this.getProductById(productId);
        if (!product) return false;
        
        const existingItemIndex = this.cart.findIndex(item => item.id === productId);
        
        if (existingItemIndex !== -1) {
            const newQuantity = this.cart[existingItemIndex].quantity + quantity;
            if (newQuantity <= product.stock) {
                this.cart[existingItemIndex].quantity = newQuantity;
                this.saveCart();
                this.saveOriginalCart();
                return true;
            } else {
                return false;
            }
        } else {
            if (quantity <= product.stock) {
                const cartItem = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: quantity,
                    images: product.images,
                    category: product.category
                };
                
                this.cart.push(cartItem);
                this.saveCart();
                this.saveOriginalCart();
                return true;
            } else {
                return false;
            }
        }
    }
    
    updateCartQuantity(productId, quantity) {
        const product = this.getProductById(productId);
        if (!product) return false;
        
        const cartItemIndex = this.cart.findIndex(item => item.id === productId);
        if (cartItemIndex !== -1) {
            if (quantity <= 0) {
                this.cart.splice(cartItemIndex, 1);
            } else if (quantity <= product.stock) {
                this.cart[cartItemIndex].quantity = quantity;
            } else {
                return false;
            }
            
            this.saveCart();
            this.saveOriginalCart();
            return true;
        }
        return false;
    }
    
    removeFromCart(productId) {
        const index = this.cart.findIndex(item => item.id === productId);
        if (index !== -1) {
            this.cart.splice(index, 1);
            this.saveCart();
            this.saveOriginalCart();
            return true;
        }
        return false;
    }
    
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.saveOriginalCart();
    }
    
    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }
    
    getCartTotal() {
        return this.cart.reduce((total, item) => {
            const price = this.parsePrice(item.price);
            return total + (price * item.quantity);
        }, 0);
    }
    
    checkout() {
        let success = true;
        
        for (const cartItem of this.cart) {
            const product = this.getProductById(cartItem.id);
            if (product && product.stock >= cartItem.quantity) {
                product.stock -= cartItem.quantity;
            } else {
                success = false;
                break;
            }
        }
        
        if (success) {
            this.saveProducts();
            this.saveOriginalCart();
            return true;
        }
        
        return false;
    }
}

// ============================================
// APPLICATION INITIALIZATION
// ============================================
let db;

async function initializeApp() {
    db = new ProductDB();
    db.showLoading(true);
    db.showLoadingError(false);
    
    try {
        const loadPromise = db.loadProductsFromAirtable();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('بارگیری محصولات بیش از حد طول کشید. لطفاً اتصال اینترنت خود را بررسی کنید')), 30000)
        );
        
        await Promise.race([loadPromise, timeoutPromise]);
        
        db.extractCategories();
        renderCategoryFilters();
        updateCartCount();
        renderCurrentPage();
        renderCart();
        setupEventListeners();
        setupDropdown();
        
        db.showLoading(false);
        
        if (db.products.length === 0) {
            const productCount = document.getElementById('productCount');
            if (productCount) {
                productCount.textContent = 'هیچ محصولی در سیستم وجود ندارد';
            }
        }
        
    } catch (error) {
        db.products = [];
        db.currentSearchResults = [];
        db.categories = [];
        
        const loadingEl = document.getElementById('loading');
        const spinner = document.querySelector('.loading-spinner');
        
        if (spinner) {
            spinner.style.display = 'none';
        }
        
        const errorMessage = `
            <h4><i class="fas fa-exclamation-triangle"></i> خطا در بارگیری محصولات</h4>
            <p><strong>${error.message}</strong></p>
            <p>نمی‌توانیم محصولات را از سرور بارگیری کنیم.</p>
            <p><strong>لطفاً:</strong></p>
            <p>۱. اتصال اینترنت خود را بررسی کنید</p>
            <p>۲. صفحه را رفرش (F5) کنید</p>
            <p>۳. اگر مشکل ادامه دارد، با پشتیبانی تماس بگیرید: <strong>۰۷۸۹۲۸۱۷۷۰</strong></p>
            <p><strong>خطای فنی:</strong> ${error.message}</p>
        `;
        
        db.showLoadingError(true, errorMessage);
    }
}

// ============================================
// DROPDOWN FUNCTIONALITY
// ============================================

function setupDropdown() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.getElementById('categoryDropdown');
    
    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            dropdownMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', function(e) {
            if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownToggle.classList.remove('active');
                dropdownMenu.classList.remove('show');
            }
        });
    }
}

// ============================================
// UI RENDERING FUNCTIONS
// ============================================

function renderCategoryFilters() {
    const categoryContainer = document.getElementById('categoryDropdown');
    const selectedCategoryText = document.getElementById('selectedCategory');
    
    if (!categoryContainer) return;
    
    categoryContainer.innerHTML = '';
    
    if (db.categories.length === 0) {
        db.categories = ['همه'];
    }
    
    db.categories.forEach(category => {
        const dropdownItem = document.createElement('div');
        dropdownItem.className = `dropdown-item ${category === 'همه' || category === 'all' ? 'active' : ''}`;
        dropdownItem.textContent = category;
        dropdownItem.dataset.category = category;
        
        dropdownItem.addEventListener('click', function(e) {
            e.stopPropagation();
            
            document.querySelectorAll('.dropdown-item').forEach(item => {
                item.classList.remove('active');
            });
            
            this.classList.add('active');
            selectedCategoryText.textContent = category;
            
            const dropdownToggle = document.querySelector('.dropdown-toggle');
            const dropdownMenu = document.getElementById('categoryDropdown');
            dropdownToggle.classList.remove('active');
            dropdownMenu.classList.remove('show');
            
            db.currentPage = 1;
            db.searchProducts(document.getElementById('searchInput').value, category === 'همه' ? 'all' : category);
            renderCurrentPage();
        });
        
        categoryContainer.appendChild(dropdownItem);
    });
    
    if (selectedCategoryText) {
        selectedCategoryText.textContent = 'همه دسته‌بندی‌ها';
    }
}

function renderProducts(products) {
    const productsContainer = document.getElementById('productsContainer');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');
    
    if (products.length === 0) {
        productsContainer.style.display = 'none';
        emptyState.style.display = 'block';
        pagination.style.display = 'none';
        return;
    }
    
    productsContainer.style.display = 'grid';
    emptyState.style.display = 'none';
    
    productsContainer.innerHTML = '';
    
    products.forEach(product => {
        const cartItem = db.cart.find(item => item.id === product.id);
        const cartQuantity = cartItem ? cartItem.quantity : 0;
        const availableStock = product.stock - cartQuantity;
        
        const stockClass = availableStock > 10 ? 'stock-available' : 
                          availableStock > 0 ? 'stock-low' : 'stock-out';
        
        const stockText = availableStock > 10 ? 'موجود' :
                         availableStock > 0 ? `تنها ${availableStock} عدد` : 'ناموجود';
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-id', product.id);
        
        const isMobile = window.innerWidth <= 480;
        const nameMaxLength = isMobile ? (window.innerWidth <= 360 ? 25 : 30) : 35;
        const descMaxLength = isMobile ? (window.innerWidth <= 360 ? 30 : 40) : 50;
        
        const displayName = product.name && product.name.length > nameMaxLength ? 
            product.name.substring(0, nameMaxLength) + '...' : (product.name || 'محصول بدون نام');
        const displayDesc = product.description && product.description.length > descMaxLength ? 
            product.description.substring(0, descMaxLength) + '...' : (product.description || 'بدون توضیح');
        
        const hasMultipleImages = product.images && product.images.length > 1;
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : '';
        
        productCard.innerHTML = `
            <div class="product-gallery">
                <img src="${mainImage}" 
                     alt="${product.name || 'محصول'}"
                     class="main-image"
                     loading="lazy"
                     width="250"
                     height="160"
                     onerror="handleImageError(this, '${db.getCategoryPlaceholder(product.category)}', true)">
                <div class="image-fallback" style="display: none">${db.getCategoryPlaceholder(product.category)}</div>
                
                ${hasMultipleImages ? `
                <div class="thumbnail-container">
                    ${product.images.map((img, index) => `
                        <img src="${img}" 
                             alt="تصویر ${index + 1} از ${product.name}"
                             class="thumbnail ${index === 0 ? 'active' : ''}"
                             data-index="${index}"
                             onclick="window.changeProductImage(this, '${product.id}')"
                             loading="lazy"
                             width="30"
                             height="30"
                             onerror="this.style.display='none'">
                    `).join('')}
                </div>
                ` : ''}
            </div>
            <h3 title="${product.name || 'محصول'}">${displayName}</h3>
            <div class="product-detail">
                <i class="fas fa-align-right"></i>
                <span title="${product.description || ''}">${displayDesc}</span>
            </div>
            <div class="price-tag">
                ${db.formatPrice(product.price || 0)}
            </div>
            <div class="product-detail">
                <i class="fas fa-barcode"></i>
                <span title="${product.code || ''}">کود: <span class="product-code">${product.code || 'بدون کود'}</span></span>
            </div>
            <div class="stock-info">
                <span class="${stockClass}"><i class="fas fa-box"></i> ${stockText}</span>
                ${product.category && product.category !== 'عمومی' ? `<div class="product-category">${product.category}</div>` : ''}
            </div>
            <div class="cart-controls">
                <span></span>
                <div class="quantity-controls">
                    <button class="quantity-btn btn-extra-small plus-btn" ${availableStock <= cartQuantity ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                    <span id="qty-${product.id}" class="quantity-display">${cartQuantity}</span>
                    <button class="quantity-btn btn-extra-small minus-btn" ${cartQuantity === 0 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
            </div>
            <div class="action-buttons">
                <button class="btn btn-primary btn-small view-detail-btn">
                    <i class="fas fa-eye"></i> مشاهده
                </button>
                <button class="btn btn-success btn-small add-btn" ${availableStock === 0 ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus"></i> افزودن
                </button>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
        
        const viewDetailBtn = productCard.querySelector('.view-detail-btn');
        viewDetailBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showProductDetail(product.id);
        });
        
        const addBtn = productCard.querySelector('.add-btn');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePlusClick(product.id);
        });
        
        productCard.addEventListener('click', (e) => {
            if (!e.target.closest('.quantity-controls') && 
                !e.target.closest('button') && 
                !e.target.closest('.view-detail-btn') &&
                !e.target.closest('.add-btn')) {
                showProductDetail(product.id);
            }
        });
        
        const plusBtn = productCard.querySelector('.plus-btn');
        const minusBtn = productCard.querySelector('.minus-btn');
        
        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePlusClick(product.id);
        });
        
        minusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleMinusClick(product.id);
        });
    });
    
    updateProductCount();
    updatePagination();
}

window.changeProductImage = function(thumbnail, productId) {
    const gallery = thumbnail.closest('.product-gallery');
    const mainImage = gallery.querySelector('.main-image');
    const allThumbnails = gallery.querySelectorAll('.thumbnail');
    
    mainImage.src = thumbnail.src;
    
    allThumbnails.forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
}

window.changeDetailImage = function(thumbnail, imageIndex) {
    const detailMainImage = document.getElementById('detailMainImage');
    const allThumbnails = document.querySelectorAll('.detail-thumbnail');
    
    if (detailMainImage) {
        detailMainImage.src = thumbnail.src;
    }
    
    allThumbnails.forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
}

window.handleImageError = function(imgElement, fallbackEmoji, isGallery = false) {
    const parent = imgElement.parentElement;
    imgElement.style.display = 'none';
    
    let fallbackDiv = parent.querySelector('.image-fallback');
    if (!fallbackDiv) {
        fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'image-fallback';
        parent.appendChild(fallbackDiv);
    }
    
    fallbackDiv.textContent = fallbackEmoji;
    fallbackDiv.style.display = 'flex';
    fallbackDiv.style.alignItems = 'center';
    fallbackDiv.style.justifyContent = 'center';
    fallbackDiv.style.fontSize = isGallery ? '3rem' : '2rem';
    fallbackDiv.style.color = '#ccc';
};

function renderCurrentPage() {
    const products = db.getPaginatedProducts();
    renderProducts(products);
}

function showProductDetail(productId) {
    const product = db.getProductById(productId);
    if (!product) return;
    
    db.currentProductId = productId;
    
    const detailName = document.getElementById('detailName');
    const detailDescription = document.getElementById('detailDescription');
    const detailPrice = document.getElementById('detailPrice');
    const detailCode = document.getElementById('detailCode');
    const detailStock = document.getElementById('detailStock');
    const detailCategory = document.getElementById('detailCategory');
    const detailMainImage = document.getElementById('detailMainImage');
    const detailThumbnails = document.getElementById('detailThumbnails');
    
    detailName.textContent = product.name || 'محصول بدون نام';
    
    const fullDescription = product.fullDescription || product.description || 'بدون توضیح';
    detailDescription.textContent = fullDescription;
    
    detailPrice.textContent = db.formatPrice(product.price || 0);
    detailCode.textContent = product.code || 'بدون کود';
    detailCategory.textContent = product.category || 'عمومی';
    
    const cartItem = db.cart.find(item => item.id === productId);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const availableStock = product.stock - cartQuantity;
    
    const stockClass = availableStock > 10 ? 'stock-available' : 
                      availableStock > 0 ? 'stock-low' : 'stock-out';
    
    detailStock.textContent = availableStock > 10 ? 'موجود' :
                              availableStock > 0 ? `تنها ${availableStock} عدد` : 'ناموجود';
    detailStock.className = stockClass;
    
    const mainImage = product.images && product.images.length > 0 ? product.images[0] : '';
    detailMainImage.src = mainImage;
    detailMainImage.alt = product.name || 'محصول';
    
    detailMainImage.onerror = function() {
        this.style.display = 'none';
        const fallback = document.querySelector('#productDetailModal .image-fallback');
        if (fallback) {
            fallback.textContent = db.getCategoryPlaceholder(product.category);
            fallback.style.display = 'block';
        }
    };
    
    detailThumbnails.innerHTML = '';
    if (product.images && product.images.length > 1) {
        detailThumbnails.style.display = 'flex';
        product.images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = imageUrl;
            thumbnail.alt = `تصویر ${index + 1} از ${product.name}`;
            thumbnail.className = `detail-thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.dataset.index = index;
            thumbnail.onclick = () => window.changeDetailImage(thumbnail, index);
            thumbnail.onerror = function() {
                this.style.display = 'none';
            };
            detailThumbnails.appendChild(thumbnail);
        });
    } else {
        detailThumbnails.style.display = 'none';
    }
    
    document.getElementById('productDetailModal').style.display = 'flex';
}

function renderCart() {
    const cartContainer = document.getElementById('cartContainer');
    const emptyCart = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');
    
    if (db.cart.length === 0) {
        cartContainer.innerHTML = '';
        emptyCart.style.display = 'block';
        cartSummary.style.display = 'none';
        return;
    }
    
    emptyCart.style.display = 'none';
    cartSummary.style.display = 'block';
    
    cartContainer.innerHTML = '';
    
    let subtotal = 0;
    
    db.cart.forEach(cartItem => {
        const product = db.getProductById(cartItem.id);
        if (!product) return;
        
        const price = db.parsePrice(cartItem.price);
        const itemTotal = price * cartItem.quantity;
        subtotal += itemTotal;
        
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        const firstImage = cartItem.images && cartItem.images.length > 0 ? cartItem.images[0] : '';
        cartItemEl.innerHTML = `
            <div class="cart-item-total">${db.formatNumberWithCommas(itemTotal)} افغانی</div>
            <div class="cart-item-quantity">
                <button class="quantity-btn btn-extra-small cart-plus-btn" ${product.stock <= cartItem.quantity ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>
                </button>
                <span class="quantity-display">${cartItem.quantity}</span>
                <button class="quantity-btn btn-extra-small cart-minus-btn">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${cartItem.name}</div>
                <div class="cart-item-price">${db.formatPrice(cartItem.price)} × ${cartItem.quantity}</div>
                <div class="stock-info" style="font-size: 0.85rem; margin-top: 4px;">
                    <span class="${product.stock > cartItem.quantity ? 'stock-available' : 'stock-out'}">
                        ${product.stock > cartItem.quantity ? 'موجودی کافی' : 'موجودی ناکافی'}
                    </span>
                </div>
            </div>
            <div class="cart-item-icon">
                <img src="${firstImage}" 
                     alt="${cartItem.name}"
                     loading="lazy"
                     width="60"
                     height="60"
                     onerror="window.handleImageError(this, '${db.getCategoryPlaceholder(product.category)}')">
                <div class="image-fallback" style="display: none">${db.getCategoryPlaceholder(product.category)}</div>
            </div>
        `;
        
        cartContainer.appendChild(cartItemEl);
        
        const plusBtn = cartItemEl.querySelector('.cart-plus-btn');
        const minusBtn = cartItemEl.querySelector('.cart-minus-btn');
        
        plusBtn.addEventListener('click', () => {
            handlePlusClick(cartItem.id);
        });
        
        minusBtn.addEventListener('click', () => {
            const currentQuantity = parseInt(cartItemEl.querySelector('.quantity-display').textContent);
            if (currentQuantity > 1) {
                handleMinusClick(cartItem.id);
            } else {
                if (confirm('آیا می‌خواهید این محصول از سبد خرید حذف شود؟')) {
                    db.removeFromCart(cartItem.id);
                    updateCartCount();
                    renderCart();
                    renderCurrentPage();
                }
            }
        });
    });
    
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    
    subtotalEl.textContent = `${db.formatNumberWithCommas(subtotal)} افغانی`;
    totalEl.textContent = `${db.formatNumberWithCommas(subtotal)} افغانی`;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function handlePlusClick(productId) {
    const product = db.getProductById(productId);
    const cartItem = db.cart.find(item => item.id === productId);
    const currentQuantity = cartItem ? cartItem.quantity : 0;
    
    if (db.addToCart(productId, 1)) {
        updateCartCount();
        renderCart();
        
        const qtyDisplay = document.getElementById(`qty-${productId}`);
        const plusBtn = document.querySelector(`[data-id="${productId}"] .plus-btn`);
        const minusBtn = document.querySelector(`[data-id="${productId}"] .minus-btn`);
        const addBtn = document.querySelector(`[data-id="${productId}"] .add-btn`);
        const stockInfo = document.querySelector(`[data-id="${productId}"] .stock-info span`);
        
        if (qtyDisplay) {
            qtyDisplay.textContent = currentQuantity + 1;
        }
        
        if (minusBtn) minusBtn.disabled = false;
        
        const availableStock = product.stock - (currentQuantity + 1);
        if (plusBtn && availableStock <= 0) {
            plusBtn.disabled = true;
        }
        
        if (addBtn && availableStock <= 0) {
            addBtn.disabled = true;
        }
        
        if (stockInfo) {
            if (availableStock > 10) {
                stockInfo.textContent = 'موجود';
                stockInfo.className = 'stock-available';
            } else if (availableStock > 0) {
                stockInfo.textContent = `تنها ${availableStock} عدد`;
                stockInfo.className = 'stock-low';
            } else {
                stockInfo.textContent = 'ناموجود';
                stockInfo.className = 'stock-out';
            }
        }
        
        const cartTab = document.querySelector('.tab[data-tab="cart"]');
        if (cartTab.classList.contains('active')) {
            renderCart();
        }
    } else {
        alert('نمی‌توان آیتم بیشتری اضافه کرد. موجودی کافی نیست.');
    }
}

function handleMinusClick(productId) {
    const product = db.getProductById(productId);
    const cartItem = db.cart.find(item => item.id === productId);
    const currentQuantity = cartItem ? cartItem.quantity : 0;
    
    if (currentQuantity > 0) {
        if (db.updateCartQuantity(productId, currentQuantity - 1)) {
            updateCartCount();
            renderCart();
            
            const qtyDisplay = document.getElementById(`qty-${productId}`);
            const plusBtn = document.querySelector(`[data-id="${productId}"] .plus-btn`);
            const minusBtn = document.querySelector(`[data-id="${productId}"] .minus-btn`);
            const addBtn = document.querySelector(`[data-id="${productId}"] .add-btn`);
            const stockInfo = document.querySelector(`[data-id="${productId}"] .stock-info span`);
            
            if (qtyDisplay) {
                qtyDisplay.textContent = currentQuantity - 1;
            }
            
            const availableStock = product.stock - (currentQuantity - 1);
            if (plusBtn) plusBtn.disabled = false;
            
            if (addBtn && availableStock > 0) {
                addBtn.disabled = false;
            }
            
            if (minusBtn && currentQuantity - 1 === 0) {
                minusBtn.disabled = true;
            }
            
            if (stockInfo) {
                if (availableStock > 10) {
                    stockInfo.textContent = 'موجود';
                    stockInfo.className = 'stock-available';
                } else if (availableStock > 0) {
                    stockInfo.textContent = `تنها ${availableStock} عدد`;
                    stockInfo.className = 'stock-low';
                } else {
                    stockInfo.textContent = 'ناموجود';
                    stockInfo.className = 'stock-out';
                }
            }
            
            const cartTab = document.querySelector('.tab[data-tab="cart"]');
            if (cartTab.classList.contains('active')) {
                renderCart();
            }
        }
    }
}

function updateCartCount() {
    const count = db.getCartItemCount();
    const cartCount = document.getElementById('cartCount');
    const cartCountFooter = document.getElementById('cartCountFooter');
    
    if (cartCount) cartCount.textContent = count;
    if (cartCountFooter) cartCountFooter.textContent = `(${count})`;
    if (cartCount) cartCount.style.display = count > 0 ? 'flex' : 'none';
}

function updateProductCount() {
    const total = db.products.length;
    const showing = db.currentSearchResults.length > db.itemsPerPage ? 
        `نمایش ${Math.min(db.itemsPerPage, db.currentSearchResults.length)} از ${db.currentSearchResults.length}` : 
        `نمایش ${db.currentSearchResults.length}`;
        
    const productCount = document.getElementById('productCount');
    if (productCount) {
        productCount.textContent = `کل محصولات: ${total} | ${showing}`;
    }
}

function updatePagination() {
    const totalPages = db.getTotalPages();
    const pagination = document.getElementById('pagination');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (pagination && prevPageBtn && nextPageBtn && pageInfo) {
        if (totalPages > 1) {
            pagination.style.display = 'flex';
            prevPageBtn.disabled = db.currentPage === 1;
            nextPageBtn.disabled = db.currentPage === totalPages;
            pageInfo.textContent = `صفحه ${db.currentPage} از ${totalPages}`;
        } else {
            pagination.style.display = 'none';
        }
    }
}

// ============================================
// INFO MODAL FUNCTIONS
// ============================================

function showInfoModal(title, content) {
    const modalTitle = document.getElementById('infoModalTitle');
    const modalContent = document.getElementById('infoModalContent');
    
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    
    document.getElementById('infoModal').style.display = 'flex';
}

// ============================================
// BILL/CHECKOUT FUNCTIONS
// ============================================

function generateBillSerial() {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const serial = `AYM-${month}-${random}-${day}`;
    db.billSerial = serial;
    return serial;
}

function promptCustomerInfo() {
    return new Promise((resolve) => {
        const name = prompt('لطفاً نام تان را وارد کنید:', db.customerInfo.name || '');
        if (name === null) {
            resolve(false);
            return;
        }
        
        const phone = prompt('لطفاً شماره تماس تان را وارد کنید:', db.customerInfo.phone || '');
        if (phone === null) {
            resolve(false);
            return;
        }
        
        const address = prompt('لطفاً آدرس تان را وارد کنید:', db.customerInfo.address || '');
        if (address === null) {
            resolve(false);
            return;
        }
        
        db.customerInfo = {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim()
        };
        
        resolve(true);
    });
}

async function showBill() {
    const infoConfirmed = await promptCustomerInfo();
    if (!infoConfirmed) {
        return;
    }
    
    if (db.cart.length === 0) {
        alert('سبد خرید شما خالی است!');
        return;
    }
    
    let stockValid = true;
    let outOfStockItems = [];
    
    for (const cartItem of db.cart) {
        const product = db.getProductById(cartItem.id);
        if (!product || product.stock < cartItem.quantity) {
            stockValid = false;
            outOfStockItems.push(cartItem.name);
        }
    }
    
    if (!stockValid) {
        alert(`موجودی کافی برای محصولات زیر وجود ندارد:\n${outOfStockItems.join('\n')}\n\nلطفاً با پشتیبانی تماس بگیرید: ۰۷۸۹۲۸۱۷۷۰`);
        return;
    }
    
    const billContent = document.getElementById('billContent');
    const billSerial = generateBillSerial();
    
    let billHTML = `
<div class="bill-header">
    <img src="/images/logo.jpg" 
         alt="فروشگاه آنلاین AYM" 
         style="width: 100px; height: 100px; object-fit: cover; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); border: 3px solid #e0e0e0;">
    <h2 style="margin-bottom: 5px; font-size: 18px;">فروشگاه آنلاین AYM</h2>
    <h3 style="margin-bottom: 10px; font-size: 16px; color: #3949ab;">بل خرید</h3>
                <p style="margin: 3px 0; font-size: 14px;">تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
                <p style="margin: 3px 0; font-size: 14px;">زمان: ${new Date().toLocaleTimeString('fa-IR')}</p>
            </div>
            
            <div class="customer-info">
                <h4><i class="fas fa-user"></i> اطلاعات مشتری</h4>
                <div class="customer-info-row">
                    <span class="customer-info-label">نام:</span>
                    <span>${db.customerInfo.name}</span>
                </div>
                <div class="customer-info-row">
                    <span class="customer-info-label">شماره تماس:</span>
                    <span>${db.customerInfo.phone}</span>
                </div>
                <div class="customer-info-row">
                    <span class="customer-info-label">آدرس:</span>
                    <span>${db.customerInfo.address}</span>
                </div>
            </div>
            
            <table class="bill-table">
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;">#</th>
                        <th style="text-align: right;">جنس</th>
                        <th style="width: 60px; text-align: center;">تعداد</th>
                        <th style="width: 80px; text-align: left;">قیمت واحد</th>
                        <th style="width: 90px; text-align: left;">مجموع</th>
                    </tr>
                </thead>
                <tbody>
        `;
    
    let total = 0;
    
    db.cart.forEach((cartItem, index) => {
        const price = db.parsePrice(cartItem.price);
        const itemTotal = price * cartItem.quantity;
        total += itemTotal;
        
        billHTML += `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td style="text-align: right;">${cartItem.name}</td>
                <td style="text-align: center;">${cartItem.quantity}</td>
                <td style="text-align: left;">${db.formatNumberWithCommas(price)}</td>
                <td style="text-align: left;">${db.formatNumberWithCommas(itemTotal)} افغانی</td>
            </tr>
        `;
    });
    
    billHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" style="text-align: right; font-weight: bold;">مجموع کل:</td>
                        <td style="text-align: left; font-weight: bold; color: #00c853;">${db.formatNumberWithCommas(total)} افغانی</td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="bill-footer">
                <p style="font-size: 15px; color: #1a237e; margin: 0; font-weight: bold;">تشکر از خرید شما</p>
                <p style="color: #616161; margin: 5px 0 0 0;">برای پیگیری سفارش با شماره ۰۷۸۹۲۸۱۷۷۰ تماس بگیرید</p>
                <p class="bill-serial">شماره بل: ${billSerial}</p>
            </div>
        `;
    
    billContent.innerHTML = billHTML;
    
    document.getElementById('cartModal').style.display = 'flex';
    
    if (db.checkout()) {
        updateCartCount();
        renderCart();
        renderCurrentPage();
        
        setTimeout(() => {
            alert('سفارش شما با موفقیت ثبت شد! لطفاً بل خرید را برای پشتیبانی ارسال کنید.');
        }, 500);
    }
}

function shareOnWhatsApp() {
    if (!db.billSerial) {
        alert('ابتدا باید بل خرید ایجاد شود.');
        return;
    }
    
    const customerName = db.customerInfo.name || 'مشتری';
    const customerPhone = db.customerInfo.phone || 'بدون شماره';
    const customerAddress = db.customerInfo.address || 'بدون آدرس';
    const billSerial = db.billSerial;
    
    const originalCartJson = localStorage.getItem('aymShopOriginalCart');
    let originalCart = [];
    
    if (originalCartJson) {
        originalCart = JSON.parse(originalCartJson);
    } else {
        originalCart = db.cart;
    }
    
    if (originalCart.length === 0 && db.cart.length === 0) {
        alert('هیچ محصولی در سفارش وجود ندارد.');
        return;
    }
    
    const cartToShare = originalCart.length > 0 ? originalCart : db.cart;
    
    let itemsText = '';
    let total = 0;
    
    cartToShare.forEach((cartItem, index) => {
        const price = db.parsePrice(cartItem.price);
        const itemTotal = price * cartItem.quantity;
        total += itemTotal;
        itemsText += `${index + 1}. ${cartItem.name} - ${cartItem.quantity} عدد - ${db.formatNumberWithCommas(itemTotal)} افغانی\n`;
    });
    
    const message = `📱 *سفارش جدید از فروشگاه آنلاین AYM*

🔖 *شماره بل:* ${billSerial}

👤 *مشتری:* ${customerName}
📞 *شماره تماس:* ${customerPhone}
📍 *آدرس:* ${customerAddress}

🛒 *اقلام سفارش:*
${itemsText}

💰 *مبلغ کل:* ${db.formatNumberWithCommas(total)} افغانی

📅 *تاریخ:* ${new Date().toLocaleDateString('fa-IR')}
⏰ *زمان:* ${new Date().toLocaleTimeString('fa-IR')}

_لطفاً پس از بررسی موجودی، سفارش را تایید کنید._`;
    
    const whatsappNumber = '93789281770';
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
}

function printBill() {
    const billContent = document.getElementById('billContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>پرنت بل خرید - فروشگاه AYM</title>
            <style>
                body {
                    font-family: Tahoma, Arial, sans-serif;
                    direction: rtl;
                    text-align: right;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .bill-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 15px;
                }
                .bill-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .bill-table th, .bill-table td {
                    border: 1px solid #333;
                    padding: 8px;
                    text-align: center;
                }
                .bill-table th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                .customer-info {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            </style>
        </head>
        <body>
            ${billContent}
            <div style="text-align: center; margin-top: 30px;" class="no-print">
                <button onclick="window.print()" style="padding: 10px 20px; background: #3949ab; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    پرنت بل
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                    بستن
                </button>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function closeModal(modal) {
    modal.style.display = 'none';
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const cartIcon = document.getElementById('cartIcon');
    const viewCartBtn = document.getElementById('viewCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const whatsappShareBtn = document.getElementById('whatsappShareBtn');
    const printBillBtn = document.getElementById('printBillBtn');
    const closeBillBtn = document.getElementById('closeBillBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const retryLoadingBtn = document.getElementById('retryLoadingBtn');
    const refreshProductsBtn = document.getElementById('refreshProductsBtn');
    const browseProductsBtn = document.getElementById('browseProductsBtn');
    const callSupportBtn = document.getElementById('callSupportBtn');
    
    const aboutLink = document.getElementById('aboutLink');
    const contactLink = document.getElementById('contactLink');
    const guideLink = document.getElementById('guideLink');
    const footerAboutLink = document.getElementById('footerAboutLink');
    const footerContactLink = document.getElementById('footerContactLink');
    const footerPrivacyLink = document.getElementById('footerPrivacyLink');
    const footerGuideLink = document.getElementById('footerGuideLink');
    const footerFaqLink = document.getElementById('footerFaqLink');
    
    if (retryLoadingBtn) {
        retryLoadingBtn.addEventListener('click', () => {
            location.reload();
        });
    }
    
    if (refreshProductsBtn) {
        refreshProductsBtn.addEventListener('click', async () => {
            db.showLoading(true);
            try {
                await db.loadProductsFromAirtable();
                db.extractCategories();
                renderCategoryFilters();
                renderCurrentPage();
                db.showLoading(false);
                alert('محصولات با موفقیت به‌روزرسانی شدند!');
            } catch (error) {
                alert('خطا در بارگیری مجدد محصولات: ' + error.message);
                db.showLoading(false);
            }
        });
    }
    
    if (browseProductsBtn) {
        browseProductsBtn.addEventListener('click', () => {
            document.querySelector('.tab[data-tab="products"]').click();
        });
    }
    
    if (callSupportBtn) {
        callSupportBtn.addEventListener('click', () => {
            window.location.href = 'tel:0789281770';
        });
    }
    
    searchBtn.addEventListener('click', () => {
        db.currentPage = 1;
        db.searchProducts(searchInput.value);
        renderCurrentPage();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        db.currentPage = 1;
        db.currentSearchResults = db.products;
        renderCurrentPage();
        
        const selectedCategoryText = document.getElementById('selectedCategory');
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        
        if (selectedCategoryText) {
            selectedCategoryText.textContent = 'همه دسته‌بندی‌ها';
        }
        
        dropdownItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.category === 'همه') {
                item.classList.add('active');
            }
        });
    });
    
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            db.currentPage = 1;
            db.searchProducts(searchInput.value);
            renderCurrentPage();
        }, 300);
    });
    
    cartIcon.addEventListener('click', () => {
        document.querySelector('.tab[data-tab="cart"]').click();
    });
    
    viewCartBtn.addEventListener('click', () => {
        document.querySelector('.tab[data-tab="cart"]').click();
    });
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
            
            if (tabName === 'cart') {
                renderCart();
            } else if (tabName === 'products') {
                renderCurrentPage();
            }
        });
    });
    
    const aboutContent = `
        <h3>درباره فروشگاه آنلاین AYM</h3>
        <p>فروشگاه آنلاین AYM با هدف ارائه بهترین محصولات و خدمات به مشتریان عزیز تأسیس شده است. ما با سال‌ها تجربه در زمینه فروش محصولات متنوع، همواره تلاش کرده‌ایم تا رضایت کامل مشتریان را جلب کنیم.</p>
        
        <h4>ماموریت ما:</h4>
        <p>ارائه محصولات با کیفیت بالا، قیمت مناسب و خدمات پس از فروش عالی به تمامی هموطنان در سراسر افغانستان.</p>
        
        <h4>ارزش‌های ما:</h4>
        <ul>
            <li>صداقت و شفافیت در تمامی مراحل خرید</li>
            <li>پشتیبانی ۲۴ ساعته</li>
            <li>ارسال سریع و رایگان</li>
            <li>رضایت مشتری اولویت اول ماست</li>
        </ul>
        
        <p>ما متعهد هستیم بهترین تجربه خرید آنلاین را برای شما فراهم کنیم.</p>
    `;
    
    const contactContent = `
        <h3>تماس با فروشگاه آنلاین AYM</h3>
        <p>برای ارتباط با ما و دریافت اطلاعات بیشتر، می‌توانید از راه‌های زیر استفاده کنید:</p>
        
        <h4>اطلاعات تماس:</h4>
        <ul>
            <li><strong>شماره تماس:</strong> ۰۷۸۹۲۸۱۷۷۰</li>
            <li><strong>آدرس:</strong> لیسه مریم، مقابل مرکز تجارتی طلا، مارکیت تجارتی جام جم منزل سوم</li>
            <li><strong>ساعات کاری:</strong> همه روزه از ساعت ۸ صبح تا ۶ شام</li>
        </ul>
        
        <h4>راه‌های ارتباطی دیگر:</h4>
        <ul>
            <li><strong>واتساپ:</strong> ۰۷۸۹۲۸۱۷۷۰</li>
            <li><strong>فیسبوک:</strong> facebook.com/aymshop</li>
            <li><strong>اینستاگرام:</strong> instagram.com/aymshop</li>
        </ul>
        
        <h4>پشتیبانی:</h4>
        <p>تیم پشتیبانی ما ۲۴ ساعته آماده پاسخگویی به سوالات و حل مشکلات شما می‌باشد.</p>
        
        <p>شما می‌توانید برای سفارشات، استعلام قیمت، پیگیری سفارشات و هرگونه سوال دیگر با ما در تماس باشید.</p>
    `;
    
    const guideContent = `
        <h3>راهنمای خرید از فروشگاه آنلاین AYM</h3>
        <p>برای خرید آسان و مطمئن از فروشگاه آنلاین AYM، لطفاً مراحل زیر را دنبال کنید:</p>
        
        <h4>مرحله ۱: مرور محصولات</h4>
        <p>از طریق تب "محصولات" می‌توانید تمامی محصولات ما را مشاهده کنید. می‌توانید از فیلتر دسته‌بندی و جستجو برای یافتن محصول مورد نظر خود استفاده کنید.</p>
        
        <h4>مرحله ۲: مشاهده جزئیات محصول</h4>
        <p>روی هر محصول کلیک کنید تا جزئیات کامل آن شامل قیمت، توضیحات، موجودی و تصاویر را مشاهده کنید.</p>
        
        <h4>مرحله ۳: افزودن به سبد خرید</h4>
        <p>پس از انتخاب محصول مورد نظر، با استفاده از دکمه‌های + و - یا دکمه "افزودن به سبد"، تعداد مورد نیاز را انتخاب و به سبد خرید اضافه کنید.</p>
        
        <h4>مرحله ۴: بررسی سبد خرید</h4>
        <p>از طریق تب "سبد خرید" یا دکمه سبد خرید در بالای صفحه، می‌توانید محصولات انتخاب شده را مشاهده و مدیریت کنید.</p>
        
        <h4>مرحله ۵: تکمیل سفارش</h4>
        <p>پس از تأیید محتویات سبد خرید، روی دکمه "تکمیل سفارش" کلیک کنید. اطلاعات مشتری را وارد کرده و بل خرید را دریافت کنید.</p>
        
        <h4>مرحله ۶: ارسال سفارش از طریق واتساپ</h4>
        <p>پس از ایجاد بل خرید، می‌توانید سفارش خود را از طریق واتساپ برای ما ارسال کنید تا فرآیند تحویل آغاز شود.</p>
        
        <h4>نکات مهم:</h4>
        <ul>
            <li>ارسال به سراسر افغانستان رایگان است</li>
            <li>پشتیبانی ۲۴ ساعته برای پاسخگویی به سوالات شما</li>
            <li>گارانتی رضایت کامل از خرید</li>
        </ul>
        
        <p>برای هرگونه سوال در مورد فرآیند خرید، با پشتیبانی ما تماس بگیرید.</p>
    `;
    
    const privacyContent = `
        <h3>حریم خصوصی فروشگاه آنلاین AYM</h3>
        <p>حفظ حریم خصوصی کاربران برای ما بسیار مهم است. در این بخش، سیاست‌های حریم خصوصی فروشگاه آنلاین AYM را بررسی می‌کنیم:</p>
        
        <h4>جمع‌آوری اطلاعات:</h4>
        <p>ما تنها اطلاعات ضروری برای ارائه خدمات را جمع‌آوری می‌کنیم که شامل نام, شماره تماس و آدرس تحویل می‌باشد.</p>
        
        <h4>استفاده از اطلاعات:</h4>
        <p>اطلاعات شما صرفاً برای موارد زیر استفاده می‌شود:</p>
        <ul>
            <li>پردازش و ارسال سفارشات</li>
            <li>ارتباط با شما در مورد سفارشات</li>
            <li>ارائه پشتیبانی مشتری</li>
        </ul>
        
        <h4>حفاظت از اطلاعات:</h4>
        <p>ما از اطلاعات شخصی شما محافظت می‌کنیم و آن را در اختیار شخص ثالث قرار نمی‌دهیم، مگر در مواردی که قانون الزام کند.</p>
        
        <h4>کوکی‌ها:</h4>
        <p>سایت ما از کوکی‌ها برای بهبود تجربه کاربری استفاده می‌کند. شما می‌توانید کوکی‌ها را در مرورگر خود غیرفعال کنید.</p>
        
        <h4>تغییرات سیاست حریم خصوصی:</h4>
        <p>ما ممکن است این سیاست را به‌روزرسانی کنیم. تغییرات در این صفحه منتشر خواهد شد.</p>
        
        <p>اگر سوالی در مورد سیاست حریم خصوصی ما دارید، لطفاً با ما تماس بگیرید.</p>
    `;
    
    const faqContent = `
        <h3>سوالات متداول (FAQ)</h3>
        
        <h4>۱. چگونه از فروشگاه آنلاین AYM خرید کنم؟</h4>
        <p>می‌توانید با مراجعه به تب محصولات، محصول مورد نظر خود را انتخاب و به سبد خرید اضافه کنید. سپس از طریق تب سبد خرید، سفارش خود را تکمیل کنید.</p>
        
        <h4>۲. هزینه ارسال چقدر است؟</h4>
        <p>ارسال به سراسر افغانستان کاملاً رایگان است.</p>
        
        <h4>۳. مدت زمان تحویل چقدر است؟</h4>
        <p>در کابل طی ۲۴ ساعت و در سایر ولایات طی ۳-۵ روز کاری تحویل داده می‌شود.</p>
        
        <h4>۴. چگونه می‌توانم سفارشم را پیگیری کنم؟</h4>
        <p>پس از ثبت سفارش، می‌توانید با شماره ۰۷۸۹۲۸۱۷۷۰ تماس بگیرید و شماره بل خرید خود را ارائه دهید.</p>
        
        <h4>۵. چگونه با پشتیبانی تماس بگیرم؟</h4>
        <p>از طریق شماره ۰۷۸۹۲۸۱۷۷۰ در واتساپ یا تماس تلفنی می‌توانید با پشتیبانی ارتباط برقرار کنید.</p>
        
        <h4>۶. روش‌های پرداخت چه هستند؟</h4>
        <p>پرداخت به صورت نقدی در محل انجام می‌شود.</p>
        
        <h4>۷. آیا امکان مرجوعی کالا وجود دارد؟</h4>
        <p>بله، در صورت وجود مشکل در کالا، تا ۷ روز پس از تحویل امکان مرجوعی وجود دارد.</p>
        
        <p>اگر سوال دیگری دارید که در اینجا پاسخ داده نشده، لطفاً با پشتیبانی تماس بگیرید.</p>
    `;
    
    aboutLink.addEventListener('click', () => {
        showInfoModal('درباره ما', aboutContent);
    });
    
    contactLink.addEventListener('click', () => {
        showInfoModal('تماس با ما', contactContent);
    });
    
    guideLink.addEventListener('click', () => {
        showInfoModal('راهنمای خرید', guideContent);
    });
    
    footerAboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        showInfoModal('درباره ما', aboutContent);
    });
    
    footerContactLink.addEventListener('click', (e) => {
        e.preventDefault();
        showInfoModal('تماس با ما', contactContent);
    });
    
    footerPrivacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        showInfoModal('حریم خصوصی', privacyContent);
    });
    
    footerGuideLink.addEventListener('click', (e) => {
        e.preventDefault();
        showInfoModal('راهنمای خرید', guideContent);
    });
    
    footerFaqLink.addEventListener('click', (e) => {
        e.preventDefault();
        showInfoModal('سوالات متداول', faqContent);
    });
    
    prevPageBtn.addEventListener('click', () => {
        if (db.currentPage > 1) {
            db.currentPage--;
            renderCurrentPage();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        if (db.currentPage < db.getTotalPages()) {
            db.currentPage++;
            renderCurrentPage();
        }
    });
    
    addToCartBtn.addEventListener('click', () => {
        if (db.currentProductId) {
            handlePlusClick(db.currentProductId);
            closeModal(document.getElementById('productDetailModal'));
            alert('محصول به سبد خرید اضافه شد!');
        }
    });
    
    checkoutBtn.addEventListener('click', async () => {
        if (db.cart.length === 0) {
            alert('سبد خرید شما خالی است!');
            return;
        }
        
        showBill();
    });
    
    clearCartBtn.addEventListener('click', () => {
        if (db.cart.length === 0) {
            alert('سبد خرید قبلاً خالی است!');
            return;
        }
        
        if (confirm('آیا مطمئن هستید که می‌خواهید سبد خرید خود را خالی کنید؟')) {
            db.clearCart();
            updateCartCount();
            renderCart();
            renderCurrentPage();
        }
    });
    
    if (whatsappShareBtn) {
        whatsappShareBtn.addEventListener('click', shareOnWhatsApp);
    }
    
    if (printBillBtn) {
        printBillBtn.addEventListener('click', printBill);
    }
    
    if (closeBillBtn) {
        closeBillBtn.addEventListener('click', () => {
            closeModal(document.getElementById('cartModal'));
        });
    }
    
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
    
    const logoImg = document.getElementById('logoImage');
    if (logoImg) {
        logoImg.addEventListener('error', function() {
            document.getElementById('logoFallback').style.display = 'flex';
            this.style.display = 'none';
        });
    }
}

// ============================================
// START THE APPLICATION
// ============================================
document.addEventListener('DOMContentLoaded', initializeApp);