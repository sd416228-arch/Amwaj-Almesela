// Local E-commerce Cart, Wishlist, and QuickView System
// This mocks the backend behavior completely inside the client browser.

(function() {
    window.localProducts = [];

    // Load products database on start from backend API
    fetch('http://localhost:5000/api/v1/products?limit=100')
        .then(res => res.json())
        .then(res => {
            window.localProducts = res.data;
            updateNavCart();
            updateWishlistBadges();
        })
        .catch(err => {
            console.error("Error loading backend products, falling back to local static database:", err);
            // Fallback to static JSON if backend is offline
            fetch('data/products.json')
                .then(r => r.json())
                .then(d => {
                    window.localProducts = d;
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
        const existing = cart.find(item => item.id === productId);
        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({ id: productId, qty: qty });
        }
        saveCart(cart);
        
        // Trigger Toastr success notification if library is loaded
        if (window.toastr) {
            const prod = window.localProducts.find(p => p.id === productId);
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
        cart = cart.filter(item => item.id !== productId);
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
        if (wishlist.includes(productId)) {
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
        wishlist = wishlist.filter(id => id !== productId);
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
            const prod = window.localProducts.find(p => p.id === item.id || p.slug.endsWith(item.id));
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

    function findProduct(productId) {
        const id = String(productId);
        return window.localProducts.find(prod =>
            prod.id === id ||
            String(prod.numeric_id) === id ||
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

        // Render dynamic quick view HTML
        const modalContainer = document.getElementById('quick-view-modal');
        if (!modalContainer) {
            // Create quick view modal elements if not exists on products pages
            console.warn("quick-view-modal container not found on this page.");
            return;
        }

        modalContainer.innerHTML = `
            <button class="close" type="button" data-dismiss="modal" aria-label="Close" style="position: absolute; right: 15px; top: 10px; z-index: 10;">
                <span aria-hidden="true">&times;</span>
            </button>
            <div class="modal-body">
                <div class="row">
                    <div class="col-lg-6 col-md-6 mb-3">
                        <div class="d-flex align-items-center justify-content-center p-3 border rounded bg-white">
                            <img src="${p.image}" class="img-fluid" style="max-height: 250px; object-fit: contain;" onerror="this.src='images/image-place-holder.png'">
                        </div>
                    </div>
                    <div class="col-lg-6 col-md-6">
                        <div class="product-details">
                            <span class="small text-primary font-weight-bold">${p.brand}</span>
                            <h2 class="h5 font-weight-bold mt-1">${p.name}</h2>
                            <h3 class="h6 text-accent text-primary">${p.price}</h3>
                            
                            <hr class="my-2">
                            <form id="add-to-cart-form" class="mt-3">
                                <input type="hidden" name="id" value="${p.id}">
                                <div class="form-group d-flex align-items-center mb-3">
                                    <div class="mr-3" style="width: 100px;">
                                        <label class="small text-muted mb-1 d-block">Quantity</label>
                                        <div class="input-group input-group-sm">
                                            <div class="input-group-prepend">
                                                <button class="btn btn-outline-secondary px-2" type="button" onclick="const q = document.getElementById('modal-qty'); if(parseInt(q.value) > 1) q.value = parseInt(q.value) - 1;">-</button>
                                            </div>
                                            <input type="text" class="form-control text-center font-weight-bold p-0" id="modal-qty" name="quantity" value="1" readonly>
                                            <div class="input-group-append">
                                                <button class="btn btn-outline-secondary px-2" type="button" onclick="const q = document.getElementById('modal-qty'); q.value = parseInt(q.value) + 1;">+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex-grow-1 pt-3">
                                        <button class="btn btn-primary btn-block btn-sm" type="button" onclick="addToCart('add-to-cart-form')">
                                            <i class="czi-cart mr-2"></i>Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </form>
                            
                            <div class="d-flex align-items-center">
                                <button class="btn btn-outline-danger btn-sm" type="button" onclick="addWishlist('${p.id}')">
                                    <i class="czi-heart mr-1"></i>Wishlist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

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
                const filtered = (window.localProducts || []).filter(p => {
                    const b = typeof p.brand === 'object' && p.brand ? p.brand.name : p.brand;
                    return p.name.toLowerCase().includes(query) || 
                        (b && b.toLowerCase().includes(query)) ||
                        (p.description && p.description.toLowerCase().includes(query));
                });
                
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
                            <div class="modal-content" style="border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: var(--hover-shadow);">
                                <div class="modal-header border-0 bg-light py-3 d-flex align-items-center justify-content-between">
                                    <h5 class="modal-title font-weight-bold" style="font-family: var(--font-heading); color: var(--dark-slate); font-size: 20px;">Amwaj Customer Account</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" style="font-size: 24px; padding: 0; margin: 0; color: #64748b; background: transparent; border: none; outline: none; cursor: pointer;">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body p-4">
                                    <ul class="nav nav-tabs border-bottom mb-4" role="tablist" style="border-color: #f1f5f9 !important;">
                                        <li class="nav-item" style="width: 50%;">
                                            <a class="nav-link active font-weight-bold text-center border-0" data-toggle="tab" href="#modal-login-tab" role="tab" style="font-family: var(--font-heading); border-bottom: 2px solid transparent !important; color: #64748b; padding-bottom: 12px;">Sign In</a>
                                        </li>
                                        <li class="nav-item" style="width: 50%;">
                                            <a class="nav-link font-weight-bold text-center border-0" data-toggle="tab" href="#modal-register-tab" role="tab" style="font-family: var(--font-heading); border-bottom: 2px solid transparent !important; color: #64748b; padding-bottom: 12px;">Sign Up</a>
                                        </li>
                                    </ul>
                                    <style>
                                        #loginModal .nav-tabs .nav-link.active {
                                            color: var(--primary-color) !important;
                                            border-bottom: 2px solid var(--primary-color) !important;
                                            background: transparent !important;
                                        }
                                        #loginModal .form-control {
                                            border-radius: 10px !important;
                                            border: 1px solid #cbd5e1 !important;
                                            padding: 10px 14px !important;
                                            font-size: 14px !important;
                                        }
                                        #loginModal .form-control:focus {
                                            border-color: var(--primary-color) !important;
                                            box-shadow: 0 0 0 3px var(--primary-glow) !important;
                                        }
                                    </style>
                                    <div class="tab-content pt-1">
                                        <div class="tab-pane active" id="modal-login-tab" role="tabpanel">
                                            <form id="modal-login-form">
                                                <div class="form-group mb-3">
                                                    <label class="small font-weight-bold text-dark mb-1">Email Address</label>
                                                    <input type="email" id="modal-login-email" class="form-control" placeholder="E.g. customer@example.com" required>
                                                </div>
                                                <div class="form-group mb-4">
                                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                                        <label class="small font-weight-bold text-dark mb-0">Password</label>
                                                    </div>
                                                    <input type="password" id="modal-login-password" class="form-control" placeholder="••••••••" required>
                                                </div>
                                                <button type="submit" class="btn btn-primary btn-block text-white py-2 btn-login-submit" style="font-weight: 700; border-radius: 12px;">Log In</button>
                                            </form>
                                        </div>
                                        <div class="tab-pane" id="modal-register-tab" role="tabpanel">
                                            <form id="modal-register-form">
                                                <div class="form-group mb-3">
                                                    <label class="small font-weight-bold text-dark mb-1">Full Name</label>
                                                    <input type="text" id="modal-register-name" class="form-control" placeholder="E.g. Maulik Joshi" required>
                                                </div>
                                                <div class="form-group mb-3">
                                                    <label class="small font-weight-bold text-dark mb-1">Email Address</label>
                                                    <input type="email" id="modal-register-email" class="form-control" placeholder="E.g. customer@example.com" required>
                                                </div>
                                                <div class="form-group mb-3">
                                                    <label class="small font-weight-bold text-dark mb-1">Phone Number</label>
                                                    <input type="text" id="modal-register-phone" class="form-control" placeholder="E.g. +974 5555 1234">
                                                </div>
                                                <div class="form-group mb-4">
                                                    <label class="small font-weight-bold text-dark mb-1">Password (min 6 characters)</label>
                                                    <input type="password" id="modal-register-password" class="form-control" placeholder="••••••••" required minlength="6">
                                                </div>
                                                <button type="submit" class="btn btn-primary btn-block text-white py-2 btn-register-submit" style="font-weight: 700; border-radius: 12px;">Create Account</button>
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
                    const submitBtn = $('.btn-login-submit');
                    const originalText = submitBtn.text();

                    submitBtn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin mr-2"></i>Verifying...');
                    
                    $.ajax({
                        url: 'http://localhost:5000/api/v1/auth/login',
                        method: 'POST',
                        data: JSON.stringify({ email, password }),
                        contentType: 'application/json',
                        success: function(res) {
                            localStorage.setItem('token', res.data.token);
                            localStorage.setItem('user', JSON.stringify(res.data.user));
                            $('#loginModal').modal('hide');
                            
                            if (window.toastr) {
                                toastr.success('Welcome back, ' + res.data.user.name + '!', 'Login Successful');
                            }
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        },
                        error: function(err) {
                            submitBtn.prop('disabled', false).text(originalText);
                            const msg = err.responseJSON ? err.responseJSON.message : 'Invalid credentials';
                            if (window.toastr) {
                                toastr.error(msg, 'Authentication Failed');
                            } else {
                                alert(msg);
                            }
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
                    const submitBtn = $('.btn-register-submit');
                    const originalText = submitBtn.text();

                    submitBtn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin mr-2"></i>Registering...');
 
                    $.ajax({
                        url: 'http://localhost:5000/api/v1/auth/register',
                        method: 'POST',
                        data: JSON.stringify(payload),
                        contentType: 'application/json',
                        success: function(res) {
                            localStorage.setItem('token', res.data.token);
                            localStorage.setItem('user', JSON.stringify(res.data.user));
                            $('#loginModal').modal('hide');
                            
                            if (window.toastr) {
                                toastr.success('Welcome to Amwaj Store, ' + res.data.user.name + '!', 'Registration Successful');
                            }
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        },
                        error: function(err) {
                            submitBtn.prop('disabled', false).text(originalText);
                            const msg = err.responseJSON ? err.responseJSON.message : 'Registration failed';
                            if (window.toastr) {
                                toastr.error(msg, 'Account Creation Failed');
                            } else {
                                alert(msg);
                            }
                        }
                    });
                });
            }
            $('#loginModal').modal('show');
        }
 
        updateAuthUI();
    });
})();
