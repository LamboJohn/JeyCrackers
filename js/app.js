// Default data is now loaded from products-data.js
let products = defaultProducts;
let currentPage = 1;
let pageSize = 40;
let lastQuantityPulseId = null;

const categoryDescriptions = {
  "Sound Crackers": "Experience the tradition of Sivakasi with our premium Sound Crackers. From classic lakshmi crackers to powerful atom bombs, we offer high-decibel performance with maximum safety standards.",
  "Chakkars": "Brighten up your floor with our vibrant Ground Chakkars. Our spinning fireworks are carefully balanced for smooth rotation and a brilliant shower of colorful sparks.",
  "Sparklers": "Perfect for children and families, our eco-friendly sparklers are available in various colors and lengths. They produce minimal smoke while providing long-lasting brilliant lights.",
  "Flower Pots": "Create a spectacular fountain of light with our high-quality Flower Pots. Available in multiple sizes and colors, they provide a steady and majestic display for your celebrations.",
  "Rockets": "Soar into the sky with our powerful Rockets. These aerial fireworks are designed for height and stability, ending in beautiful bursts of color and light.",
  "Aerial Shots": "The ultimate festival highlight! Our Aerial Shots provide professional-grade displays of vibrant colors and patterns high in the air, perfect for grand celebrations.",
  "Gift Boxes": "Our curated Gift Boxes are the perfect all-in-one solution for family celebrations. Each box contains a premium assortment of crackers, sparklers, and chakkars at wholesale prices."
};

document.addEventListener("DOMContentLoaded", () => {
  const ps = document.querySelector("#pageSize");
  if (ps) ps.value = pageSize;
});

function getPaginationRange(current, total) {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= total; i++) {
    if (i == 1 || i == total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }
  return rangeWithDots;
}
let siteSettings = defaultSettings;
let heroSlides = null;
let promoCodes = [];

// --- BASKET STATE ---
let basketData = [];
try {
  basketData = JSON.parse(localStorage.getItem("crackerBasket") || "[]");
} catch (e) {
  basketData = [];
}
const basket = new Map(Array.isArray(basketData) ? basketData : []);

function saveBasket() {
  localStorage.setItem("crackerBasket", JSON.stringify([...basket.entries()]));
}

function lockBackgroundScroll() {
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  document.documentElement.classList.add("no-scroll");
  document.body.classList.add("no-scroll", "modal-open");

  if (!document.body.dataset.scrollLockY) {
    document.body.dataset.scrollLockY = String(y);
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }
}

function unlockBackgroundScrollIfClear() {
  const productModal = document.getElementById("productModal");
  const videoModal = document.getElementById("videoModal");
  const cartPopover = document.getElementById("cartPopover");
  const navMenu = document.getElementById("navMenu");
  const shouldStayLocked =
    (productModal && productModal.style.display === "flex") ||
    (videoModal && videoModal.style.display === "flex") ||
    (cartPopover && cartPopover.classList.contains("active")) ||
    (navMenu && navMenu.classList.contains("active"));

  if (shouldStayLocked) return;

  const y = Number(document.body.dataset.scrollLockY || 0);
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  document.documentElement.classList.remove("no-scroll");
  document.body.classList.remove("no-scroll", "modal-open");
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  delete document.body.dataset.scrollLockY;
  window.scrollTo(0, y);
  requestAnimationFrame(() => {
    window.scrollTo(0, y);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  });
}

// --- UTILS ---
function price(value) {
  return `Rs ${Number(value).toLocaleString("en-IN")}`;
}

function applySiteSettings() {
  document.querySelectorAll(".brand strong, footer span:first-child, address strong").forEach((item) => {
    item.textContent = siteSettings.shopName;
  });
  const heroTitle = document.querySelector("#hero-title");
  const heroText = document.querySelector(".hero-subcopy");
  if (heroTitle) heroTitle.textContent = siteSettings.heroTitle || siteSettings.shopName;
  if (heroText) heroText.textContent = siteSettings.heroText;

  // Full Header Branding Architect
  const header = document.querySelector(".header");
  const navContainer = document.querySelector(".nav-container");
  const navLinks = document.querySelectorAll(".nav-menu a, .hamburger");
  const shopBtn = document.querySelector(".shop-btn");

  if (header) {
    if (siteSettings.headerBg) header.style.setProperty("background", siteSettings.headerBg, "important");
  }

  if (navContainer && siteSettings.headerFullWidth) {
    navContainer.style.setProperty("max-width", "100%", "important");
    navContainer.style.setProperty("width", "100%", "important");
    navContainer.style.setProperty("padding-left", "20px", "important");
    navContainer.style.setProperty("padding-right", "20px", "important");
  }

  if (siteSettings.headerColor) {
    navLinks.forEach(link => link.style.setProperty("color", siteSettings.headerColor, "important"));
    if (shopBtn) {
      shopBtn.style.setProperty("border-color", siteSettings.headerColor, "important");
      shopBtn.style.setProperty("color", siteSettings.headerColor, "important");
    }
    if (header) {
      header.style.setProperty("border-bottom-color", `${siteSettings.headerColor}33`, "important"); // 20% opacity border
    }
  }

  // Logo Alignment / Layout Architect
  if (navContainer && siteSettings.headerPlacement) {
    const brand = document.querySelector(".brand");
    const menu = document.querySelector(".nav-menu");
    const actions = document.querySelector(".header-actions");

    if (brand && menu && actions) {
      if (siteSettings.headerPlacement === "center") {
        brand.style.order = "2";
        menu.style.order = "1";
        actions.style.order = "3";
        navContainer.style.justifyContent = "space-between";
      } else if (siteSettings.headerPlacement === "right") {
        brand.style.order = "3";
        menu.style.order = "1";
        actions.style.order = "2";
        navContainer.style.justifyContent = "flex-end";
        navContainer.style.gap = "40px";
      } else {
        // Left (Default)
        brand.style.order = "1";
        menu.style.order = "2";
        actions.style.order = "3";
        navContainer.style.justifyContent = "space-between";
      }
    }
  }

  // Keep the storefront header logo controlled by the responsive stylesheet.
  document.querySelectorAll(".brand-logo").forEach(img => {
    img.src = "images/jeycrackers-j-edited.png";
    img.style.removeProperty("height");
    img.style.removeProperty("width");
    img.style.removeProperty("object-fit");
  });

  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.href = `tel:+91${siteSettings.phone}`;
    link.textContent = `📞 +91 ${siteSettings.phone}`;
  });
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
    link.href = `https://wa.me/${siteSettings.whatsapp}`;
  });
}

function productIcon(category) {
  if (category === "Rockets" || category === "Aerial Shots") {
    return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2c2.7 1.8 4.1 4.1 4.1 7 0 3.4-1.6 6.4-4.1 9-2.5-2.6-4.1-5.6-4.1-9 0-2.9 1.4-5.2 4.1-7Zm0 8.2a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8ZM7 17l-3 4 4.7-1.6L7 17Zm10 0-1.7 2.4L20 21l-3-4Z"/></svg>`;
  }
  if (category === "Gift Boxes") {
    return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 10h16v10H4V10Zm0-5h5.2C8.5 4.3 8 3.6 8 2.8 8 1.8 8.8 1 9.8 1c1.1 0 2 1 2.7 2.4C13.2 2 14.1 1 15.2 1 16.2 1 17 1.8 17 2.8c0 .8-.5 1.5-1.2 2.2H20v4H4V5Zm7 5h2v10h-2V10Z"/></svg>`;
  }
  return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2 9.8 8.6 3 6.4l5.2 4.5L3 15.4l6.8-2.2L12 20l2.2-6.8 6.8 2.2-5.2-4.5L21 6.4l-6.8 2.2L12 2Z"/></svg>`;
}



function productVisual(product) {
  if (product.imageData || product.image) {
    return `<img src="${product.imageData || product.image}" alt="${product.name}">`;
  }
  const color = product.color || "#ffd700";
  const style = `style="color: ${color}; background: radial-gradient(circle at center, ${color}44, transparent 70%); border-color: ${color}33;"`;
  return `<div class="product-icon-wrap" ${style}>${productIcon(product.category)}</div>`;
}

// --- RENDERERS ---
function fillCategories() {
  const cSelect = document.querySelector("#category");
  const cRail = document.querySelector(".category-rail");
  if (!cSelect || !cRail) return;

  const categories = [...new Set(products.map(p => p.category))].sort();
  cRail.querySelectorAll(".category-pill:not([data-category-shortcut='all'])").forEach(p => p.remove());
  cSelect.querySelectorAll("option:not([value='all'])").forEach(o => o.remove());

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    cSelect.append(opt);

    const pill = document.createElement("button");
    pill.className = "category-pill";
    pill.type = "button";
    pill.dataset.categoryShortcut = cat;
    pill.textContent = cat;
    cRail.append(pill);
  });
}

function renderHeroSlider() {
  const container = document.querySelector(".slides-container");
  const dotsContainer = document.querySelector(".slider-dots");
  if (!container || !dotsContainer) return;

  container.innerHTML = "";
  dotsContainer.innerHTML = "";
  const slidesToRender = (heroSlides && heroSlides.length > 0) ? heroSlides : defaultSlides;

  const heroSection = document.querySelector(".hero-slider");
  if (slidesToRender.length === 0) {
    if (heroSection) heroSection.style.display = "none";
    return;
  } else {
    if (heroSection) heroSection.style.display = "block";
  }

  slidesToRender.forEach((slide, index) => {
    const slideDiv = document.createElement("div");
    slideDiv.className = `slide ${index === 0 ? "active" : ""}`;

    let mediaHtml = "";
    if (slide.videoData) {
      mediaHtml = `<video class="slide-video" src="${slide.videoData}" autoplay muted loop playsinline></video>`;
    } else {
      const bgStyle = slide.imageData ? `background-image: url(${slide.imageData});` : "";
      mediaHtml = `
        <div class="slide-bg-blur" style="${bgStyle}"></div>
        <div class="slide-bg" style="${bgStyle}"></div>
      `;
    }

    slideDiv.innerHTML = `
      ${mediaHtml}
      <div class="slide-content">
        ${slide.eyebrow ? `<p class="slide-eyebrow">${slide.eyebrow}</p>` : ""}
        ${slide.title ? `<h1>${slide.title}</h1>` : ""}
        ${slide.description ? `<p class="slide-description">${slide.description}</p>` : ""}
      </div>
    `;
    container.append(slideDiv);

    const dot = document.createElement("button");
    dot.className = `dot ${index === 0 ? "active" : ""}`;
    dotsContainer.append(dot);
  });

  initHeroSlider();
}

function currentProducts() {
  const sInput = document.querySelector("#search");
  const cSelect = document.querySelector("#category");
  const sSelect = document.querySelector("#sort");

  const term = sInput ? sInput.value.trim().toLowerCase() : "";
  const category = cSelect ? cSelect.value : "all";
  const sort = sSelect ? sSelect.value : "popular";

  let filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
    const matchCategory = category === "all" || p.category === category;
    return matchSearch && matchCategory;
  });

  if (sort === "priceLow") filtered.sort((a, b) => a.price - b.price);
  if (sort === "priceHigh") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  return filtered;
}

const style = document.createElement('style');
style.textContent = `
  .play-video-btn {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: none;
    border: none;
    width: 42px;
    height: 30px;
    cursor: pointer;
    z-index: 5;
    padding: 0;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
  }
  .no-scroll {
    overflow: hidden !important;
  }
  @media (max-width: 768px) {
    .play-video-btn {
      top: 10px !important;
      right: 10px !important;
      bottom: auto !important;
      left: auto !important;
    }
    .product-visual {
      -webkit-tap-highlight-color: transparent;
    }
    body.modal-open #cartWidget {
      display: none !important;
    }
    .mobile-only {
      display: flex !important;
    }
  }
  @media (min-width: 769px) {
    .mobile-only {
      display: none !important;
    }
  }
`;
document.head.appendChild(style);

function updateProductSchema(paginatedList) {
  let schema = document.getElementById("productSchema");
  if (!schema) {
    schema = document.createElement("script");
    schema.id = "productSchema";
    schema.type = "application/ld+json";
    document.head.appendChild(schema);
  }

  const productsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": paginatedList.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "image": product.imageData || product.image || "https://lambojohn.github.io/JeyCrackers/images/jeycrackers-j-edited.png",
        "description": product.note || `Buy ${product.name} at wholesale prices. Genuine Sivakasi crackers.`,
        "sku": product.id,
        "brand": {
          "@type": "Brand",
          "name": "Jey Crackers"
        },
        "offers": {
          "@type": "Offer",
          "url": window.location.href,
          "priceCurrency": "INR",
          "price": product.price,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": product.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": "Jey Crackers"
          }
        }
      }
    }))
  };

  schema.textContent = JSON.stringify(productsSchema);
}

function renderProducts() {
  const container = document.querySelector("#productGrid");
  const pCount = document.querySelector("#productCount");
  if (!container) return;

  const visibleProducts = currentProducts();
  const totalPages = Math.ceil(visibleProducts.length / pageSize);
  if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = visibleProducts.slice(start, end);

  // Update dynamic product schema for SEO
  updateProductSchema(paginatedList);

  // Update category description
  const cDesc = document.querySelector("#categoryDescription");
  if (cDesc) {
    const category = document.querySelector("#category")?.value || "all";
    if (category !== "all" && categoryDescriptions[category]) {
      cDesc.textContent = categoryDescriptions[category];
      cDesc.style.display = "block";
    } else {
      cDesc.style.display = "none";
    }
  }

  if (pCount) pCount.textContent = `Showing ${visibleProducts.length} items`;

  // Show/Hide Pagination
  const pagWrap = document.querySelector("#pagination");
  if (pagWrap) pagWrap.style.display = visibleProducts.length > pageSize ? "flex" : "none";

  container.innerHTML = "";
  paginatedList.forEach(product => {
    const qty = basket.get(product.id) || 0;
    const inBasket = basket.has(product.id);
    const pulseClass = lastQuantityPulseId === product.id ? " qty-control-pulse" : "";

    const card = document.createElement("article");
    card.className = `product-card ${product.inStock === false ? 'is-out-of-stock' : ''}`;

    const quantityControl = product.inStock === false
      ? `<div class="out-of-stock-label">Sold Out</div>`
      : (qty
        ? `
          <div class="stepper">
            <button type="button" data-minus="${product.id}">-</button>
            <span class="stepper-value">${qty}</span>
            <button type="button" data-plus="${product.id}">+</button>
          </div>
        `
        : `<button class="button primary" data-add="${product.id}">Add to List</button>`);

    const discount = product.marketPrice > product.price
      ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100)
      : 0;

    card.innerHTML = `
      <div class="product-visual" data-product-id="${product.id}" style="cursor:pointer;">
        ${productVisual(product)}
        ${discount > 0 ? `<div class="discount-badge">${discount}% OFF</div>` : ''}
        ${product.videoUrl ? `
          <button class="play-video-btn" data-video="${product.videoUrl}" aria-label="Play Video">
            <svg viewBox="0 0 68 48" style="width:100%; height:100%; display:block;">
              <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,0.13,34,0,34,0S12.21,0.13,6.9,1.55 c-2.93,0.78-4.64,3.26-5.42,6.19C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="var(--gold)"></path>
              <polygon points="27,34 45,24 27,14" fill="#0a0c10"></polygon>
            </svg>
          </button>
        ` : ''}
        
        <!-- Mobile Thumbnail Controls (Hidden on PC) -->
        <div class="mobile-thumb-controls">
          ${product.inStock !== false && qty === 0 ? `<button class="thumbnail-add-btn${pulseClass}" data-add="${product.id}">+</button>` : ''}
          ${qty > 0 ? `
            <div class="thumbnail-stepper${pulseClass}">
              <button type="button" data-minus="${product.id}">-</button>
              <span class="qty-val${pulseClass}">${qty}</span>
              <button type="button" data-plus="${product.id}">+</button>
            </div>
          ` : ''}
        </div>

        ${product.inStock === false ? `<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-15deg); background:rgba(0,0,0,0.8); color:#fff; padding:5px 15px; border:2px solid #fff; font-weight:900; z-index:20; white-space:nowrap; pointer-events:none;">OUT OF STOCK</div>` : ''}
      </div>
      <div class="product-details">
        <h3>${product.name}</h3>
        <span class="tag">${product.category}</span>
        <div class="price-line" style="margin-top: 2px !important; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2px !important;">
          <div class="price-stack" style="display: flex; flex-direction: column; gap: 0;">
            ${product.marketPrice > product.price ? `<span class="market-price" style="font-size: 0.75rem !important; opacity: 0.6; text-decoration: line-through; margin-bottom: -2px;">${price(product.marketPrice)}</span>` : ''}
            <div style="display: flex; align-items: baseline; gap: 4px;">
              <strong class="price" style="font-size: 1.05rem !important; color: var(--gold);">${price(product.price)}</strong>
              <span class="unit" style="font-size: 0.75rem !important; opacity: 0.8; color: #fff;">/ ${product.unit || "unit"}</span>
            </div>
          </div>
        </div>
        <p class="product-note">${product.note || ""}</p>
      </div>
      <div class="product-bottom">
        
        <!-- Desktop Bottom Controls (Hidden on Mobile) -->
        <div class="desktop-bottom-controls">
          <div class="qty-row">${quantityControl}</div>
        </div>
      </div>
    `;
    container.append(card);
  });
  lastQuantityPulseId = null;

  // Update Pagination UI
  const pageNumContainer = document.querySelector("#pageNumber");
  if (pageNumContainer) {
    const range = getPaginationRange(currentPage, totalPages);
    pageNumContainer.innerHTML = "";
    range.forEach(p => {
      if (p === '...') {
        const dot = document.createElement("span");
        dot.className = "pagination-dots";
        dot.textContent = "...";
        pageNumContainer.appendChild(dot);
      } else {
        const btn = document.createElement("button");
        btn.className = `page-number ${p === currentPage ? 'active' : ''}`;
        btn.textContent = p;
        btn.onclick = () => window.goToPage(p);
        pageNumContainer.appendChild(btn);
      }
    });
  }

  const prevBtn = document.querySelector("#prevPage");
  const nextBtn = document.querySelector("#nextPage");
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

window.goToPage = (num) => {
  currentPage = num;
  renderProducts();
  setTimeout(() => {
    const toolbar = document.querySelector("#catalog-toolbar");
    const top = toolbar.getBoundingClientRect().top + window.pageYOffset - 20;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 50);
};

window.changePageSize = (size) => {
  pageSize = size;
  currentPage = 1;
  renderProducts();
};

window.changePage = (dir) => {
  currentPage += dir;
  renderProducts();
  setTimeout(() => {
    const toolbar = document.querySelector("#catalog-toolbar");
    const top = toolbar.getBoundingClientRect().top + window.pageYOffset - 20;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 50);
};

function basketSummary() {
  let total = 0;
  let savings = 0;
  let items = 0;
  let qty = 0;
  basket.forEach((q, id) => {
    const product = products.find(p => p.id === id);
    if (product) {
      total += product.price * q;
      const mrp = product.marketPrice || product.price * 3.5;
      savings += (mrp - product.price) * q;
      items++;
      qty += q;
    }
  });
  return { total, savings, items, qty };
}

function renderFloatingCart() {
  const summary = basketSummary();
  const widget = document.querySelector("#cartWidget");
  const badge = document.querySelector("#cartBadge");
  const pTotal = document.querySelector("#popoverTotal");
  const pSavings = document.querySelector("#popoverSavings");
  const pItems = document.querySelector("#popoverItems");

  if (badge) badge.textContent = summary.items;
  if (pTotal) pTotal.textContent = price(summary.total);
  if (pSavings) pSavings.textContent = price(summary.savings);
  if (widget) widget.classList.toggle("visible", summary.items > 0);

  // Update Cart Icon (Clean look with Pop animation)
  const cartToggle = document.querySelector("#cartToggle");
  if (cartToggle) {
    const oldCount = parseInt(cartToggle.querySelector(".cart-badge")?.textContent || "0");

    cartToggle.innerHTML = `
      <div class="cart-sparks">
        <div class="spark"></div><div class="spark"></div><div class="spark"></div>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <span class="cart-badge" id="cartBadge">${summary.items}</span>
    `;

    // Trigger animation if count increased
    if (summary.items > oldCount) {
      cartToggle.classList.remove("pop");
      void cartToggle.offsetWidth; // Trigger reflow
      cartToggle.classList.add("pop");
    }
  }

  if (pItems) {
    pItems.innerHTML = "";
    if (basket.size === 0) {
      pItems.innerHTML = '<p style="text-align:center; padding:10px; color:var(--muted);">List is empty</p>';
    } else {
      [...basket.entries()].forEach(([id, q]) => {
        const p = products.find(x => x.id === id);
        if (p) {
          const div = document.createElement("div");
          div.className = "popover-item";
          div.style.display = "flex";
          div.style.justifyContent = "space-between";
          div.style.fontSize = "0.8rem";
          div.style.padding = "4px 0";
          div.innerHTML = `<span>${p.name} x ${q}</span> <span>${price(p.price * q)}</span>`;
          pItems.append(div);
        }
      });
    }
  }
}

function openProductModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const modal = document.getElementById("productModal");
  const imgContainer = document.getElementById("modalProductImage");
  const name = document.getElementById("modalProductName");
  const category = document.getElementById("modalProductCategory");
  const description = document.getElementById("modalProductDescription");
  const priceEl = document.getElementById("modalProductPrice");
  const unit = document.getElementById("modalProductUnit");
  const controls = document.getElementById("modalProductControls");

  name.textContent = product.name;
  category.textContent = product.category;
  description.textContent = product.note || "No description available.";
  priceEl.textContent = price(product.price);
  unit.textContent = ` / ${product.unit || "unit"}`;

  imgContainer.innerHTML = productVisual(product);
  const img = imgContainer.querySelector("img");
  if (img) {
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    img.style.objectFit = "contain";
  }

  const qty = basket.get(product.id) || 0;

  // Inject video button next to category
  const videoContainer = document.getElementById("modalVideoContainer");
  if (product.videoUrl) {
    videoContainer.innerHTML = `
      <button class="mobile-only" data-video="${product.videoUrl}" style="background:none; border:none; width:36px; height:24px; cursor:pointer; padding:0; display:flex; align-items:center; justify-content:center;" aria-label="Play Video">
        <svg viewBox="0 0 68 48" style="width:100%; height:100%; display:block;">
          <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,0.13,34,0,34,0S12.21,0.13,6.9,1.55 c-2.93,0.78-4.64,3.26-5.42,6.19C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="var(--gold)"></path>
          <polygon points="27,34 45,24 27,14" fill="#161b22"></polygon>
        </svg>
      </button>`;
  } else {
    videoContainer.innerHTML = "";
  }

  controls.innerHTML = product.inStock === false
    ? `<div class="out-of-stock-label">Sold Out</div>`
    : (qty
      ? `
        <div class="stepper" style="width:100%; justify-content:space-between;">
          <button type="button" data-minus="${product.id}">-</button>
          <span class="stepper-value">${qty}</span>
          <button type="button" data-plus="${product.id}">+</button>
        </div>
      `
      : `<button class="button primary" data-add="${product.id}" style="width:100%;">Add to List</button>`);

  lockBackgroundScroll();
  modal.style.display = "flex";
}

// --- INTERACTIONS ---
function addToBasket(id) {
  lastQuantityPulseId = id;
  basket.set(id, 1);
  saveBasket();
  renderProducts();
  renderFloatingCart();
}

function changeQuantity(id, delta) {
  lastQuantityPulseId = id;
  const current = basket.get(id) || 0;
  const next = current + delta;
  if (next <= 0) basket.delete(id);
  else basket.set(id, next);
  saveBasket();
  renderProducts();
  renderFloatingCart();
}

// --- INITIALIZATION ---
function initializeApp() {
  console.log("Jey Crackers App Initializing...");
  applySiteSettings();
  fillCategories();
  renderHeroSlider();
  renderProducts();
  renderFloatingCart();
  animateSparks();
  initHeaderScroll();
  initReveal();
  initMobileMenu();
}

function initMobileMenu() {
  const hamburger = document.querySelector("#hamburger");
  const navMenu = document.querySelector("#navMenu");
  const backdrop = document.querySelector("#navBackdrop");

  if (hamburger && navMenu) {
    function toggleMenu(isOpen) {
      navMenu.classList.toggle("active", isOpen);
      document.documentElement.classList.toggle("no-scroll", isOpen);
      document.body.classList.toggle("no-scroll", isOpen);
      if (backdrop) backdrop.style.display = isOpen ? "block" : "none";
      hamburger.classList.toggle("active", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
      hamburger.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    }

    hamburger.addEventListener("click", () => {
      const isOpen = !navMenu.classList.contains("active");
      toggleMenu(isOpen);

      if (isOpen) {
        history.pushState({ menu: "open" }, "");
      }
    });

    // Close menu when any link inside it is clicked
    const links = navMenu.querySelectorAll("a");
    links.forEach(link => {
      link.addEventListener("click", () => {
        if (navMenu.classList.contains("active")) {
          toggleMenu(false);

          const href = link.getAttribute("href");
          if (href && href.startsWith("#")) {
            history.back(); // Only go back if it's an anchor link on the same page
          }
        }
      });
    });

    // Close menu when clicking backdrop
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        if (navMenu.classList.contains("active")) {
          toggleMenu(false);
          history.back();
        }
      });
    }

    // Handle back button
    window.addEventListener("popstate", (e) => {
      if (navMenu.classList.contains("active")) {
        toggleMenu(false);
      }
    });
  }
}

// DOM Listeners
document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  const plus = e.target.closest("[data-plus]");
  const minus = e.target.closest("[data-minus]");
  const playVideo = e.target.closest("[data-video]");
  const closeBtn = e.target.closest("#closeVideoModal");
  const modal = document.getElementById("videoModal");

  if (add) {
    addToBasket(add.dataset.add);
    add.classList.add("btn-pop");
    setTimeout(() => add.classList.remove("btn-pop"), 300);

    const badge = document.getElementById("cartBadge");
    if (badge) {
      badge.classList.add("badge-pop");
      setTimeout(() => badge.classList.remove("badge-pop"), 300);
    }

    const pModal = document.getElementById("productModal");
    if (pModal && pModal.style.display === "flex") openProductModal(add.dataset.add);
  }
  if (plus) {
    changeQuantity(plus.dataset.plus, 1);
    plus.classList.add("btn-pop");
    setTimeout(() => plus.classList.remove("btn-pop"), 300);

    const badge = document.getElementById("cartBadge");
    if (badge) {
      badge.classList.add("badge-pop");
      setTimeout(() => badge.classList.remove("badge-pop"), 300);
    }

    const pModal = document.getElementById("productModal");
    if (pModal && pModal.style.display === "flex") openProductModal(plus.dataset.plus);
  }
  if (minus) {
    changeQuantity(minus.dataset.minus, -1);
    const pModal = document.getElementById("productModal");
    if (pModal && pModal.style.display === "flex") openProductModal(minus.dataset.minus);
  }

  const visual = e.target.closest("[data-product-id]");
  const isInteractive = e.target.closest("button") ||
    e.target.closest(".play-video-btn") ||
    e.target.closest("[data-add]") ||
    e.target.closest("[data-plus]") ||
    e.target.closest("[data-minus]") ||
    e.target.closest(".stepper") ||
    e.target.closest(".thumbnail-stepper") ||
    e.target.closest(".qty-val") ||
    e.target.closest(".stepper-value");

  if (visual && !isInteractive) {
    const id = visual.dataset.productId;
    openProductModal(id);
  }

  const closeProductBtn = e.target.closest("#closeProductModal");
  const pModal = document.getElementById("productModal");
  if (closeProductBtn || (pModal && e.target === pModal)) {
    if (pModal) {
      pModal.style.display = "none";
      unlockBackgroundScrollIfClear();
    }
  }

  if (playVideo) {
    e.stopPropagation();
    const url = playVideo.dataset.video;
    const player = document.getElementById("videoPlayer");

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (videoId) {
      player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&vq=hd720`;
      modal.style.display = "flex";
      lockBackgroundScroll();
    } else {
      alert("Invalid YouTube URL");
    }
  }

  if (closeBtn || (modal && e.target === modal)) {
    if (modal) {
      const player = document.getElementById("videoPlayer");
      modal.style.display = "none";
      player.src = "";
      unlockBackgroundScrollIfClear();
    }
  }

  const shortcut = e.target.closest("[data-category-shortcut]");
  if (shortcut) {
    const select = document.querySelector("#category");
    if (select) {
      select.value = shortcut.dataset.categoryShortcut;
      renderProducts();
    }
  }

  // Cart toggle handled at bottom of file via specialized listener
});

document.addEventListener("input", e => {
  if (["search", "category", "sort"].includes(e.target.id)) {
    renderProducts();
  }
});

// --- BEST BALANCED SETUP: SMART SYNC & CACHE ---
function startSyncs() {
  if (!window.db) return;

  // 1. Load from LocalStorage Cache immediately for instant speed
  const cachedProducts = localStorage.getItem("jey_products_cache");
  if (cachedProducts) {
    try {
      products = JSON.parse(cachedProducts);
      console.log("⚡ Loaded from LocalStorage Cache");
      fillCategories();
      renderProducts();
    } catch (e) {
      console.error("Cache corrupted, ignoring.");
    }
  }

  // 2. Fetch from Firestore to ensure freshness
  // Using onSnapshot keeps the UI updated if you change things in Admin
  window.db.collection("products").orderBy("name").onSnapshot(snap => {
    if (!snap.empty) {
      const newProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Update state
      products = newProducts;

      // Update Cache for next visit
      localStorage.setItem("jey_products_cache", JSON.stringify(newProducts));
      localStorage.setItem("jey_products_timestamp", Date.now());

      console.log("📡 Firestore Synced & Cache Updated");

      fillCategories();
      renderProducts();
    } else {
      // If Firestore is empty, use defaults
      products = defaultProducts;
      fillCategories();
      renderProducts();
    }
  }, err => {
    console.error("Firestore Error:", err);
    // Fallback to defaults on error if no cache
    if (!products || products.length === 0) products = defaultProducts;
    fillCategories();
    renderProducts();
  });

  // Settings Sync (Small text, can stay real-time)
  window.db.collection("settings").doc("main").onSnapshot(doc => {
    if (doc.exists) {
      siteSettings = { ...siteSettings, ...doc.data() };
      applySiteSettings();
    }
  });

  window.db.collection("slides").onSnapshot(snap => {
    if (!snap.empty) {
      heroSlides = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      heroSlides = null;
    }
    renderHeroSlider();
  });
}

// --- SLIDER LOGIC ---
let currentSlide = 0;
let sliderInterval = null;
function initHeroSlider() {
  const container = document.querySelector('.slides-container');
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  if (slides.length <= 1 || !container) return;

  if (sliderInterval) clearInterval(sliderInterval);

  function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide]?.classList.remove('active');
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide]?.classList.add('active');
  }

  function nextSlide() { goToSlide(currentSlide + 1); }
  function prevSlide() { goToSlide(currentSlide - 1); }

  // Auto-play disabled as per user request
  // sliderInterval = setInterval(nextSlide, 3000);

  // Touch Swipe Logic (Keep for manual control)
  let touchStartX = 0;
  let touchEndX = 0;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  }, { passive: true });

  // Dot Clicks (Keep for manual control)
  dots.forEach((dot, index) => {
    dot.onclick = () => {
      goToSlide(index);
    };
  });
}

// --- UI EFFECTS ---
function animateSparks() {
  const canvas = document.querySelector("#sparkCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // (Simplified spark logic for stability)
}

function initHeaderScroll() {
  const header = document.querySelector(".header") || document.querySelector(".site-header");
  if (!header) return;
  
  // Set initial state immediately
  header.classList.toggle("scrolled", window.scrollY > 50);

  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 50);
  });
}

function initReveal() {
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(entries => {
    reveals.forEach(r => observer.observe(r));
  }, { threshold: 0.1 });
  reveals.forEach(r => observer.observe(r));
}

// Startup
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  startSyncs();

  // Auto-scroll Trust Strip on mobile
  const trustStrip = document.querySelector('.trust-strip');
  if (trustStrip) {
    // Clone first item and append to end for seamless loop
    const firstItem = trustStrip.firstElementChild;
    if (firstItem && trustStrip.children.length > 1) {
      const clone = firstItem.cloneNode(true);
      clone.classList.add('trust-clone-item');
      trustStrip.appendChild(clone);
    }

    let scrollInterval = setInterval(() => {
      // Don't auto-scroll on desktop where it's a grid
      if (window.innerWidth > 640) return;

      const itemWidth = trustStrip.clientWidth;
      if (itemWidth === 0) return;

      const totalItems = trustStrip.children.length;
      let nextScroll = trustStrip.scrollLeft + itemWidth;

      // Temporarily disable scroll snap to allow smooth JS scrolling
      trustStrip.style.scrollSnapType = 'none';

      trustStrip.scrollTo({
        left: nextScroll,
        behavior: 'smooth'
      });

      // If we just scrolled to the cloned item (the last one)
      if (nextScroll >= (totalItems - 1) * itemWidth - 10) {
        setTimeout(() => {
          trustStrip.style.scrollSnapType = 'none';
          trustStrip.scrollLeft = 0; // Instant jump back to start
          trustStrip.style.scrollSnapType = 'x mandatory';
        }, 600); // Wait for smooth scroll to finish
      } else {
        setTimeout(() => {
          trustStrip.style.scrollSnapType = 'x mandatory';
        }, 600);
      }
    }, 5000); // Reduced speed (5 seconds instead of 3)

    // Pause on touch
    trustStrip.addEventListener('touchstart', () => clearInterval(scrollInterval));
  }

  // Toggle Cart Popover
  const cartToggle = document.querySelector("#cartToggle");
  const cartPopover = document.querySelector("#cartPopover");

  cartToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isActive = cartPopover?.classList.toggle("active");
    document.documentElement.classList.toggle("no-scroll", isActive);
    document.body.classList.toggle("no-scroll", isActive);
  });

  document.addEventListener("click", () => {
    if (cartPopover?.classList.contains("active")) {
      cartPopover.classList.remove("active");
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
    }
  });

  cartPopover?.addEventListener("click", (e) => {
    e.stopPropagation();
  });
});
