(function () {
    'use strict';

    const PRODUCTS_PER_PAGE = 12;
    let globalCategories = [];
    let globalProducts = [];

    function getCategoryIdsForFilter(catId, categories) {
        const id = parseInt(catId, 10);
        const parent = categories.find(function (c) { return c.id === id; });
        if (parent) {
            const ids = [id];
            parent.subcategories.forEach(function (sub) { ids.push(sub.id); });
            return ids;
        }
        return [id];
    }

    function findCategoryName(catId, categories) {
        const id = parseInt(catId, 10);
        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];
            if (cat.id === id) return cat.name;
            const sub = cat.subcategories.find(function (s) { return s.id === id; });
            if (sub) return sub.name;
        }
        return 'Category';
    }

    function parsePrice(price) {
        return parseFloat(String(price).replace(/[^\d.]/g, '')) || 0;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }

    function injectProductDetailStyles() {
        if (document.getElementById('local-product-detail-styles')) return;

        const style = document.createElement('style');
        style.id = 'local-product-detail-styles';
        style.innerHTML = `
            .local-product-page {
                background: #f8fafc;
                padding-top: 1.5rem;
                padding-bottom: 2rem;
            }

            .local-product-shell {
                display: grid;
                grid-template-columns: minmax(280px, 1fr) minmax(320px, 1.24fr) 320px;
                gap: 24px;
                align-items: start;
            }

            .local-product-gallery,
            .local-product-info,
            .local-store-card,
            .local-related-card,
            .local-product-tabs {
                background: #fff;
                border: 1px solid #e4efff;
                box-shadow: 0 4px 12px rgba(20, 85, 172, .03);
            }

            .local-product-gallery,
            .local-product-tabs {
                border-radius: 6px;
            }

            .local-product-info {
                border-color: transparent;
                box-shadow: none;
                background: transparent;
            }

            .local-main-image {
                min-height: 400px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                position: relative;
            }

            .local-main-image img {
                max-width: 100%;
                max-height: 360px;
                object-fit: contain;
            }

            .local-share-btn {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 0;
                background: #85c93d;
                color: #fff;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                cursor: pointer;
            }

            .local-thumb {
                width: 64px;
                height: 64px;
                border: 1px solid #e0ebfb;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fff;
                margin-top: 10px;
                cursor: pointer;
            }

            .local-thumb img {
                max-width: 50px;
                max-height: 50px;
                object-fit: contain;
            }

            .local-product-title {
                color: #2b3344;
                font-size: 22px;
                line-height: 1.3;
                font-weight: 700;
                margin-bottom: 8px;
            }

            .local-rating {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
                color: #4b566b;
                font-size: 13px;
                margin-bottom: 14px;
            }

            .local-stars {
                color: #fe9a42;
                letter-spacing: 1px;
                white-space: nowrap;
            }

            .local-price {
                color: #1b7fed;
                font-size: 26px;
                font-weight: 700;
                margin-bottom: 18px;
            }

            .local-quantity-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
            }

            .local-qty-control {
                display: inline-grid;
                grid-template-columns: 32px 42px 32px;
                height: 36px;
                border: 1px solid #dae1e7;
                border-radius: 4px;
                overflow: hidden;
                background: #fff;
            }

            .local-qty-control button,
            .local-qty-control input {
                border: 0;
                background: #fff;
                color: #1b7fed;
                text-align: center;
                font-size: 14px;
                padding: 0;
            }

            .local-qty-control button {
                cursor: pointer;
                font-weight: bold;
            }

            .local-qty-control input {
                color: #3f4a5f;
                border-left: 1px solid #dae1e7;
                border-right: 1px solid #dae1e7;
            }

            .local-total {
                font-size: 15px;
                font-weight: 600;
                color: #373f50;
                margin-bottom: 20px;
            }

            .local-total span {
                color: #1b7fed;
                font-weight: 700;
            }

            .local-action-row {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                align-items: center;
            }

            .local-buy-btn,
            .local-cart-btn,
            .local-wish-btn {
                height: 40px;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 600;
                border: 0;
                padding: 0 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }

            .local-buy-btn {
                background: #000;
                color: #fff;
            }

            .local-cart-btn {
                background: #1b7fed;
                color: #fff;
            }

            .local-wish-btn {
                background: #fff;
                color: #7d879c;
                border: 1px solid #dae1e7;
                min-width: 48px;
                padding: 0 12px;
            }

            .local-wish-btn i {
                font-size: 16px;
            }

            .local-side-panel {
                display: grid;
                gap: 16px;
            }

            .local-service-list {
                background: #fff;
                border-radius: 4px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(20, 85, 172, .03);
            }

            .local-service-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px 16px;
                border-bottom: 1px solid #eef2f7;
                color: #6c727f;
                font-size: 13px;
            }

            .local-service-item:last-child {
                border-bottom: 0;
            }

            .local-service-icon {
                width: 24px;
                text-align: center;
                font-size: 16px;
            }

            .local-store-card {
                border-radius: 4px;
                padding: 20px;
                text-align: center;
            }

            .local-store-avatar {
                width: 64px;
                height: 64px;
                margin: 4px auto 16px;
                border-radius: 50%;
                background: #eef6ff;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #9ab1cc;
                font-size: 24px;
            }

            .local-store-name {
                color: #373f50;
                font-size: 15px;
                font-weight: 700;
                margin-bottom: 16px;
            }

            .local-store-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                color: #1b7fed;
                font-size: 13px;
            }

            .local-store-stats div:first-child {
                border-right: 1px solid #e4ebf4;
            }

            .local-detail-bottom {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 320px;
                gap: 24px;
                margin-top: 24px;
            }

            .local-product-tabs {
                min-height: 280px;
                padding: 30px;
            }

            .local-tab-buttons {
                text-align: center;
                margin-bottom: 24px;
            }

            .local-tab-buttons button {
                min-width: 100px;
                height: 38px;
                border-radius: 19px;
                border: 0;
                background: transparent;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
            }

            .local-tab-buttons button.active {
                background: #1b7fed;
                color: #fff;
            }

            .local-about-title {
                color: #373f50;
                font-weight: 700;
                font-size: 15px;
                margin-bottom: 16px;
            }

            .local-about-list {
                color: #4b566b;
                font-size: 14px;
                line-height: 1.5;
                padding-left: 0;
                list-style-position: inside;
            }

            .local-related-title {
                font-size: 18px;
                font-weight: 700;
                color: #373f50;
                margin: 0px 0 16px;
            }

            .local-related-card {
                display: grid;
                grid-template-columns: 100px 1fr;
                gap: 16px;
                border-radius: 4px;
                padding: 16px;
                margin-bottom: 12px;
                color: inherit;
            }

            .local-related-card:hover {
                color: inherit;
                border-color: #1b7fed;
            }

            .local-related-card img {
                width: 90px;
                height: 90px;
                object-fit: contain;
            }

            .local-related-name {
                color: #373f50;
                font-size: 14px;
                line-height: 1.35;
                font-weight: 700;
                margin-bottom: 8px;
            }

            .local-related-price {
                color: #1b7fed;
                font-size: 15px;
                font-weight: 700;
            }

            @media (max-width: 1199px) {
                .local-product-shell,
                .local-detail-bottom {
                    grid-template-columns: 1fr;
                }

                .local-side-panel {
                    grid-template-columns: 1fr 1fr;
                }
            }

            @media (max-width: 767px) {
                .local-product-page {
                    padding-top: 1rem;
                }

                .local-product-shell,
                .local-detail-bottom {
                    gap: 18px;
                }

                .local-side-panel {
                    grid-template-columns: 1fr;
                }

                .local-main-image {
                    min-height: 320px;
                    padding: 24px;
                }

                .local-product-title {
                    font-size: 20px;
                }

                .local-price {
                    font-size: 24px;
                }

                .local-buy-btn,
                .local-cart-btn,
                .local-wish-btn {
                    width: 100%;
                    font-size: 14px;
                }

                .local-product-tabs {
                    padding: 20px 16px;
                }

                .local-about-list {
                    font-size: 13px;
                }

                .local-related-card {
                    grid-template-columns: 90px 1fr;
                    gap: 12px;
                }

                .local-related-card img {
                    width: 80px;
                    height: 80px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function findProductBySlug(products, slug) {
        return products.find(function (p) {
            return p.slug === slug || String(p.id) === slug || String(p.numeric_id) === slug;
        });
    }

    function buildDescriptionPoints(product) {
        const raw = product.description || product.short_description || '';
        if (Array.isArray(product.bullets)) return product.bullets;
        if (raw) {
            return String(raw).split(/\n|\. /).map(function (item) {
                return item.replace(/^[-•\s]+/, '').trim();
            }).filter(Boolean).slice(0, 5);
        }

        return [
            'Quality product selected for AMWAJ ALMSELA customers.',
            'Suitable for building, maintenance, and contracting requirements.',
            'Reliable materials with a practical design for everyday use.',
            'Available with fast delivery across the country.'
        ];
    }

    function renderRelatedCard(product) {
        return '<a class="local-related-card" href="/products?product=' + encodeURIComponent(product.slug || product.id) + '" onclick="openProductDetailInline(event, \'' + (product.slug || product.id) + '\')">' +
            '<img src="' + product.image + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=\'images/image-place-holder.png\'">' +
            '<div>' +
            '<div class="local-related-name">' + escapeHtml(product.name) + '</div>' +
            '<div class="local-stars mb-2">&#9734; &#9734; &#9734; &#9734; &#9734; <span class="text-dark">( 0 )</span></div>' +
            '<div class="local-related-price">' + escapeHtml(product.price) + '</div>' +
            '</div></a>';
    }

    function renderProductDetail(product, products) {
        injectProductDetailStyles();

        const container = document.querySelector('.__inline-61 > .container.py-4');
        if (!container) return;

        const related = products.filter(function (item) {
            return item.id !== product.id && (
                item.category_id === product.category_id ||
                item.featured ||
                item.best_selling
            );
        }).slice(0, 4);

        const points = buildDescriptionPoints(product);
        const productId = escapeHtml(product.id || product.numeric_id || product.slug);
        const productSlug = encodeURIComponent(product.slug || product.id);
        const priceNumber = parsePrice(product.price);

        container.classList.add('local-product-page');
        container.innerHTML =
            '<div class="d-flex justify-content-between align-items-center bg-white px-3 py-3 mb-4 border rounded" style="box-shadow: 0 1px 3px rgba(0,0,0,0.05);">' +
            '  <div class="d-flex align-items-center" style="font-size: 15px; font-weight: 700; color: #1f2937;">' +
            '    <span class="text-uppercase">' + escapeHtml(product.name) + '</span>' +
            '    <span class="ml-2" style="color: #1b7fed; font-weight: bold; font-size: 18px; line-height: 1;">&gt;</span>' +
            '  </div>' +
            '  <button type="button" class="close" onclick="closeProductDetailInline()" aria-label="Close" style="font-size: 24px; color: #9ca3af; background: transparent; border: 0; padding: 0; margin: 0; line-height: 1; cursor: pointer; outline: none; transition: color 0.15s ease-in-out;">' +
            '    <span aria-hidden="true">&times;</span>' +
            '  </button>' +
            '</div>' +
            '<div class="local-product-shell">' +
            '<div>' +
            '<div class="local-product-gallery">' +
            '<div class="local-main-image">' +
            '<button class="local-share-btn" type="button" aria-label="Share product"><i class="fa fa-share-alt"></i></button>' +
            '<img src="' + product.image + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=\'images/image-place-holder.png\'">' +
            '</div></div>' +
            '<div class="local-thumb"><img src="' + product.image + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=\'images/image-place-holder.png\'"></div>' +
            '</div>' +
            '<div class="local-product-info">' +
            '<h1 class="local-product-title">' + escapeHtml(product.name) + '</h1>' +
            '<div class="local-rating"><span class="local-stars">&#9734; &#9734; &#9734; &#9734; &#9734;</span><span>(0)</span><span>|</span><span class="text-primary">0 Reviews</span><span>|</span><span class="text-primary">0 Orders</span><span>|</span><span class="text-primary">0 Wish Listed</span></div>' +
            '<div class="local-price">' + escapeHtml(product.price) + '</div>' +
            '<form id="add-to-cart-form" onsubmit="return false;">' +
            '<input type="hidden" name="id" value="' + productId + '">' +
            '<div class="local-quantity-row">' +
            '<strong class="h5 mb-0">Quantity:</strong>' +
            '<div class="local-qty-control">' +
            '<button type="button" id="local-qty-minus">-</button>' +
            '<input id="local-detail-qty" name="quantity" value="1" min="1" max="99" inputmode="numeric">' +
            '<button type="button" id="local-qty-plus">+</button>' +
            '</div></div>' +
            '<div class="local-total">Total Price : <span id="local-detail-total">' + escapeHtml(product.price) + '</span> <small class="font-weight-normal text-dark">(Tax : incl.)</small></div>' +
            '<div class="local-action-row">' +
            '<button class="local-buy-btn" type="button" id="local-buy-now">Buy now</button>' +
            '<button class="local-cart-btn" type="button" id="local-add-cart">Add to cart</button>' +
            '<button class="local-wish-btn" type="button" id="local-wishlist"><i class="fa fa-heart-o mr-2"></i>0</button>' +
            '</div></form>' +
            '</div>' +
            '<aside class="local-side-panel">' +
            '<div class="local-service-list">' +
            '<div class="local-service-item"><span class="local-service-icon"><i class="fa fa-truck text-primary"></i></span><span>Fast Delivery all across the country</span></div>' +
            '<div class="local-service-item"><span class="local-service-icon"><i class="fa fa-credit-card text-primary"></i></span><span>Safe Payment</span></div>' +
            '<div class="local-service-item"><span class="local-service-icon"><i class="fa fa-refresh text-warning"></i></span><span>7 Days Return Policy</span></div>' +
            '<div class="local-service-item"><span class="local-service-icon"><i class="fa fa-shield text-primary"></i></span><span>100% Authentic Products</span></div>' +
            '</div>' +
            '<div class="local-store-card">' +
            '<div class="local-store-avatar"><i class="fa fa-picture-o"></i></div>' +
            '<div class="local-store-name">AMWAJ ALMSELA</div>' +
            '<div class="local-store-stats"><div><div class="local-stars small">&#9733;&#9733;&#9733;</div><strong>0</strong> Reviews</div><div><i class="fa fa-archive text-warning d-block mb-2"></i><strong>15</strong> Products</div></div>' +
            '<a href="sellers.html" class="btn btn-primary btn-sm btn-block mt-3" style="background-color: #1b7fed; border-color: #1b7fed; border-radius: 4px; font-weight: 600; color: #fff;"><i class="fa fa-shopping-bag mr-2"></i>Visit Store</a>' +
            '</div>' +
            '</aside>' +
            '</div>' +
            '<div class="local-detail-bottom">' +
            '<section class="local-product-tabs">' +
            '<div class="local-tab-buttons"><button type="button" class="active">Overview</button><button type="button">Reviews</button></div>' +
            '<div class="local-about-title">About this item</div>' +
            '<ul class="local-about-list">' + points.map(function (point) { return '<li>' + escapeHtml(point) + '</li>'; }).join('') + '</ul>' +
            '</section>' +
            '<aside>' +
            '<h2 class="local-related-title">More From The Store</h2>' +
            (related.length ? related.map(renderRelatedCard).join('') : renderRelatedCard(product)) +
            '</aside>' +
            '</div>';

        const qtyInput = document.getElementById('local-detail-qty');
        const totalEl = document.getElementById('local-detail-total');
        const updateTotal = function () {
            const qty = Math.max(1, parseInt(qtyInput.value || '1', 10));
            qtyInput.value = qty;
            totalEl.innerText = 'QAR' + (priceNumber * qty).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        document.getElementById('local-qty-minus').addEventListener('click', function () {
            qtyInput.value = Math.max(1, parseInt(qtyInput.value || '1', 10) - 1);
            updateTotal();
        });
        document.getElementById('local-qty-plus').addEventListener('click', function () {
            qtyInput.value = parseInt(qtyInput.value || '1', 10) + 1;
            updateTotal();
        });
        qtyInput.addEventListener('change', updateTotal);

        document.getElementById('local-add-cart').addEventListener('click', function () {
            if (!product.in_stock) {
                $('#outof-stock-modal').modal('show');
                return;
            }
            if (window.addToCartLocal) {
                window.addToCartLocal(product.id, parseInt(qtyInput.value || '1', 10));
            } else {
                window.addToCart('add-to-cart-form');
            }
        });
        document.getElementById('local-buy-now').addEventListener('click', function () {
            if (!product.in_stock) {
                $('#outof-stock-modal').modal('show');
                return;
            }
            if (window.addToCartLocal) {
                window.addToCartLocal(product.id, parseInt(qtyInput.value || '1', 10));
                alert('Product added. Continue to checkout from the cart.');
            } else {
                window.addToCart('add-to-cart-form', true);
            }
        });
        document.getElementById('local-wishlist').addEventListener('click', function () {
            if (window.addWishlist) window.addWishlist(product.id, 'add-wishlist-modal');
        });

        window.history.replaceState(null, '', '/products?product=' + productSlug);
    }

    function filterProducts(products, categories, urlParams) {
        const categoryId = urlParams.get('id') || urlParams.get('category');
        const searchQuery = urlParams.get('name') || urlParams.get('search');
        const filterType = urlParams.get('data_from') || urlParams.get('filter');
        let filtered = products.slice();
        let titleText = 'All Products';

        if (categoryId && filterType === 'brand') {
            filtered = products.filter(function (p) {
                const b = typeof p.brand === 'object' && p.brand ? p.brand.name : p.brand;
                return b && b.toLowerCase() === 'amwaj';
            });
            titleText = 'AMWAJ Brand Products';
        } else if (categoryId) {
            const catIds = getCategoryIdsForFilter(categoryId, categories);
            filtered = products.filter(function (p) { return catIds.indexOf(p.category_id) !== -1; });
            titleText = findCategoryName(categoryId, categories);
        } else if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            filtered = products.filter(function (p) {
                const b = typeof p.brand === 'object' && p.brand ? p.brand.name : p.brand;
                return p.name.toLowerCase().includes(query) ||
                    (b && b.toLowerCase().includes(query)) ||
                    (p.description && p.description.toLowerCase().includes(query));
            });
            titleText = 'Search Results for "' + searchQuery + '"';
        } else if (filterType === 'featured') {
            filtered = products.filter(function (p) { return p.featured; });
            titleText = 'Featured Products';
        } else if (filterType === 'latest') {
            filtered = products.filter(function (p) { return p.latest; });
            titleText = 'Latest Products';
        } else if (filterType === 'best-selling') {
            filtered = products.filter(function (p) { return p.best_selling; });
            titleText = 'Best Selling Products';
        } else if (filterType === 'top-rated') {
            filtered = products.filter(function (p) { return p.top_rated; });
            titleText = 'Top Rated Products';
        } else if (filterType === 'search' && searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            filtered = products.filter(function (p) {
                const b = typeof p.brand === 'object' && p.brand ? p.brand.name : p.brand;
                return p.name.toLowerCase().includes(query) ||
                    (b && b.toLowerCase().includes(query));
            });
            titleText = 'Search Results for "' + searchQuery + '"';
        }

        return { filtered: filtered, titleText: titleText };
    }

    function renderProductCard(p) {
        const slugStr = p.slug || p.id;
        const brandName = typeof p.brand === 'object' && p.brand ? p.brand.name : (p.brand || '');
        return '<div class="col-lg-4 col-md-4 col-sm-6 col-6 p-2">' +
            '<div class="product-single-hover shadow-none rtl">' +
            '<div class="overflow-hidden position-relative">' +
            '<div class="inline_product clickable">' +
            '<span class="for-discoutn-value-null"></span>' +
            '<a href="/products?product=' + encodeURIComponent(slugStr) + '" onclick="openProductDetailInline(event, \'' + slugStr + '\')">' +
            '<img src="' + p.image + '" onerror="this.src=\'images/image-place-holder.png\'">' +
            '</a>' +
            '<div class="quick-view">' +
            '<a class="btn-circle stopPropagation" href="javascript:" onclick="quickView(\'' + (p.numeric_id || p.id) + '\')">' +
            '<i class="czi-eye align-middle"></i></a></div></div>' +
            '<div class="single-product-details">' +
            '<div class="mb-1"><span class="small text-muted">' + brandName + '</span></div>' +
            '<div><a href="/products?product=' + encodeURIComponent(slugStr) + '" onclick="openProductDetailInline(event, \'' + slugStr + '\')" class="text-capitalize fw-semibold text-truncate d-block">' + p.name + '</a></div>' +
            '<div class="justify-content-between"><div class="product-price">' +
            '<span class="text-accent text-dark font-weight-bold">' + p.price + '</span></div></div>' +
            '</div></div></div></div>';
    }

    function renderPagination(currentPage, totalPages, urlParams) {
        if (totalPages <= 1) return '';

        let html = '<nav class="col-12 mt-4"><ul class="pagination justify-content-center">';
        const baseParams = new URLSearchParams(urlParams);

        for (let i = 1; i <= totalPages; i++) {
            baseParams.set('page', String(i));
            const active = i === currentPage ? ' active' : '';
            html += '<li class="page-item' + active + '">' +
                '<a class="page-link" href="/products?' + baseParams.toString() + '">' + i + '</a></li>';
        }

        html += '</ul></nav>';
        return html;
    }

    window.closeProductDetailInline = function () {
        const container = document.querySelector('.__inline-61 > .container.py-4');
        if (!container) return;

        container.classList.remove('local-product-page');
        container.innerHTML = window.initialProductsContainerHTML;

        // Restore original URL search parameters (remove product query)
        const originalParams = new URLSearchParams(window.originalUrlSearch);
        originalParams.delete('product');
        originalParams.delete('slug');
        const searchStr = originalParams.toString();
        window.history.pushState(null, '', window.location.pathname + (searchStr ? '?' + searchStr : ''));

        // Re-run the setup
        setupProductsPage(globalCategories, globalProducts, originalParams);
    };

    window.openProductDetailInline = function (event, slug) {
        if (event) event.preventDefault();
        const product = findProductBySlug(globalProducts, slug);
        if (product) {
            renderProductDetail(product, globalProducts);
            // Push history state
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.set('product', slug);
            window.history.pushState({ productSlug: slug }, '', window.location.pathname + '?' + currentParams.toString());
        }
    };

    window.addEventListener('popstate', function (e) {
        const urlParams = new URLSearchParams(window.location.search);
        const productSlug = urlParams.get('product') || urlParams.get('slug');
        const container = document.querySelector('.__inline-61 > .container.py-4');
        if (!container) return;

        if (productSlug) {
            const product = findProductBySlug(globalProducts, productSlug);
            if (product) {
                renderProductDetail(product, globalProducts);
                return;
            }
        }
        
        // Restore products grid
        container.classList.remove('local-product-page');
        container.innerHTML = window.initialProductsContainerHTML;
        setupProductsPage(globalCategories, globalProducts, urlParams);
    });

    function setupProductsPage(categories, products, urlParams) {
        const grid = document.getElementById('products-grid');
        const titleEl = document.getElementById('page-title');
        if (!grid || !titleEl) return;

        const currentPage = Math.max(1, parseInt(urlParams.get('page') || '1', 10));

        const result = filterProducts(products, categories, urlParams);
        let filteredProducts = result.filtered;
        const titleText = result.titleText;

        titleEl.innerText = titleText + ' (' + filteredProducts.length + ')';

        const categoriesContainer = document.getElementById('local-categories-list');
        if (categoriesContainer) {
            const activeCatId = urlParams.get('id') || urlParams.get('category');
            categoriesContainer.innerHTML = categories.map(function (cat) {
                const isActive = activeCatId && parseInt(activeCatId, 10) === cat.id;
                let html = '<li class="mb-2">' +
                    '<a href="/products?id=' + cat.id + '&data_from=category&page=1" class="' +
                    (isActive ? 'text-primary font-weight-bold' : 'text-dark font-weight-bold') + ' d-block">' +
                    cat.name + '</a>';
                if (cat.subcategories.length > 0) {
                    html += '<ul class="list-unstyled pl-3 mt-1 small">';
                    html += cat.subcategories.map(function (sub) {
                        const subActive = activeCatId && parseInt(activeCatId, 10) === sub.id;
                        return '<li class="mb-1"><a href="/products?id=' + sub.id +
                            '&data_from=category&page=1" class="' +
                            (subActive ? 'text-primary' : 'text-muted') + ' d-block">' + sub.name + '</a></li>';
                    }).join('');
                    html += '</ul>';
                }
                html += '</li>';
                return html;
            }).join('');
        }

        function renderProducts(items, page) {
            if (items.length === 0) {
                grid.innerHTML = '<div class="col-12 text-center py-5">' +
                    '<img src="images/empty-cart.svg" width="100" class="mb-3">' +
                    '<p class="text-muted">No products found.</p></div>';
                return;
            }

            const totalPages = Math.ceil(items.length / PRODUCTS_PER_PAGE);
            const pageNum = Math.min(page, totalPages);
            const start = (pageNum - 1) * PRODUCTS_PER_PAGE;
            const pageItems = items.slice(start, start + PRODUCTS_PER_PAGE);

            grid.innerHTML = pageItems.map(renderProductCard).join('') +
                renderPagination(pageNum, totalPages, urlParams);
        }

        renderProducts(filteredProducts, currentPage);

        const sortSelect = document.getElementById('sort-by');
        if (sortSelect) {
            sortSelect.addEventListener('change', function (e) {
                const sortBy = e.target.value;
                const sorted = filteredProducts.slice();
                if (sortBy === 'price-asc') {
                    sorted.sort(function (a, b) { return parsePrice(a.price) - parsePrice(b.price); });
                } else if (sortBy === 'price-desc') {
                    sorted.sort(function (a, b) { return parsePrice(b.price) - parsePrice(a.price); });
                } else if (sortBy === 'name-asc') {
                    sorted.sort(function (a, b) { return a.name.localeCompare(b.name); });
                }
                renderProducts(sorted, 1);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const container = document.querySelector('.__inline-61 > .container.py-4');
        if (!container) return;

        window.initialProductsContainerHTML = container.innerHTML;
        window.originalUrlSearch = window.location.search;

        const grid = document.getElementById('products-grid');
        const titleEl = document.getElementById('page-title');
        if (!grid || !titleEl) return;

        Promise.all([
            fetch('http://localhost:5000/api/v1/categories')
                .then(function (res) { return res.json(); })
                .then(function (res) { return res.data || res; })
                .catch(function () {
                    return fetch('data/categories.json').then(function (r) { return r.json(); });
                }),
            fetch('http://localhost:5000/api/v1/products?limit=100')
                .then(function (res) { return res.json(); })
                .then(function (res) { return res.data || res; })
                .catch(function () {
                    return fetch('data/products.json').then(function (r) { return r.json(); });
                })
        ]).then(function (results) {
            globalCategories = (results[0] || []).map(function (cat) {
                return {
                    id: cat.id,
                    name: cat.name,
                    subcategories: cat.subcategories || cat.children || []
                };
            });
            globalProducts = results[1] || [];

            const urlParams = new URLSearchParams(window.location.search);
            const productSlug = urlParams.get('product') || urlParams.get('slug');
            if (productSlug) {
                const product = findProductBySlug(globalProducts, productSlug);
                if (product) {
                    renderProductDetail(product, globalProducts);
                    return;
                }
            }

            setupProductsPage(globalCategories, globalProducts, urlParams);
        }).catch(function (err) {
            console.error('Error loading products:', err);
            grid.innerHTML = '<div class="col-12 text-center py-5 text-danger">Failed to load products.</div>';
        });
    });
})();
