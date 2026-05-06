// Default data is now loaded from products-data.js
let products = defaultProducts;
let currentPage = 1;
let pageSize = window.innerWidth < 600 ? 10 : 20;

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

  if (pCount) pCount.textContent = `Showing ${visibleProducts.length} items`;
  
  // Show/Hide Pagination
  const pagWrap = document.querySelector("#pagination");
  if (pagWrap) pagWrap.style.display = visibleProducts.length > pageSize ? "flex" : "none";

  container.innerHTML = "";
  paginatedList.forEach(product => {
    const qty = basket.get(product.id) || 0;
    const inBasket = basket.has(product.id);
    
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
      <div class="product-visual">
        ${productVisual(product)}
        ${discount > 0 ? `<div class="discount-badge">${discount}% OFF</div>` : ''}
        ${product.inStock === false ? `<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-15deg); background:rgba(0,0,0,0.8); color:#fff; padding:5px 15px; border:2px solid #fff; font-weight:900; z-index:20; white-space:nowrap; pointer-events:none;">OUT OF STOCK</div>` : ''}
      </div>
      <div class="product-details">
        <h3>${product.name}</h3>
        <span class="tag">${product.category}</span>
        <p class="product-note">${product.note || ""}</p>
      </div>
      <div class="product-bottom">
        <div class="price-line">
          <div class="price-stack">
            ${product.marketPrice > product.price ? `<span class="market-price">${price(product.marketPrice)}</span>` : ''}
            <strong class="price">${price(product.price)}</strong>
          </div>
          <span class="unit">/ ${product.unit || "unit"}</span>
        </div>
        <div class="qty-row">${quantityControl}</div>
      </div>
    `;
    container.append(card);
  });

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
  window.scrollTo({ top: document.querySelector("#catalog").offsetTop - 100, behavior: 'smooth' });
};

window.changePageSize = (size) => {
  pageSize = size;
  currentPage = 1;
  renderProducts();
};

window.changePage = (dir) => {
  currentPage += dir;
  renderProducts();
  window.scrollTo({ top: document.querySelector("#catalog").offsetTop - 100, behavior: 'smooth' });
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

  if (pItems) {
    pItems.innerHTML = "";
    if (basket.size === 0) {
      pItems.innerHTML = '<p style="text-align:center; padding:10px; color:var(--muted);">List is empty</p>';
    } else {
      [...basket.entries()].slice(0, 5).forEach(([id, q]) => {
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

// --- INTERACTIONS ---
function addToBasket(id) {
  basket.set(id, 1);
  saveBasket();
  renderProducts();
  renderFloatingCart();
}

function changeQuantity(id, delta) {
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
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }
}

// DOM Listeners
document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  const plus = e.target.closest("[data-plus]");
  const minus = e.target.closest("[data-minus]");
  
  if (add) addToBasket(add.dataset.add);
  if (plus) changeQuantity(plus.dataset.plus, 1);
  if (minus) changeQuantity(minus.dataset.minus, -1);
  
  const shortcut = e.target.closest("[data-category-shortcut]");
  if (shortcut) {
    const select = document.querySelector("#category");
    if (select) {
      select.value = shortcut.dataset.categoryShortcut;
      renderProducts();
    }
  }

  const toggle = e.target.closest("#cartToggle");
  const popover = document.querySelector("#cartPopover");
  
  if (toggle) {
    popover?.classList.toggle("active");
  } else if (popover && popover.classList.contains("active") && !e.target.closest("#cartPopover")) {
    popover.classList.remove("active");
  }
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
  window.addEventListener("scroll", () => {
    document.querySelector(".site-header")?.classList.toggle("scrolled", window.scrollY > 50);
  });
}

function initReveal() {
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("active"); });
  }, { threshold: 0.1 });
  reveals.forEach(r => observer.observe(r));
}

// Startup
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  startSyncs();
});
