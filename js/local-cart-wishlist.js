// Local E-commerce Cart, Wishlist, and QuickView System
// This mocks the backend behavior completely inside the client browser.

(function() {
    window.localProducts = [];

    function normalizeProduct(p) {
        if (!p) return p;
        var brandStr = '';
        if (p.brand) {
            if (typeof p.brand === 'string') {
                brandStr = p.brand;
            } else if (typeof p.brand === 'object' && p.brand.name) {
                brandStr = p.brand.name;
            }
        }
        var imageStr = p.image || '';
        if (!imageStr && p.images && p.images.length > 0) {
            var primary = null;
            for (var i = 0; i < p.images.length; i++) {
                if (p.images[i].is_primary) {
                    primary = p.images[i];
                    break;
                }
            }
            imageStr = primary ? primary.url : p.images[0].url;
        }
        var priceStr = p.price;
        if (typeof p.price === 'number') {
            priceStr = 'QAR' + p.price.toFixed(2);
        } else if (typeof p.price === 'string' && !p.price.startsWith('QAR')) {
            priceStr = 'QAR' + p.price;
        }
        return Object.assign({}, p, {
            brand: brandStr,
            image: imageStr,
            price: priceStr
        });
    }

    // Load products database on start from backend API
    fetch('http://localhost:5000/api/v1/products?limit=100')
        .then(res => res.json())
        .then(res => {
            window.localProducts = (res.data || []).map(normalizeProduct);
            updateNavCart();
            updateWishlistBadges();
        })
        .catch(err => {
            console.error("Error loading backend products, falling back to local static database:", err);
            // Fallback to static JSON if backend is offline
            fetch('data/products.json')
                .then(r => r.json())
                .then(d => {
                    window.localProducts = (d || []).map(normalizeProduct);
                    updateNavCart();
                    updateWishlistBadges();
                });
        });

    // Cart Helper Functions
    function getCart() {
        return JSON.parse(localStorage.getItem('local_cart') || '[]');
    }

    function saveCart(cart) {
        localStorage.setItem('local_cart', JSON.stringify(cart));
        updateNavCart();
    }

    // Wishlist Helper Functions
    function getWishlist() {
        return JSON.parse(localStorage.getItem('local_wishlist') || '[]');
    }

    function saveWishlist(wishlist) {
        localStorage.setItem('local_wishlist', JSON.stringify(wishlist));
        updateWishlistBadges();
    }

    // Add to cart
    window.addToCartLocal = function(productId, qty) {
        const cart = getCart();
        const existing = cart.find(item => String(item.id) === String(productId));
        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({ id: productId, qty: qty });
        }
        saveCart(cart);
        
        // Trigger Toastr success notification if library is loaded
        if (window.toastr) {
            const prod = window.localProducts.find(p => String(p.id) === String(productId));
            const name = prod ? prod.name : "Product";
            toastr.success(`${name} added to cart!`, 'Cart', {
                CloseButton: true,
                ProgressBar: true
            });
        }
    };

    // Remove from cart
    window.removeFromCartLocal = function(productId) {
        let cart = getCart();
        cart = cart.filter(item => String(item.id) !== String(productId));
        saveCart(cart);
        
        if (window.toastr) {
            toastr.info('Product removed from cart.', 'Cart');
        }
    };

    // Override original addToCart function
    window.addToCart = function(formId = 'add-to-cart-form', redirectToCheckout = false) {
        // Retrieve quantity and product ID from form
        const form = document.getElementById(formId);
        if (!form) return;
        
        const formData = {};
        const elements = form.elements;
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].name) {
                formData[elements[i].name] = elements[i].value;
            }
        }
        
        const productId = formData['id'] || formData['product_id'];
        const qty = parseInt(formData['quantity'] || '1');
        
        if (!productId) {
            // Find product id dynamically in form if it's hidden or input
            const idInput = form.querySelector('input[name="id"], input[name="product_id"]');
            if (idInput) {
                addToCartLocal(idInput.value, qty);
            } else {
                alert("Error: Product ID not found in form.");
            }
        } else {
            addToCartLocal(productId, qty);
        }
        
        // Hide modal if open
        $('#quick-view').modal('hide');
        
        if (redirectToCheckout) {
            alert("Redirecting to checkout... (Mock Checkout Page)");
        }
    };

    // Wishlist functions
    window.addWishlist = function(productId, modalId) {
        const wishlist = getWishlist();
        if (wishlist.map(String).includes(String(productId))) {
            // Remove it (toggle behavior)
            window.removeWishlist(productId, modalId);
            return;
        }
        wishlist.push(productId);
        saveWishlist(wishlist);
        
        // Update wishlist icons on page
        $(`.wishlist_icon_${productId}`).removeClass('fa-heart-o').addClass('fa-heart text-danger');
        
        // Show success modal
        $('#add-wishlist-modal').modal('show');
    };

    window.removeWishlist = function(productId, modalId) {
        let wishlist = getWishlist();
        wishlist = wishlist.filter(id => String(id) !== String(productId));
        saveWishlist(wishlist);
        
        // Update wishlist icons on page
        $(`.wishlist_icon_${productId}`).removeClass('fa-heart text-danger').addClass('fa-heart-o');
        
        // Show remove modal
        $('#remove-wishlist-modal').modal('show');
    };

    // Update Header Navigation Cart Display
    window.updateNavCart = function() {
        const cart = getCart();
        const cartItemsContainer = document.getElementById('cart_items');
        if (!cartItemsContainer) return;
        
        // Calculate totals
        let totalCount = 0;
        let totalPrice = 0.0;
        const renderedItems = [];
        
        cart.forEach(item => {
            const prod = window.localProducts.find(p => String(p.id) === String(item.id) || p.slug.endsWith(String(item.id)));
            if (prod) {
                totalCount += item.qty;
                const priceVal = parseFloat(prod.price.replace(/[^\d\.]/g, '')) || 0;
                totalPrice += priceVal * item.qty;
                renderedItems.push({
                    id: prod.id,
                    slug: prod.slug,
                    name: prod.name,
                    price: prod.price,
                    image: prod.image,
                    qty: item.qty
                });
            }
        });
        
        // Update badge counters
        const badges = document.querySelectorAll('.navbar-tool-label');
        badges.forEach(b => {
            // Check if it's the cart badge (inside #cart_items) or wishlist badge
            if (b.closest('#cart_items')) {
                b.innerHTML = totalCount;
            }
        });
        
        // Update text price
        const cartText = cartItemsContainer.querySelector('.navbar-tool-text');
        if (cartText) {
            cartText.innerHTML = `<small>My cart</small> QAR ${totalPrice.toFixed(2)}`;
        }
        
        // Update cart dropdown widget
        const dropdownMenu = cartItemsContainer.querySelector('.dropdown-menu');
        if (dropdownMenu) {
            let itemsHtml = '';
            if (renderedItems.length === 0) {
                itemsHtml = `
                    <div class="text-center text-capitalize p-3">
                        <img class="mb-3 mw-100" src="images/empty-cart.svg" alt="" style="width: 50px;">
                        <p class="text-capitalize small mb-0">Your Cart is Empty!</p>
                    </div>
                `;
            } else {
                itemsHtml = `
                    <div class="widget-cart px-3 pt-2 pb-3">
                        <div class="widget-cart-top rounded border-bottom mb-2 pb-2">
                            <h6 class="m-0 small font-weight-bold">Shopping Cart (${totalCount} Items)</h6>
                        </div>
                        <div style="max-height: 250px; overflow-y: auto;">
                            ${renderedItems.map(item => `
                                <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                                    <div class="d-flex align-items-center">
                                        <img src="${item.image}" width="40" height="40" class="mr-2 rounded" style="object-fit: cover;" onerror="this.src='images/image-place-holder.png'">
                                        <div>
                                            <a href="product-detail.html?product=${item.slug}" class="small font-weight-semibold text-dark text-truncate d-block" style="max-width: 120px;">
                                                ${item.name}
                                            </a>
                                            <span class="small text-muted">${item.qty} x ${item.price}</span>
                                        </div>
                                    </div>
                                    <button class="btn btn-link text-danger p-0 border-0" onclick="removeFromCartLocal('${item.id}')">
                                        <i class="czi-close"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                            <span class="font-weight-semibold small">Subtotal:</span>
                            <span class="font-weight-bold text-primary">QAR ${totalPrice.toFixed(2)}</span>
                        </div>
                        <div class="mt-3">
                            <a href="shop-cart.html" class="btn btn-primary btn-sm btn-block">View Cart</a>
                        </div>
                    </div>
                `;
            }
            dropdownMenu.innerHTML = itemsHtml;
        }
    };

    // Update Wishlist display
    window.updateWishlistBadges = function() {
        const wishlist = getWishlist();
        const counts = document.querySelectorAll('.countWishlist');
        counts.forEach(c => {
            c.innerHTML = wishlist.length;
        });
        
        // Highlight active wishlist icons on start
        wishlist.forEach(id => {
            $(`.wishlist_icon_${id}`).removeClass('fa-heart-o').addClass('fa-heart text-danger');
        });
    };

    function parsePrice(price) {
        return parseFloat(String(price).replace(/[^\d.]/g, '')) || 0;
    }

    function findProduct(productId) {
        const id = String(productId);
        return window.localProducts.find(prod =>
            String(prod.id) === id ||
            (prod.numeric_id && String(prod.numeric_id) === id) ||
            prod.slug === id ||
            prod.slug.endsWith(id)
        );
    }

    // Quick View popup renderer
    window.quickView = function(productId) {
        const p = findProduct(productId);
        if (!p) {
            console.error("Product not found for QuickView id:", productId);
            return;
        }

        const modalContainer = document.getElementById('quick-view-modal');
        if (!modalContainer) {
            console.warn("quick-view-modal container not found on this page.");
            return;
        }

        const priceNum = parsePrice(p.price);
        const productUrl = 'product-detail.html?product=' + encodeURIComponent(p.slug || p.id);

        modalContainer.innerHTML = `
            <!-- Modal Header -->
            <div class="modal-header d-flex align-items-center justify-content-between py-2 px-3 border-bottom">
                <h5 class="modal-title font-weight-normal mb-0" style="font-size: 18px;">
                    <a href="${productUrl}" class="text-dark text-decoration-none d-flex align-items-center">
                        ${p.name} <i class="fa fa-chevron-right ml-2 text-muted" style="font-size: 14px;"></i>
                    </a>
                </h5>
                <button class="close" type="button" data-dismiss="modal" aria-label="Close" style="font-size: 28px; padding: 0; margin: 0; outline: none; border: 0; background: transparent;">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            
            <div class="modal-body p-3">
                <div class="row">
                    <!-- Left Side: Image and Thumbnails -->
                    <div class="col-lg-6 col-md-6 mb-3">
                        <div class="position-relative d-flex align-items-center justify-content-center p-3 border rounded bg-white" style="height: 380px;">
                            <img src="${p.image}" class="img-fluid" style="max-height: 340px; object-fit: contain;" onerror="this.src='images/image-place-holder.png'">
                            <!-- Brand Logo Overlay -->
                            <div class="position-absolute" style="bottom: 15px; right: 20px; font-weight: 800; font-style: italic; font-size: 22px; color: #dc2626; letter-spacing: 1px; font-family: 'Arial Black', sans-serif;">
                                <span style="font-size: 18px; vertical-align: middle; margin-right: 2px;">▲</span>${p.brand.toUpperCase()}
                            </div>
                        </div>
                        <!-- Thumbnails -->
                        <div class="d-flex mt-2">
                            <div class="border rounded p-1 mr-2 bg-white" style="width: 60px; height: 60px; cursor: pointer;">
                                <img src="${p.image}" class="w-100 h-100" style="object-fit: contain;" onerror="this.src='images/image-place-holder.png'">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right Side: Details and Forms -->
                    <div class="col-lg-6 col-md-6">
                        <div class="product-details">
                            <h2 class="h4 font-weight-normal text-dark mb-2">${p.name}</h2>
                            
                            <!-- Rating -->
                            <div class="d-flex align-items-center mb-3 small text-muted">
                                <span class="text-warning mr-2" style="font-size: 16px;">☆ ☆ ☆ ☆ ☆</span>
                                <span>(0)</span>
                                <span class="mx-2">|</span>
                                <span class="text-primary">0 Reviews</span>
                                <span class="mx-2">|</span>
                                <span class="text-primary">0 Orders</span>
                                <span class="mx-2">|</span>
                                <span class="text-primary">0 Wish Listed</span>
                            </div>
                            
                            <!-- Price -->
                            <div class="h3 font-weight-bold mb-3" style="color: #1b7fed;">
                                ${p.price}
                            </div>
                            
                            <hr class="my-3" style="border-top: 1px solid #edf2f7;">
                            
                            <form id="add-to-cart-form" onsubmit="return false;">
                                <input type="hidden" name="id" value="${p.id}">
                                
                                <!-- Quantity -->
                                <div class="d-flex align-items-center mb-4">
                                    <span class="font-weight-bold text-dark mr-3" style="font-size: 16px; min-width: 80px;">Quantity:</span>
                                    <div class="d-flex align-items-center border rounded" style="border-color: #1b7fed !important; height: 38px; width: 140px; overflow: hidden;">
                                        <button class="btn btn-link text-decoration-none px-3" type="button" id="modal-qty-minus" style="font-size: 18px; color: #1b7fed; font-weight: bold; border: 0; background: transparent;">-</button>
                                        <input type="text" class="form-control text-center font-weight-bold p-0 border-0" id="modal-qty" name="quantity" value="1" readonly style="color: #334155; font-size: 16px;">
                                        <button class="btn btn-link text-decoration-none px-3" type="button" id="modal-qty-plus" style="font-size: 18px; color: #1b7fed; font-weight: bold; border: 0; background: transparent;">+</button>
                                    </div>
                                </div>
                                
                                <!-- Total Price -->
                                <div class="mb-4 text-dark font-weight-bold" style="font-size: 16px;">
                                    Total Price : <span id="modal-total-price" style="color: #1b7fed;">${p.price}</span> <span class="font-weight-normal text-muted" style="font-size: 12px; margin-left: 5px;">(Tax : incl.)</span>
                                </div>
                                
                                <!-- Buttons -->
                                <div class="d-flex align-items-center flex-wrap gap-2 mb-3">
                                    <button class="btn btn-dark px-4 py-2 font-weight-bold mr-2" type="button" id="modal-buy-now" style="background: #000; border-radius: 4px; height: 42px; min-width: 110px;">Buy now</button>
                                    <button class="btn btn-primary px-4 py-2 font-weight-bold mr-2" type="button" id="modal-add-cart" style="background: #1b7fed; border-radius: 4px; height: 42px; min-width: 120px;">Add to cart</button>
                                    <button class="btn btn-outline-secondary px-3 py-2" type="button" id="modal-add-wishlist" style="border-color: #e2e8f0; color: #1b7fed; height: 42px; border-radius: 4px;">
                                        <i class="fa fa-heart-o mr-2"></i>0
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <!-- Tabs Section (Overview, Reviews, Tech Data) -->
                    <div class="col-12 mt-4 pt-3 border-top">
                        <ul class="nav nav-tabs" role="tablist" style="margin-bottom: 15px;">
                            <li class="nav-item">
                                <a class="nav-link active font-weight-bold text-dark" data-toggle="tab" href="#modal-overview" role="tab">Overview</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link font-weight-bold text-dark" data-toggle="tab" href="#modal-reviews" role="tab">Reviews</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link font-weight-bold text-dark" data-toggle="tab" href="#modal-tech" role="tab">Technical data</a>
                            </li>
                        </ul>
                        <div class="tab-content">
                            <div class="tab-pane fade show active" id="modal-overview" role="tabpanel">
                                <p class="text-muted" style="line-height: 1.6;">${p.description}</p>
                            </div>
                            <div class="tab-pane fade" id="modal-reviews" role="tabpanel">
                                <div class="text-center py-3 text-muted small">No reviews yet for this product.</div>
                            </div>
                            <div class="tab-pane fade" id="modal-tech" role="tabpanel">
                                ${(p.category_id === 17 || (p.name && (p.name.toLowerCase().indexOf('machine') !== -1 || p.name.toLowerCase().indexOf('welder') !== -1 || p.name.toLowerCase().indexOf('grinder') !== -1 || p.name.toLowerCase().indexOf('saw') !== -1))) ? `
                                    <div class="table-responsive small" style="max-height: 350px; overflow-y: auto;">
                                        <table class="table table-bordered table-sm mb-0">
                                            <thead class="thead-light">
                                                <tr><th colspan="2" class="font-weight-bold text-primary">PLANER FSC 260</th></tr>
                                            </thead>
                                            <tbody>
                                                <tr class="table-secondary"><td colspan="2" class="font-weight-bold">DIMENSIONS</td></tr>
                                                <tr><td>Dimensions with morticer and hand</td><td>1250 X 1100 mm</td></tr>
                                                <tr><td>Dimensions without morticer</td><td>1180 X 460 mm</td></tr>
                                                <tr><td>Net weight</td><td>160 Kg</td></tr>
                                                
                                                <tr class="table-secondary"><td colspan="2" class="font-weight-bold">MOTOR</td></tr>
                                                <tr><td>Powerful</td><td>3 hp</td></tr>
                                                <tr><td>Type</td><td>1 Phase (220 V) (3 Phase on demand)</td></tr>
                                                
                                                <tr class="table-secondary"><td colspan="2" class="font-weight-bold">SURFACE PLANER – THICKNESSES PLANER</td></tr>
                                                <tr><td>Number of Knives</td><td>N° 3</td></tr>
                                                <tr><td>Length of planer spindle</td><td>260 mm</td></tr>
                                                <tr><td>Diameter of planer spindle</td><td>70 mm</td></tr>
                                                <tr><td>Length of cast iron table</td><td>1150 X 260 mm</td></tr>
                                                <tr><td>Length of thicknesses table (excl. extension)</td><td>520 mm</td></tr>
                                                <tr><td>Type of table</td><td>Tilt cast iron</td></tr>
                                                <tr><td>Maximum working width</td><td>260 mm</td></tr>
                                                <tr><td>Maximum working height</td><td>240 mm</td></tr>
                                                <tr><td>Feeding Speed</td><td>7 m/min</td></tr>
                                                <tr><td>Max Removal with surface planer</td><td>4 mm</td></tr>
                                                
                                                <tr class="table-secondary"><td colspan="2" class="font-weight-bold">MORTICER</td></tr>
                                                <tr><td>Stroke of chisel head</td><td>100 mm</td></tr>
                                                <tr><td>Table movement side to side</td><td>115 mm</td></tr>
                                                <tr><td>Table movement front to back</td><td>80 mm</td></tr>
                                                <tr><td>Size of cast iron table</td><td>360 x 210 mm</td></tr>
                                                <tr><td>Rotation</td><td>Counter – Clockwise</td></tr>
                                            </tbody>
                                            
                                            <thead class="thead-light">
                                                <tr><th colspan="2" class="font-weight-bold text-primary">TABLE SAW TSI STANDARD</th></tr>
                                            </thead>
                                            <tbody>
                                                <tr class="table-secondary"><td colspan="2" class="font-weight-bold">DIMENSIONS</td></tr>
                                                <tr><td>Dimensions with carriage</td><td>1200 x 1800 mm</td></tr>
                                                <tr><td>Dimensions without carriage</td><td>540 x 1800 mm</td></tr>
                                                <tr><td>Net weight</td><td>280 Kg</td></tr>
                                                
                                                <tr class="table-secondary"><td colspan="2" class="font-weight-bold">CIRCULAR SAW</td></tr>
                                                <tr><td>Saw Diameter</td><td>305 mm</td></tr>
                                                <tr><td>Saw blade engrave Diameter</td><td>80 mm</td></tr>
                                                <tr><td>Type</td><td>Tilts from 0° to 45° – Height adjustable</td></tr>
                                                <tr><td>Speed Blade</td><td>5200 rpm</td></tr>
                                                <tr><td>Maximum depth of cut</td><td>95 mm</td></tr>
                                                
                                                <tr class="table-secondary"><td colspan="2" class="font-weight-bold">SLIDING CARRIAGE</td></tr>
                                                <tr><td>Dimensions carriage</td><td>700 x 530 mm</td></tr>
                                                <tr><td>Type carriage</td><td>Alloy track close to blade</td></tr>
                                                <tr><td>Maximum cutting</td><td>1200 mm</td></tr>
                                                <tr><td>Carriage stroke</td><td>1300 mm</td></tr>
                                                
                                                <tr class="table-secondary"><td colspan="2" class="font-weight-bold">SPINDLE MOULDER</td></tr>
                                                <tr><td>Type</td><td>Vertical</td></tr>
                                                <tr><td>Max spindle height</td><td>115 mm (30 mm)</td></tr>
                                                <tr><td>Max diameter spindle tooling</td><td>220 mm</td></tr>
                                                <tr><td>Speeds</td><td>1750-3500-6700 rpm</td></tr>
                                                
                                                <tr class="table-secondary"><td colspan="2" class="font-weight-bold">MOTOR SPINDLE MOULDER</td></tr>
                                                <tr><td>Powerful</td><td>3 Hp</td></tr>
                                                <tr><td>Voltage</td><td>1 Phase 220 V (3 Phase on demand)</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ` : '<div class="text-center py-3 text-muted small">No technical specifications available.</div>'}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Similar Products Section -->
                    <div class="col-12 mt-4 pt-3 border-top">
                        <h6 class="font-weight-bold mb-3 text-dark">Similar Products</h6>
                        <div class="row">
                            ${window.localProducts.filter(item => 
                                String(item.id) !== String(p.id) && (
                                    item.category_id === p.category_id ||
                                    item.featured ||
                                    item.best_selling
                                )
                            ).slice(0, 3).map(item => `
                                <div class="col-lg-4 col-md-4 col-sm-6 col-6 p-2">
                                    <div class="card h-100 border p-2 text-center" style="cursor: pointer; transition: all 0.2s;" onclick="quickView('${item.id}')" onmouseover="this.style.borderColor='#1b7fed'" onmouseout="this.style.borderColor='#e2e8f0'">
                                        <img src="${item.image}" class="img-fluid mb-2 mx-auto" style="height: 100px; object-fit: contain;" onerror="this.src='images/image-place-holder.png'">
                                        <div class="small font-weight-bold text-dark text-truncate mb-1">${item.name}</div>
                                        <div class="small text-primary font-weight-bold">${item.price}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Wire modal controls
        const qtyInput = document.getElementById('modal-qty');
        const totalPriceVal = document.getElementById('modal-total-price');
        const minusBtn = document.getElementById('modal-qty-minus');
        const plusBtn = document.getElementById('modal-qty-plus');
        const addCartBtn = document.getElementById('modal-add-cart');
        const buyNowBtn = document.getElementById('modal-buy-now');
        const wishBtn = document.getElementById('modal-add-wishlist');

        const updateModalTotal = function() {
            const qty = Math.max(1, parseInt(qtyInput.value || '1', 10));
            qtyInput.value = qty;
            totalPriceVal.innerText = 'QAR' + (priceNum * qty).toFixed(2);
        };

        if (minusBtn && plusBtn && qtyInput) {
            minusBtn.addEventListener('click', function() {
                const cur = parseInt(qtyInput.value || '1', 10);
                if (cur > 1) {
                    qtyInput.value = cur - 1;
                    updateModalTotal();
                }
            });
            plusBtn.addEventListener('click', function() {
                const cur = parseInt(qtyInput.value || '1', 10);
                qtyInput.value = cur + 1;
                updateModalTotal();
            });
        }

        if (addCartBtn) {
            addCartBtn.addEventListener('click', function() {
                if (window.addToCartLocal) {
                    window.addToCartLocal(p.id, parseInt(qtyInput.value || '1', 10));
                    $('#quick-view').modal('hide');
                } else {
                    addToCart('add-to-cart-form');
                    $('#quick-view').modal('hide');
                }
            });
        }

        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', function() {
                if (window.addToCartLocal) {
                    window.addToCartLocal(p.id, parseInt(qtyInput.value || '1', 10));
                    $('#quick-view').modal('hide');
                    alert('Product added. Continue to checkout from the cart.');
                } else {
                    addToCart('add-to-cart-form', true);
                    $('#quick-view').modal('hide');
                }
            });
        }

        if (wishBtn) {
            wishBtn.addEventListener('click', function() {
                if (window.addWishlist) {
                    window.addWishlist(p.id, 'add-wishlist-modal');
                }
            });
        }

        // Open modal
        $('#quick-view').modal('show');
    };

    // Alias for wishlist handler used in product-detail.html
    window.addToWishlistLocal = function(productId) {
        window.addWishlist(productId, 'add-wishlist-modal');
    };

    // Mock search-suggestions endpoint client-side
    $(function() {
        if (window.jQuery) {
            const mockSearch = function(options, successCb, completeCb) {
                const query = (options.data && options.data.name) ? options.data.name.toLowerCase().trim() : '';
                const filtered = (window.localProducts || []).filter(p => 
                    p.name.toLowerCase().includes(query) || 
                    (p.brand && p.brand.toLowerCase().includes(query)) ||
                    (p.description && p.description.toLowerCase().includes(query))
                );
                
                let html = '';
                if (filtered.length === 0) {
                    html = '<div class="p-3 text-center text-muted small">No products found</div>';
                } else {
                    html = '<ul class="list-group list-group-flush list-group-raw m-0 p-0" style="list-style: none;">';
                    filtered.forEach(p => {
                        html += `
                            <li class="p-2 border-bottom hover-bg-light" style="cursor: pointer;" onclick="window.location.href='products.html?product=${encodeURIComponent(p.slug)}'">
                                <div class="d-flex align-items-center">
                                    <img src="${p.image}" width="36" height="36" class="mr-2 rounded" style="object-fit: cover;" onerror="this.src='images/image-place-holder.png'">
                                    <div style="line-height: 1.2;">
                                        <a href="products.html?product=${encodeURIComponent(p.slug)}" class="small font-weight-semibold text-dark text-truncate d-block" style="max-width: 200px; text-decoration: none;">
                                            ${p.name}
                                        </a>
                                        <span class="small text-primary font-weight-bold">${p.price}</span>
                                    </div>
                                </div>
                            </li>
                        `;
                    });
                    html += '</ul>';
                }
                
                setTimeout(() => {
                    if (successCb) successCb({ result: html });
                    if (completeCb) completeCb();
                }, 100);
            };

            const originalAjax = window.jQuery.ajax;
            window.jQuery.ajax = function(url, options) {
                let opts = options;
                let targetUrl = url;
                if (typeof url === 'object') {
                    opts = url;
                    targetUrl = opts.url;
                }
                if (targetUrl === 'searched-products') {
                    const dfd = window.jQuery.Deferred();
                    if (opts.beforeSend) opts.beforeSend();
                    mockSearch(opts, opts.success, () => {
                        if (opts.complete) opts.complete();
                        dfd.resolve({ result: '' });
                    });
                    return dfd.promise();
                }
                return originalAjax.apply(this, arguments);
            };

            const originalGet = window.jQuery.get;
            window.jQuery.get = function(url, data, success, dataType) {
                let opts = {};
                if (typeof url === 'object') {
                    opts = url;
                } else {
                    opts.url = url;
                    opts.data = data;
                    opts.success = success;
                    opts.dataType = dataType;
                }
                if (opts.url === 'searched-products') {
                    const dfd = window.jQuery.Deferred();
                    if (opts.beforeSend) opts.beforeSend();
                    mockSearch(opts, opts.success, () => {
                        if (opts.complete) opts.complete();
                        dfd.resolve({ result: '' });
                    });
                    return dfd.promise();
                }
                return originalGet.apply(this, arguments);
            };
        }

        // --- AUTH NAVIGATION & MODAL INTERACTION ---
        function updateAuthUI() {
            const token = localStorage.getItem('token');
            const userRaw = localStorage.getItem('user');
            
            if (token && userRaw) {
                try {
                    const user = JSON.parse(userRaw);
                    const authHtml = `
                        <div class="dropdown-item text-primary font-weight-bold py-2 border-bottom">
                            Hello, ${user.name}
                        </div>
                        <a class="dropdown-item" href="#" id="auth-logout">
                            <i class="fa fa-sign-out mr-2"></i>Sign out
                        </a>
                    `;
                    $('.__auth-dropdown').html(authHtml);
                    
                    // Attach logout handler
                    $('#auth-logout').on('click', function(e) {
                        e.preventDefault();
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.reload();
                    });
                } catch(e) {
                    console.error("Auth UI parse error:", e);
                }
            } else {
                // Not logged in
                const guestHtml = `
                    <a class="dropdown-item btn-trigger-auth" href="#">
                        <i class="fa fa-sign-in mr-2"></i> Sign in
                    </a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item btn-trigger-auth" href="#">
                        <i class="fa fa-user-circle mr-2"></i>Sign up
                    </a>
                `;
                $('.__auth-dropdown').html(guestHtml);
                
                // Intercept mobile authentication buttons
                $('a[href*="customer/auth/login"], a[href*="customer/auth/sign-up"], .btn-trigger-auth').on('click', function(e) {
                    e.preventDefault();
                    showAuthModal();
                });
            }
        }

        function showAuthModal() {
            if ($('#loginModal').length === 0) {
                const modalHtml = `
                    <div class="modal fade" id="loginModal" tabindex="-1" role="dialog" aria-hidden="true" style="z-index: 99999;">
                        <div class="modal-dialog modal-dialog-centered" role="document">
                            <div class="modal-content" style="border-radius: 12px; overflow: hidden; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
                                <div class="modal-header border-0 bg-light py-3">
                                    <h5 class="modal-title font-weight-bold" style="color: #0f172a;">Sign In / Sign Up</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body p-4">
                                    <ul class="nav nav-tabs border-bottom mb-3" role="tablist">
                                        <li class="nav-item">
                                            <a class="nav-link active font-weight-semibold" data-toggle="tab" href="#modal-login-tab" role="tab">Sign In</a>
                                        </li>
                                        <li class="nav-item">
                                            <a class="nav-link font-weight-semibold" data-toggle="tab" href="#modal-register-tab" role="tab">Sign Up</a>
                                        </li>
                                    </ul>
                                    <div class="tab-content pt-2">
                                        <div class="tab-pane active" id="modal-login-tab" role="tabpanel">
                                            <form id="modal-login-form">
                                                <div class="form-group">
                                                    <label class="small font-weight-bold text-dark">Email Address</label>
                                                    <input type="email" id="modal-login-email" class="form-control" placeholder="E.g. customer@example.com" required style="border-radius: 8px;">
                                                </div>
                                                <div class="form-group">
                                                    <label class="small font-weight-bold text-dark">Password</label>
                                                    <input type="password" id="modal-login-password" class="form-control" placeholder="••••••••" required style="border-radius: 8px;">
                                                </div>
                                                <button type="submit" class="btn btn-primary btn-block mt-4" style="border-radius: 8px;">Log In</button>
                                            </form>
                                        </div>
                                        <div class="tab-pane" id="modal-register-tab" role="tabpanel">
                                            <form id="modal-register-form">
                                                <div class="form-group">
                                                    <label class="small font-weight-bold text-dark">Full Name</label>
                                                    <input type="text" id="modal-register-name" class="form-control" placeholder="E.g. Maulik Joshi" required style="border-radius: 8px;">
                                                </div>
                                                <div class="form-group">
                                                    <label class="small font-weight-bold text-dark">Email Address</label>
                                                    <input type="email" id="modal-register-email" class="form-control" placeholder="E.g. customer@example.com" required style="border-radius: 8px;">
                                                </div>
                                                <div class="form-group">
                                                    <label class="small font-weight-bold text-dark">Phone Number</label>
                                                    <input type="text" id="modal-register-phone" class="form-control" placeholder="E.g. +974 5555 1234" style="border-radius: 8px;">
                                                </div>
                                                <div class="form-group">
                                                    <label class="small font-weight-bold text-dark">Password (min 6 chars)</label>
                                                    <input type="password" id="modal-register-password" class="form-control" placeholder="••••••••" required style="border-radius: 8px;">
                                                </div>
                                                <button type="submit" class="btn btn-primary btn-block mt-4" style="border-radius: 8px;">Create Account</button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                $('body').append(modalHtml);

                // Handle login
                $('#modal-login-form').on('submit', function(e) {
                    e.preventDefault();
                    const email = $('#modal-login-email').val();
                    const password = $('#modal-login-password').val();
                    
                    $.ajax({
                        url: 'http://localhost:5000/api/v1/auth/login',
                        method: 'POST',
                        data: JSON.stringify({ email, password }),
                        contentType: 'application/json',
                        success: function(res) {
                            localStorage.setItem('token', res.data.token);
                            localStorage.setItem('user', JSON.stringify(res.data.user));
                            $('#loginModal').modal('hide');
                            alert('Welcome back, ' + res.data.user.name + '!');
                            window.location.reload();
                        },
                        error: function(err) {
                            alert(err.responseJSON ? err.responseJSON.message : 'Invalid credentials');
                        }
                    });
                });

                // Handle registration
                $('#modal-register-form').on('submit', function(e) {
                    e.preventDefault();
                    const payload = {
                        name: $('#modal-register-name').val(),
                        email: $('#modal-register-email').val(),
                        phone: $('#modal-register-phone').val(),
                        password: $('#modal-register-password').val()
                    };

                    $.ajax({
                        url: 'http://localhost:5000/api/v1/auth/register',
                        method: 'POST',
                        data: JSON.stringify(payload),
                        contentType: 'application/json',
                        success: function(res) {
                            localStorage.setItem('token', res.data.token);
                            localStorage.setItem('user', JSON.stringify(res.data.user));
                            $('#loginModal').modal('hide');
                            alert('Registration successful! Welcome, ' + res.data.user.name + '!');
                            window.location.reload();
                        },
                        error: function(err) {
                            alert(err.responseJSON ? err.responseJSON.message : 'Registration failed');
                        }
                    });
                });
            }
            $('#loginModal').modal('show');
        }

        updateAuthUI();
    });
})();
