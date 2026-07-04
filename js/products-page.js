(function () {
    'use strict';

    const PRODUCTS_PER_PAGE = 12;

    function normalizeCategories(rawCategories) {
        if (!Array.isArray(rawCategories)) return [];

        return rawCategories.map(function (cat) {
            const subcategories = Array.isArray(cat.subcategories)
                ? cat.subcategories
                : (Array.isArray(cat.children) ? cat.children : []);
            return Object.assign({}, cat, {
                subcategories: subcategories.map(function (sub) {
                    return Object.assign({}, sub);
                })
            });
        });
    }

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

    function getCategoryIdsForFilter(catId, categories) {
        const id = parseInt(catId, 10);
        const normalizedCategories = normalizeCategories(categories);
        const parent = normalizedCategories.find(function (c) { return parseInt(c.id, 10) === id; });
        if (parent) {
            const ids = [id];
            (parent.subcategories || []).forEach(function (sub) { ids.push(parseInt(sub.id, 10)); });
            return ids;
        }
        return [id];
    }

    function findCategoryName(catId, categories) {
        const id = parseInt(catId, 10);
        const normalizedCategories = normalizeCategories(categories);
        for (let i = 0; i < normalizedCategories.length; i++) {
            const cat = normalizedCategories[i];
            if (parseInt(cat.id, 10) === id) return cat.name;
            const sub = (cat.subcategories || []).find(function (s) { return parseInt(s.id, 10) === id; });
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
                padding-top: 2rem;
                padding-bottom: 2.5rem;
            }

            .local-product-shell {
                display: grid;
                grid-template-columns: minmax(280px, 1fr) minmax(320px, 1.24fr) 320px;
                gap: 28px;
                align-items: start;
            }

            .local-product-gallery,
            .local-product-info,
            .local-store-card,
            .local-related-card,
            .local-product-tabs {
                background: #fff;
                border: 1px solid #e4efff;
                box-shadow: 0 10px 28px rgba(20, 85, 172, .06);
            }

            .local-product-gallery,
            .local-product-tabs {
                border-radius: 8px;
            }

            .local-product-info {
                border-color: transparent;
                box-shadow: none;
                background: transparent;
            }

            .local-main-image {
                min-height: 480px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 34px;
                position: relative;
            }

            .local-main-image img {
                max-width: 100%;
                max-height: 430px;
                object-fit: contain;
            }

            .local-share-btn {
                position: absolute;
                top: 38px;
                right: 38px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 0;
                background: #85c93d;
                color: #fff;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .local-thumb {
                width: 96px;
                height: 96px;
                border: 1px solid #e0ebfb;
                border-radius: 7px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fff;
                margin-top: 14px;
            }

            .local-thumb img {
                max-width: 72px;
                max-height: 72px;
                object-fit: contain;
            }

            .local-product-title {
                color: #1f2937;
                font-size: 34px;
                line-height: 1.32;
                font-weight: 700;
                margin-bottom: 10px;
            }

            .local-rating {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-items: center;
                color: #334155;
                font-size: 18px;
                margin-bottom: 18px;
            }

            .local-stars {
                color: #ff8a3d;
                letter-spacing: 2px;
                white-space: nowrap;
            }

            .local-price {
                color: #1b7fed;
                font-size: 42px;
                font-weight: 700;
                margin-bottom: 24px;
            }

            .local-quantity-row {
                display: flex;
                align-items: center;
                gap: 18px;
                margin-bottom: 22px;
            }

            .local-qty-control {
                display: inline-grid;
                grid-template-columns: 48px 58px 48px;
                height: 56px;
                border: 1px solid #1b7fed;
                border-radius: 7px;
                overflow: hidden;
                background: #fff;
            }

            .local-qty-control button,
            .local-qty-control input {
                border: 0;
                background: #fff;
                color: #1b7fed;
                text-align: center;
                font-size: 18px;
            }

            .local-qty-control input {
                color: #334155;
                border-left: 1px solid #e4efff;
                border-right: 1px solid #e4efff;
            }

            .local-total {
                font-size: 22px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 26px;
            }

            .local-total span {
                color: #1b7fed;
            }

            .local-action-row {
                display: flex;
                flex-wrap: wrap;
                gap: 24px;
                align-items: center;
            }

            .local-buy-btn,
            .local-cart-btn,
            .local-wish-btn {
                height: 64px;
                border-radius: 7px;
                font-size: 24px;
                border: 0;
                padding: 0 34px;
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
                color: #1b7fed;
                border: 1px solid #dce8f7;
                min-width: 114px;
            }

            .local-side-panel {
                display: grid;
                gap: 16px;
            }

            .local-service-list {
                background: #fff;
                border-radius: 7px;
                overflow: hidden;
                box-shadow: 0 10px 28px rgba(20, 85, 172, .06);
            }

            .local-service-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 24px;
                border-bottom: 1px solid #eef2f7;
                color: #525f70;
                font-size: 18px;
            }

            .local-service-item:last-child {
                border-bottom: 0;
            }

            .local-service-icon {
                width: 32px;
                text-align: center;
                font-size: 22px;
            }

            .local-store-card {
                border-radius: 7px;
                padding: 28px;
                text-align: center;
            }

            .local-store-avatar {
                width: 96px;
                height: 96px;
                margin: 8px auto 24px;
                border-radius: 50%;
                background: #eef6ff;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #9ab1cc;
                font-size: 32px;
            }

            .local-store-name {
                color: #000;
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 24px;
            }

            .local-store-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 18px;
                color: #1b7fed;
                font-size: 18px;
            }

            .local-store-stats div:first-child {
                border-right: 1px solid #e4ebf4;
            }

            .local-detail-bottom {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 458px;
                gap: 28px;
                margin-top: 28px;
            }

            .local-product-tabs {
                min-height: 390px;
                padding: 46px 60px;
            }

            .local-tab-buttons {
                text-align: center;
                margin-bottom: 40px;
            }

            .local-tab-buttons button {
                min-width: 136px;
                height: 58px;
                border-radius: 28px;
                border: 0;
                background: transparent;
                font-size: 20px;
            }

            .local-tab-buttons button.active {
                background: #1b7fed;
                color: #fff;
            }

            .local-about-title {
                color: #334155;
                font-weight: 700;
                font-size: 20px;
                margin-bottom: 24px;
            }

            .local-about-list {
                color: #334155;
                font-size: 20px;
                line-height: 1.55;
                padding-left: 0;
                list-style-position: inside;
            }

            .local-related-title {
                font-size: 26px;
                font-weight: 700;
                color: #1f2937;
                margin: 10px 0 24px;
            }

            .local-related-card {
                display: grid;
                grid-template-columns: 170px 1fr;
                gap: 26px;
                border-radius: 7px;
                padding: 24px;
                margin-bottom: 16px;
                color: inherit;
            }

            .local-related-card:hover {
                color: inherit;
                border-color: #1b7fed;
            }

            .local-related-card img {
                width: 156px;
                height: 156px;
                object-fit: contain;
            }

            .local-related-name {
                color: #111827;
                font-size: 20px;
                line-height: 1.42;
                font-weight: 700;
                margin-bottom: 16px;
            }

            .local-related-price {
                color: #1f2937;
                font-size: 22px;
                font-weight: 600;
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
                    font-size: 26px;
                }

                .local-price {
                    font-size: 34px;
                }

                .local-buy-btn,
                .local-cart-btn,
                .local-wish-btn {
                    width: 100%;
                    font-size: 20px;
                }

                .local-product-tabs {
                    padding: 30px 22px;
                }

                .local-about-list {
                    font-size: 17px;
                }

                .local-related-card {
                    grid-template-columns: 116px 1fr;
                    gap: 16px;
                }

                .local-related-card img {
                    width: 108px;
                    height: 108px;
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
        return '<a class="local-related-card" href="/product?product=' + encodeURIComponent(product.slug || product.id) + '">' +
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
            '</div>' +
            '</aside>' +
            '</div>' +
            '<div class="local-detail-bottom">' +
            '<section class="local-product-tabs">' +
            '<div class="local-tab-buttons">' +
            '<button type="button" class="active" data-tab="overview">Overview</button>' +
            '<button type="button" data-tab="reviews">Reviews</button>' +
            '<button type="button" data-tab="tech">Technical data</button>' +
            '</div>' +
            '<div id="detail-tab-overview" class="detail-tab-content">' +
            '<div class="local-about-title">About this item</div>' +
            '<ul class="local-about-list">' + points.map(function (point) { return '<li>' + escapeHtml(point) + '</li>'; }).join('') + '</ul>' +
            '</div>' +
            '<div id="detail-tab-reviews" class="detail-tab-content d-none">' +
            '<div class="text-center py-4 text-muted small">No reviews yet for this product.</div>' +
            '</div>' +
            '<div id="detail-tab-tech" class="detail-tab-content d-none">' +
            ((product.category_id === 17 || (product.name && (product.name.toLowerCase().indexOf('machine') !== -1 || product.name.toLowerCase().indexOf('welder') !== -1 || product.name.toLowerCase().indexOf('grinder') !== -1 || product.name.toLowerCase().indexOf('saw') !== -1))) ? `
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
            ` : '<div class="text-center py-4 text-muted small">No technical specifications available.</div>') +
            '</div>' +
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
            if (window.addToCartLocal) {
                window.addToCartLocal(product.id, parseInt(qtyInput.value || '1', 10));
            } else {
                window.addToCart('add-to-cart-form');
            }
        });
        document.getElementById('local-buy-now').addEventListener('click', function () {
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

        // Wire Tab buttons events
        const detailTabBtns = document.querySelectorAll('.local-tab-buttons button');
        detailTabBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                detailTabBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                
                const tabName = btn.getAttribute('data-tab');
                document.querySelectorAll('.detail-tab-content').forEach(function (content) {
                    content.classList.add('d-none');
                });
                const targetContent = document.getElementById('detail-tab-' + tabName);
                if (targetContent) {
                    targetContent.classList.remove('d-none');
                }
            });
        });

        window.history.replaceState(null, '', '/product?product=' + productSlug);
    }

    function filterProducts(products, categories, urlParams) {
        const categoryId = urlParams.get('id') || urlParams.get('category');
        const searchQuery = urlParams.get('name') || urlParams.get('search');
        const filterType = urlParams.get('data_from') || urlParams.get('filter');
        const brandFilter = urlParams.get('brand') || urlParams.get('brand_id');
        const minPriceParam = urlParams.get('min_price');
        const maxPriceParam = urlParams.get('max_price');

        let filtered = products.slice();
        let titleText = 'Products';

        // 1. Filter by Category
        if (categoryId && filterType !== 'brand') {
            const catIds = getCategoryIdsForFilter(categoryId, categories);
            filtered = filtered.filter(function (p) {
                const productCategoryId = parseInt(p.category_id, 10);
                return catIds.indexOf(productCategoryId) !== -1;
            });
            titleText = 'Category Products (' + findCategoryName(categoryId, categories) + ')';
        }

        // 2. Filter by Brand
        if (brandFilter) {
            filtered = filtered.filter(function (p) {
                return p.brand && p.brand.toLowerCase() === brandFilter.toLowerCase();
            });
            if (filterType === 'brand' || !categoryId) {
                titleText = brandFilter.toUpperCase() + ' Brand Products';
            }
        } else if (categoryId && filterType === 'brand') {
            filtered = filtered.filter(function (p) {
                return p.brand && p.brand.toLowerCase() === 'amwaj';
            });
            titleText = 'AMWAJ Brand Products';
        }

        // 3. Filter by Type (Featured/Latest/Best Selling/Top Rated)
        if (filterType === 'featured') {
            filtered = filtered.filter(function (p) { return p.featured; });
            titleText = 'Featured Products';
        } else if (filterType === 'latest') {
            filtered = filtered.filter(function (p) { return p.latest; });
            titleText = 'Latest Products';
        } else if (filterType === 'best-selling') {
            filtered = filtered.filter(function (p) { return p.best_selling; });
            titleText = 'Best Selling Products';
        } else if (filterType === 'top-rated') {
            filtered = filtered.filter(function (p) { return p.top_rated; });
            titleText = 'Top Rated Products';
        }

        // 4. Filter by Price Range
        if (minPriceParam !== null && minPriceParam !== '') {
            const minPrice = parseFloat(minPriceParam);
            if (!isNaN(minPrice)) {
                filtered = filtered.filter(function (p) {
                    return parsePrice(p.price) >= minPrice;
                });
            }
        }
        if (maxPriceParam !== null && maxPriceParam !== '') {
            const maxPrice = parseFloat(maxPriceParam);
            if (!isNaN(maxPrice)) {
                filtered = filtered.filter(function (p) {
                    return parsePrice(p.price) <= maxPrice;
                });
            }
        }

        // 5. Filter by Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(function (p) {
                return p.name.toLowerCase().includes(query) ||
                    (p.brand && p.brand.toLowerCase().includes(query)) ||
                    (p.description && p.description.toLowerCase().includes(query));
            });
            titleText = 'Search Results for "' + searchQuery + '"';
        }

        if (filtered.length === products.length) {
            titleText = 'All Products';
        }

        return { filtered: filtered, titleText: titleText };
    }

    function renderProductCard(p) {
        return '<div class="col-lg-4 col-md-4 col-sm-6 col-6 p-2">' +
            '<div class="product-single-hover shadow-none rtl">' +
            '<div class="overflow-hidden position-relative">' +
            '<div class="inline_product clickable">' +
            '<span class="for-discoutn-value-null"></span>' +
            '<a href="javascript:" onclick="quickView(\'' + (p.numeric_id || p.id) + '\')">' +
            '<img src="' + p.image + '" onerror="this.src=\'images/image-place-holder.png\'">' +
            '</a>' +
            '<div class="quick-view">' +
            '<a class="btn-circle stopPropagation" href="javascript:" onclick="quickView(\'' + (p.numeric_id || p.id) + '\')">' +
            '<i class="czi-eye align-middle"></i></a></div></div>' +
            '<div class="single-product-details">' +
            '<div class="mb-1"><span class="small text-muted">' + p.brand + '</span></div>' +
            '<div><a href="javascript:" onclick="quickView(\'' + (p.numeric_id || p.id) + '\')" class="text-capitalize fw-semibold text-truncate d-block">' + p.name + '</a></div>' +
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

    document.addEventListener('DOMContentLoaded', function () {
        const grid = document.getElementById('products-grid');
        const titleEl = document.getElementById('page-title');
        if (!grid || !titleEl) return;

        Promise.all([
            fetch('http://localhost:5000/api/v1/categories')
                .then(function (res) { return res.json(); })
                .then(function (res) { return res.data || res; })
                .catch(function () {
                    return Promise.resolve(window.__AMWAJ_CATEGORY_DATA__ || []);
                }),
            fetch('http://localhost:5000/api/v1/products?limit=100')
                .then(function (res) { return res.json(); })
                .then(function (res) { return res.data || res; })
                .catch(function () {
                    return Promise.resolve(window.__AMWAJ_PRODUCT_DATA__ || []);
                })
        ]).then(function (results) {
            const categories = normalizeCategories(results[0]);
            const products = (results[1] || []).map(normalizeProduct);
            const urlParams = new URLSearchParams(window.location.search);
            const productSlug = urlParams.get('product') || urlParams.get('slug');
            if (productSlug) {
                const product = findProductBySlug(products, productSlug);
                if (product) {
                    renderProductDetail(product, products);
                    return;
                }
            }

            const currentPage = Math.max(1, parseInt(urlParams.get('page') || '1', 10));

            const result = filterProducts(products, categories, urlParams);
            let filteredProducts = result.filtered;
            const titleText = result.titleText;

            titleEl.innerText = titleText + ' (' + filteredProducts.length + ')';

            const categoriesContainer = document.getElementById('local-categories-list');
            if (categoriesContainer) {
                const activeCatId = urlParams.get('id') || urlParams.get('category');
                categoriesContainer.innerHTML = categories.map(function (cat, index) {
                    const isActive = activeCatId && parseInt(activeCatId, 10) === parseInt(cat.id, 10);
                    let html = '<li class="mb-2 pb-2' + (index < categories.length - 1 ? ' border-bottom' : '') + '" style="' + (index < categories.length - 1 ? 'border-bottom: 1px dashed #e2e8f0 !important;' : '') + '">' +
                        '<a href="/products?id=' + cat.id + '&data_from=category&page=1" class="' +
                        (isActive ? 'text-primary font-weight-bold' : 'text-dark font-weight-bold') + ' d-block">' +
                        cat.name + '</a>';
                    if ((cat.subcategories || []).length > 0) {
                        html += '<ul class="list-unstyled pl-3 mt-1 small">';
                        html += (cat.subcategories || []).map(function (sub) {
                            const subActive = activeCatId && parseInt(activeCatId, 10) === parseInt(sub.id, 10);
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

            // Initialize Filter Dropdown
            const filterSelect = document.getElementById('sidebar-filter-select');
            if (filterSelect) {
                const activeFilter = urlParams.get('data_from') || urlParams.get('filter');
                if (activeFilter && ['featured', 'latest', 'best-selling', 'top-rated'].indexOf(activeFilter) !== -1) {
                    filterSelect.value = activeFilter;
                }
                filterSelect.addEventListener('change', function (e) {
                    const val = e.target.value;
                    const newParams = new URLSearchParams(window.location.search);
                    newParams.set('page', '1');
                    if (val) {
                        newParams.set('data_from', val);
                    } else {
                        newParams.delete('data_from');
                        newParams.delete('filter');
                    }
                    window.location.href = '/products?' + newParams.toString();
                });
            }

            // Initialize Price Filter
            const priceMinInput = document.getElementById('price-min');
            const priceMaxInput = document.getElementById('price-max');
            const priceFilterBtn = document.getElementById('price-filter-btn');
            if (priceMinInput && priceMaxInput && priceFilterBtn) {
                priceMinInput.value = urlParams.get('min_price') || '';
                priceMaxInput.value = urlParams.get('max_price') || '';
                const applyPriceFilter = function () {
                    const minVal = priceMinInput.value.trim();
                    const maxVal = priceMaxInput.value.trim();
                    const newParams = new URLSearchParams(window.location.search);
                    newParams.set('page', '1');
                    if (minVal !== '') {
                        newParams.set('min_price', minVal);
                    } else {
                        newParams.delete('min_price');
                    }
                    if (maxVal !== '') {
                        newParams.set('max_price', maxVal);
                    } else {
                        newParams.delete('max_price');
                    }
                    window.location.href = '/products?' + newParams.toString();
                };
                priceFilterBtn.addEventListener('click', applyPriceFilter);
                priceMinInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') applyPriceFilter(); });
                priceMaxInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') applyPriceFilter(); });
            }

            // Initialize Brand Filter & Search
            const brandCounts = {};
            products.forEach(function (p) {
                if (p.brand) {
                    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
                }
            });
            const brandsContainer = document.getElementById('sidebar-brands-list');
            if (brandsContainer) {
                const activeBrand = urlParams.get('brand') || urlParams.get('brand_id');
                const brandNames = Object.keys(brandCounts).sort();
                brandsContainer.innerHTML = brandNames.map(function (brandName) {
                    const count = brandCounts[brandName];
                    const isActive = activeBrand && activeBrand.toLowerCase() === brandName.toLowerCase();
                    const newParams = new URLSearchParams(window.location.search);
                    newParams.set('page', '1');
                    if (isActive) {
                        newParams.delete('brand');
                        newParams.delete('brand_id');
                    } else {
                        newParams.set('brand', brandName);
                    }
                    const url = '/products?' + newParams.toString();
                    return '<div class="d-flex justify-content-between align-items-center mb-2">' +
                        '<a href="' + url + '" class="' + (isActive ? 'text-primary font-weight-bold' : 'text-dark') + ' text-decoration-none small">' +
                        brandName + '</a>' +
                        '<span class="badge badge-pill badge-secondary font-weight-normal text-muted" style="background: #f1f5f9; font-size: 11px; padding: 3px 6px;">' + count + '</span>' +
                        '</div>';
                }).join('');
            }
            const brandSearchInput = document.getElementById('brand-search');
            if (brandSearchInput && brandsContainer) {
                brandSearchInput.addEventListener('input', function (e) {
                    const q = e.target.value.toLowerCase().trim();
                    const items = brandsContainer.querySelectorAll('.d-flex');
                    items.forEach(function (item) {
                        const brandText = item.querySelector('a').innerText.toLowerCase();
                        if (brandText.includes(q)) {
                            item.style.setProperty('display', 'flex', 'important');
                        } else {
                            item.style.setProperty('display', 'none', 'important');
                        }
                    });
                });
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
        }).catch(function (err) {
            console.error('Error loading products:', err);
            grid.innerHTML = '<div class="col-12 text-center py-5 text-danger">Failed to load products.</div>';
        });
    });
})();
