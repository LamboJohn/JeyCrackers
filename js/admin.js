// Default data is now loaded from products-data.js
let products = [];
let settings = defaultSettings;
let slides = [];
let promoCodes = [];
let inquiries = [];
let currentPage = 1;
let currentInquiryPage = 1;
let pageSize = window.innerWidth < 600 ? 10 : 20;
let iPageSize = 20;
let sortKey = 'name';
let sortDir = 'asc';
let iSortKey = 'timestamp';
let iSortDir = 'desc';
let pendingImages = new Map();

// History for Undo
let lastDeleted = null;

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

const productRows = document.querySelector("#productRows");
const inquiryRows = document.querySelector("#inquiryRows");
const productForm = document.querySelector("#productForm");
const settingsForm = document.querySelector("#settingsForm");
const heroForm = document.querySelector("#heroForm");
const slideRows = document.querySelector("#slideRows");

function price(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// --- AUTH SYSTEM ---
function initAuth() {
  const overlay = document.querySelector("#loginOverlay");
  const loginForm = document.querySelector("#loginForm");
  const logoutBtn = document.querySelector("#logoutBtn");

  if (!window.auth) return;

  window.auth.onAuthStateChanged(user => {
    if (user) {
      overlay?.classList.remove("active");
      document.body.style.overflow = "auto";
      startDataSyncs();
    } else {
      overlay?.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  });


  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.loginEmail.value;
    const pass = loginForm.loginPassword.value;
    try {
      await window.auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  });

  logoutBtn?.addEventListener("click", () => window.auth.signOut());
}

// --- DATA SYNCS ---
function startDataSyncs() {
  if (!window.db) return;

  // Products
  window.db.collection("products").orderBy("name").onSnapshot(snap => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts();
    renderStats();
  });

  // Settings
  window.db.collection("settings").doc("main").onSnapshot(doc => {
    if (doc.exists) {
      settings = doc.data();
      fillSettingsForm();
    }
  });

  // Slides
  window.db.collection("slides").onSnapshot(snap => {
    slides = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderSlides();
  });

  // Inquiries - Use flexible ordering
  window.db.collection("inquiries").onSnapshot(snap => {
    inquiries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort manually in JS to handle both 'timestamp' (Firestore) and 'createdAt' (String)
    inquiries.sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.createdAt || 0);
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.createdAt || 0);
      return timeB - timeA;
    });
    renderInquiries();
    renderStats();
  });
}

// --- RENDERERS ---
function renderProducts() {
  if (!productRows) return;
  productRows.innerHTML = "";
  
  const list = products.length > 0 ? products : defaultProducts;
  const searchTerm = document.querySelector("#adminSearch")?.value.toLowerCase() || "";
  const filteredList = list.filter(p => p.name.toLowerCase().includes(searchTerm) || p.category.toLowerCase().includes(searchTerm));

  // Apply Sorting
  filteredList.sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];
    
    // Special handling for image presence
    if (sortKey === 'imageData') {
      valA = a.imageData ? 1 : 0;
      valB = b.imageData ? 1 : 0;
    }
    // Special handling for stock status
    if (sortKey === 'inStock') {
      valA = a.inStock === false ? 0 : 1;
      valB = b.inStock === false ? 0 : 1;
    }
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredList.length / pageSize);
  if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
  
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = filteredList.slice(start, end);

  paginatedList.forEach((p, index) => {
    const globalIndex = start + index;
    const row = document.createElement("tr");
    const isPending = pendingImages.has(p.id);
    const pendingData = isPending ? pendingImages.get(p.id) : undefined;
    const currentImg = isPending ? pendingData : p.imageData;
    const showIds = document.querySelector("#toggleIds")?.checked || false;
    
    row.innerHTML = `
      <td style="color:var(--muted); font-weight:600;">#${globalIndex + 1}</td>
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="display:flex; flex-direction:column;">
            <strong style="color:#fff; font-size:0.95rem;">${p.name}</strong>
            ${showIds ? `<span style="font-size:0.75rem; color:var(--muted)">ID: ${p.id}</span>` : ''}
          </div>
        </div>
      </td>
      <td><span class="tag" style="background:rgba(255,215,0,0.1); color:var(--gold); padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:800;">${p.category}</span></td>
      <td>
        <div style="display:flex; flex-direction:column;">
          <span style="color:var(--gold); font-weight:800; font-size:1rem;">${price(p.price)}</span>
          <span style="text-decoration:line-through; opacity:0.4; font-size:0.75rem;">${price(p.marketPrice)}</span>
        </div>
      </td>
      <td style="font-weight:600; color:var(--muted)">${p.unit}</td>
      <td>
        <div class="admin-img-cell">
          <div class="img-row-layout">
            <div class="admin-img-wrapper">
              <label class="img-upload-label" title="Click to change image">
                ${currentImg ? `<img src="${currentImg}" class="admin-table-thumb">` : `<div class="admin-table-thumb-placeholder">Add Img</div>`}
                <input type="file" hidden accept="image/*" onchange="window.handleImageSelect('${p.id}', this)">
              </label>
              ${currentImg ? `<button class="img-remove-x" onclick="window.removeImageLocally('${p.id}')" title="Remove Image">✕</button>` : ''}
            </div>
            ${isPending ? `
              <div style="display:flex; align-items:center;">
                <button class="button sm success" onclick="window.saveImageChanges('${p.id}')" title="Save Changes" style="padding:6px; min-width:34px; display:flex; align-items:center; justify-content:center; border-radius:8px; box-shadow:0 4px 12px rgba(34,197,94,0.4); background:#22c55e; border:none;">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM7 5v3h8V5H7z"/></svg>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </td>
      <td>
        <label class="admin-toggle" title="Toggle Availability">
          <input type="checkbox" ${p.inStock !== false ? 'checked' : ''} onchange="toggleStock('${p.id}', this.checked)">
          <span class="admin-toggle-slider"></span>
        </label>
      </td>
      <td class="admin-actions">
        <button class="button sm ghost" onclick="editProduct('${p.id}')" title="Edit">Edit</button>
        <button class="button sm danger" onclick="deleteProduct('${p.id}')" title="Delete">Del</button>
      </td>
    `;
    productRows.appendChild(row);
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

  updateCategoryDatalist();
}

function updateCategoryDatalist() {
  const datalist = document.querySelector("#categoryOptions");
  if (!datalist) return;
  const list = products.length > 0 ? products : defaultProducts;
  const cats = [...new Set(list.map(p => p.category))].sort();
  datalist.innerHTML = cats.map(c => `<option value="${c}">`).join("");
}

function renderInquiries() {
  if (!inquiryRows) return;
  inquiryRows.innerHTML = "";

  // Apply Sorting
  inquiries.sort((a, b) => {
    let valA = a[iSortKey];
    let valB = b[iSortKey];

    // Handle FireStore Timestamps or fallbacks
    if (iSortKey === 'timestamp') {
      valA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.createdAt || 0);
      valB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.createdAt || 0);
    }

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return iSortDir === 'asc' ? -1 : 1;
    if (valA > valB) return iSortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalInquiryPages = Math.ceil(inquiries.length / iPageSize);
  if (currentInquiryPage > totalInquiryPages) currentInquiryPage = Math.max(1, totalInquiryPages);

  const start = (currentInquiryPage - 1) * iPageSize;
  const end = start + iPageSize;
  const paginatedInquiries = inquiries.slice(start, end);

  paginatedInquiries.forEach(i => {
    const rawTime = i.timestamp?.toDate ? i.timestamp.toDate() : new Date(i.createdAt || 0);
    const date = rawTime.toLocaleDateString("en-IN", { day: '2-digit', month: 'short' });
    const time = rawTime.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
    const row = document.createElement("tr");
    
    // Determine status select style
    let statusClass = "status-pending";
    if (i.status === "contacted") statusClass = "status-contacted";
    if (i.status === "payment_done") statusClass = "status-payment";
    if (i.status === "completed") statusClass = "status-completed";

    row.innerHTML = `
      <td>
        <div style="display:flex; flex-direction:column;">
          <span style="font-weight:800; color:#fff;">${date}</span>
          <span style="font-size:0.7rem; color:var(--muted); opacity:0.7;">${time}</span>
        </div>
      </td>
      <td>
        <div style="display:flex; flex-direction:column;">
          <strong style="color:var(--gold);">${i.customerName || i.name}</strong>
          <span style="font-size:0.75rem; color:var(--muted)">ID: ${i.id.slice(0,6)}</span>
        </div>
      </td>
      <td style="max-width:150px; font-size:0.8rem; line-height:1.3;">${i.address || i.location || '-'}</td>
      <td style="font-family:monospace; font-weight:700; color:var(--muted)">📞 ${i.phone}</td>
      <td>
        <div class="inquiry-items-summary" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size:0.8rem; color:var(--muted); margin-bottom:4px;">
          ${(i.items || []).map(x => x.name || x.id).join(", ")}
        </div>
        <strong style="color:var(--gold); font-size:1rem;">${price(i.total)}</strong>
      </td>
      <td>
        <select class="status-select ${statusClass}" onchange="updateInquiryStatus('${i.id}', this.value)">
          <option value="new" ${i.status === 'new' ? 'selected' : ''}>NEW</option>
          <option value="contacted" ${i.status === 'contacted' ? 'selected' : ''}>CONTACTED</option>
          <option value="payment_done" ${i.status === 'payment_done' ? 'selected' : ''}>PAYMENT DONE</option>
          <option value="completed" ${i.status === 'completed' ? 'selected' : ''}>COMPLETED</option>
        </select>
      </td>
      <td class="admin-actions">
        <button class="button sm primary" onclick="downloadInquiryPDF('${i.id}')" title="Download PDF Quote">PDF</button>
        <button class="button sm danger" onclick="deleteInquiry('${i.id}')" title="Delete Permanent">Delete</button>
      </td>
    `;
    inquiryRows.appendChild(row);
  });

  // Render Inquiry Pagination UI
  const pageNumContainer = document.querySelector("#inquiryPageNumber");
  if (pageNumContainer) {
    const range = getPaginationRange(currentInquiryPage, totalInquiryPages);
    pageNumContainer.innerHTML = "";
    range.forEach(p => {
      if (p === '...') {
        const dot = document.createElement("span");
        dot.className = "pagination-dots";
        dot.textContent = "...";
        pageNumContainer.appendChild(dot);
      } else {
        const btn = document.createElement("button");
        btn.className = `page-number ${p === currentInquiryPage ? 'active' : ''}`;
        btn.textContent = p;
        btn.onclick = () => { currentInquiryPage = p; renderInquiries(); };
        pageNumContainer.appendChild(btn);
      }
    });
  }
  
  const prevBtn = document.querySelector("#prevInquiryPage");
  const nextBtn = document.querySelector("#nextInquiryPage");
  if (prevBtn) prevBtn.disabled = currentInquiryPage <= 1;
  if (nextBtn) nextBtn.disabled = currentInquiryPage >= totalInquiryPages;
}

window.changeInquiryPage = (dir) => {
  currentInquiryPage += dir;
  renderInquiries();
};

window.changeInquiryPageSize = (size) => {
  iPageSize = size;
  currentInquiryPage = 1;
  renderInquiries();
};


window.updateInquiryStatus = async (id, newStatus) => {
  try {
    await window.db.collection("inquiries").doc(id).update({ status: newStatus });
  } catch (err) {
    alert("Status update failed: " + err.message);
  }
};

function renderSlides() {
  if (!slideRows) return;
  slideRows.innerHTML = "";

  const list = slides.length > 0 ? slides : defaultSlides;

  list.forEach(s => {
    const row = document.createElement("tr");
    const preview = s.imageData 
      ? `<img src="${s.imageData}" style="height: 40px; border-radius: 4px; border: 1px solid rgba(255,215,0,0.2);">` 
      : (s.videoData ? '<span class="tag" style="background: var(--gold); color: #000;">Video Slide</span>' : '<span class="tag">Empty</span>');

    row.innerHTML = `
      <td>${preview}</td>
      <td><strong>${s.videoData ? 'Video' : 'Image'}</strong></td>
      <td class="admin-actions">
        <button class="button sm ghost" onclick="editSlide('${s.id}')">Edit</button>
        <button class="button sm danger" onclick="deleteSlide('${s.id}')">Delete</button>
      </td>
    `;
    slideRows.appendChild(row);
  });
}

window.editSlide = (id) => {
  const s = slides.find(x => x.id === id) || defaultSlides.find(x => x.id === id);
  if (!s) return;
  heroForm.slideId.value = s.id;
  // Clear hidden text fields
  heroForm.slideEyebrow.value = "";
  heroForm.slideTitle.value = "";
  heroForm.slideDescription.value = "";
  heroForm.slideButtonText.value = "";
  heroForm.slideButtonLink.value = "";
  
  heroForm.slideImageData.value = s.imageData || "";
  heroForm.slideVideoData.value = s.videoData || "";
  
  const imgPrev = document.querySelector("#slideImagePreview");
  if (imgPrev) imgPrev.innerHTML = s.imageData ? `<img src="${s.imageData}" style="max-height: 100px; border-radius: 4px; border: 1px solid var(--gold);">` : "No background image";
  
  const vidPrev = document.querySelector("#slideVideoPreview");
  if (vidPrev) vidPrev.innerHTML = s.videoData ? `<p style="color:var(--gold); font-weight: 700;">✓ Video Loaded</p>` : "No background video";
  
  window.scrollTo({ top: heroForm.offsetTop - 100, behavior: 'smooth' });
};

function renderStats() {
  const pCount = document.querySelector("#statProducts");
  const cCount = document.querySelector("#statCategories");
  const iCount = document.querySelector("#statEnquiries");

  const list = products.length > 0 ? products : defaultProducts;
  if (pCount) pCount.textContent = list.length;
  if (cCount) {
    const cats = new Set(list.map(p => p.category));
    cCount.textContent = cats.size;
  }
  if (iCount) iCount.textContent = inquiries.length;
}

function fillSettingsForm() {
  if (!settingsForm) return;
  settingsForm.shopName.value = settings.shopName || "";
  settingsForm.phone.value = settings.phone || "";
  settingsForm.whatsapp.value = settings.whatsapp || "";
  settingsForm.city.value = settings.city || "";
  settingsForm.heroTitleInput.value = settings.heroTitle || "";
  settingsForm.heroTextInput.value = settings.heroText || "";
  

}

// --- TAB SYSTEM ---
function initTabs() {
  const tabs = document.querySelectorAll(".admin-tab");
  const panels = document.querySelectorAll(".admin-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.adminTab;
      tabs.forEach(t => t.classList.toggle("active", t === tab));
      panels.forEach(p => p.classList.toggle("active", p.id === `${target}Panel`));
      localStorage.setItem("adminActiveTab", target);
    });
  });

  // Restore active tab on load
  const lastTab = localStorage.getItem("adminActiveTab");
  if (lastTab) {
    const target = document.querySelector(`[data-admin-tab="${lastTab}"]`);
    if (target) target.click();
  }
}

// --- ACTIONS ---
window.toggleStock = async (id, newState) => {
  try {
    await window.db.collection("products").doc(id).update({ inStock: newState });
  } catch (err) {
    alert("Stock update failed: " + err.message);
  }
};

window.editProduct = (id) => {
  const p = products.find(x => x.id === id) || defaultProducts.find(x => x.id === id);
  if (!p) return;

  const modal = document.getElementById("editProductModal");
  const form = document.getElementById("editForm");
  
  form.editProductId.value = p.id;
  form.editProductName.value = p.name;
  form.editProductCategory.value = p.category;
  form.editProductPrice.value = p.price;
  form.editProductMarketPrice.value = p.marketPrice || p.price * 3;
  form.editProductUnit.value = p.unit;
  form.editProductVideo.value = p.videoUrl || "";
  form.editProductNote.value = p.note || "";
  form.editProductColor.value = p.color || "#ffd700";
  form.editProductImageData.value = p.imageData || "";
  
  const imgPrev = document.getElementById("editImagePreview");
  if (imgPrev) {
    imgPrev.innerHTML = p.imageData ? `<img src="${p.imageData}" style="max-height: 100px; border-radius: 4px;">` : "No image selected";
  }

  modal.style.display = "flex";
};

window.closeEditModal = () => {
  const modal = document.getElementById("editProductModal");
  modal.style.display = "none";
  document.getElementById("editForm").reset();
};

window.cancelImageChanges = (id) => {
  pendingImages.delete(id);
  renderProducts();
};

// ─── Image Crop Engine ───────────────────────────────────────────────────────
const cropState = {
  id: null,           // product id being edited
  img: null,          // HTMLImageElement of the raw upload
  offsetX: 0,         // image pan offset in canvas-px
  offsetY: 0,
  zoom: 1,            // zoom scale (1 = fit-to-canvas)
  minZoom: 1,
  dragging: false,
  lastX: 0,
  lastY: 0,
};

function getCropCanvas() { return document.getElementById('cropCanvas'); }

function drawCrop() {
  const canvas = getCropCanvas();
  if (!canvas || !cropState.img) return;
  const size = canvas.width;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const w = cropState.img.naturalWidth  * cropState.zoom;
  const h = cropState.img.naturalHeight * cropState.zoom;
  ctx.drawImage(cropState.img, cropState.offsetX, cropState.offsetY, w, h);
}

function clampOffset() {
  const canvas = getCropCanvas();
  if (!canvas || !cropState.img) return;
  const size = canvas.width;
  const w = cropState.img.naturalWidth  * cropState.zoom;
  const h = cropState.img.naturalHeight * cropState.zoom;

  if (w >= size) {
    cropState.offsetX = Math.min(0, Math.max(size - w, cropState.offsetX));
  } else {
    cropState.offsetX = Math.min(size - w, Math.max(0, cropState.offsetX));
  }

  if (h >= size) {
    cropState.offsetY = Math.min(0, Math.max(size - h, cropState.offsetY));
  } else {
    cropState.offsetY = Math.min(size - h, Math.max(0, cropState.offsetY));
  }
}

function openCropModal(id, file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      cropState.id  = id;
      cropState.img = img;

      // Fit the shorter dimension to canvas
      const canvas = getCropCanvas();
      const size   = canvas.offsetWidth || 460;
      canvas.width  = size;
      canvas.height = size;

      // Minimum zoom = cover the square canvas
      const minZ = size / Math.min(img.naturalWidth, img.naturalHeight);
      cropState.zoom    = minZ;
      cropState.minZoom = minZ * 0.2; // Allow zooming out up to 5x smaller than fill size

      // Center image
      const w = img.naturalWidth  * cropState.zoom;
      const h = img.naturalHeight * cropState.zoom;
      cropState.offsetX = (size - w) / 2;
      cropState.offsetY = (size - h) / 2;
      clampOffset();
      drawCrop();

      const modal = document.getElementById('cropModal');
      modal.style.display = 'flex';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

window.closeCropModal = () => {
  document.getElementById('cropModal').style.display = 'none';
  cropState.id = null;
};

window.applyCrop = () => {
  const canvas = getCropCanvas();
  const size   = canvas.width;
  // Draw final 800×800 crop
  const out = document.createElement('canvas');
  out.width  = 800;
  out.height = 800;
  const ctx = out.getContext('2d');
  const scale = 800 / size;
  
  ctx.fillStyle = "#0a0c10"; // Fill background with same color as crop container
  ctx.fillRect(0, 0, 800, 800);
  
  const w = cropState.img.naturalWidth  * cropState.zoom * scale;
  const h = cropState.img.naturalHeight * cropState.zoom * scale;
  ctx.drawImage(cropState.img, cropState.offsetX * scale, cropState.offsetY * scale, w, h);
  
  const dataUrl = out.toDataURL('image/jpeg', 0.82);
  pendingImages.set(cropState.id, dataUrl);
  window.closeCropModal();
  renderProducts();
};

// Drag to pan
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cropContainer');
  if (!container) return;

  container.addEventListener('mousedown', (e) => {
    if (!cropState.img) return;
    cropState.dragging = true;
    cropState.lastX = e.clientX;
    cropState.lastY = e.clientY;
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!cropState.dragging) return;
    cropState.offsetX += e.clientX - cropState.lastX;
    cropState.offsetY += e.clientY - cropState.lastY;
    cropState.lastX = e.clientX;
    cropState.lastY = e.clientY;
    clampOffset();
    drawCrop();
  });
  window.addEventListener('mouseup', () => { cropState.dragging = false; });

  // Touch support
  container.addEventListener('touchstart', (e) => {
    if (!cropState.img || e.touches.length !== 1) return;
    cropState.dragging = true;
    cropState.lastX = e.touches[0].clientX;
    cropState.lastY = e.touches[0].clientY;
    e.preventDefault();
  }, { passive: false });
  window.addEventListener('touchmove', (e) => {
    if (!cropState.dragging || e.touches.length !== 1) return;
    cropState.offsetX += e.touches[0].clientX - cropState.lastX;
    cropState.offsetY += e.touches[0].clientY - cropState.lastY;
    cropState.lastX = e.touches[0].clientX;
    cropState.lastY = e.touches[0].clientY;
    clampOffset();
    drawCrop();
  }, { passive: false });
  window.addEventListener('touchend', () => { cropState.dragging = false; });

  // Scroll to zoom
  container.addEventListener('wheel', (e) => {
    if (!cropState.img) return;
    e.preventDefault();
    const canvas = getCropCanvas();
    const rect   = canvas.getBoundingClientRect();
    const pivotX = e.clientX - rect.left;
    const pivotY = e.clientY - rect.top;
    const delta  = e.deltaY > 0 ? 0.92 : 1.09;
    const newZoom = Math.max(cropState.minZoom, cropState.zoom * delta);
    const ratio   = newZoom / cropState.zoom;
    cropState.offsetX = pivotX + (cropState.offsetX - pivotX) * ratio;
    cropState.offsetY = pivotY + (cropState.offsetY - pivotY) * ratio;
    cropState.zoom = newZoom;
    clampOffset();
    drawCrop();
  }, { passive: false });
});

window.zoomIn = () => {
  const canvas = getCropCanvas();
  if (!canvas || !cropState.img) return;
  const size = canvas.width;
  const pivotX = size / 2;
  const pivotY = size / 2;
  const delta = 1.1; // Zoom in by 10%
  const newZoom = Math.max(cropState.minZoom, cropState.zoom * delta);
  const ratio = newZoom / cropState.zoom;
  cropState.offsetX = pivotX + (cropState.offsetX - pivotX) * ratio;
  cropState.offsetY = pivotY + (cropState.offsetY - pivotY) * ratio;
  cropState.zoom = newZoom;
  clampOffset();
  drawCrop();
};

window.zoomOut = () => {
  const canvas = getCropCanvas();
  if (!canvas || !cropState.img) return;
  const size = canvas.width;
  const pivotX = size / 2;
  const pivotY = size / 2;
  const delta = 0.9; // Zoom out by 10%
  const newZoom = Math.max(cropState.minZoom, cropState.zoom * delta);
  const ratio = newZoom / cropState.zoom;
  cropState.offsetX = pivotX + (cropState.offsetX - pivotX) * ratio;
  cropState.offsetY = pivotY + (cropState.offsetY - pivotY) * ratio;
  cropState.zoom = newZoom;
  clampOffset();
  drawCrop();
};

window.handleImageSelect = (id, input) => {
  const file = input.files[0];
  if (!file) return;
  openCropModal(id, file);
};

window.removeImageLocally = (id) => {
  pendingImages.set(id, null);
  renderProducts();
};

// Toast notification helper
function showToast(message = '✓ Saved', color = '#22c55e') {
  const t = document.createElement('div');
  t.textContent = message;
  t.style.cssText = `
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:${color}; color:#fff; font-weight:700; font-size:0.9rem;
    padding:10px 22px; border-radius:999px; z-index:99999;
    box-shadow:0 4px 20px rgba(0,0,0,0.4);
    opacity:1; transition:opacity 0.5s ease;
    white-space:nowrap; pointer-events:none;
  `;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; }, 1800);
  setTimeout(() => { t.remove(); }, 2400);
}

window.saveImageChanges = async (id) => {
  const data = pendingImages.get(id);
  try {
    await window.db.collection("products").doc(id).update({ imageData: data });
    pendingImages.delete(id);
    showToast('✓ Image Saved!');
    // UI will update from onSnapshot
  } catch (err) {
    showToast('✗ Save Failed', '#ef4444');
  }
};

window.uploadProductImage = async (id, input) => {
  const file = input.files[0];
  if (!file) return;
  
  const originalLabel = input.parentElement;
  const originalHtml = originalLabel.innerHTML;
  originalLabel.innerHTML = `<div class="admin-table-thumb-placeholder">...</div>`;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    const img = new Image();
    img.onload = async () => {
      const compressed = getCompressedDataUrl(img, 400);
      try {
        await window.db.collection("products").doc(id).update({ imageData: compressed });
      } catch (err) {
        alert("Upload failed: " + err.message);
        originalLabel.innerHTML = originalHtml;
      }
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
};

window.deleteProduct = async (id) => {
  if (!confirm("Delete this product?")) return;
  try {
    await window.db.collection("products").doc(id).delete();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
};

window.deleteInquiry = async (id) => {
  if (!confirm("Delete this inquiry?")) return;
  try {
    await window.db.collection("inquiries").doc(id).delete();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
};

window.deleteSlide = async (id) => {
  if (!confirm("Delete this slide?")) return;
  try {
    await window.db.collection("slides").doc(id).delete();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
};

// Helper for extreme image compression in PDFs
function getCompressedDataUrl(img, maxWidth = 400) {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    ctx.fillStyle = "#0F1118"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.6);
  } catch (e) {
    return img.src;
  }
}

window.downloadInquiryPDF = (id) => {
  const i = inquiries.find(x => x.id === id);
  if (!i) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    compress: true
  });

  // 1. Branded Header
  doc.setFillColor(15, 17, 24);
  doc.rect(0, 0, 210, 40, 'F');

  const logo = document.getElementById("pdfLogo");
  let headerX = 15;
  if (logo && logo.complete) {
    const imgProps = doc.getImageProperties(logo);
    const h = 24;
    const w = (imgProps.width * h) / imgProps.height;
    
    // Use canvas-compressed version
    const miniLogo = getCompressedDataUrl(logo);
    doc.addImage(miniLogo, 'JPEG', 15, 8, w, h, undefined, 'FAST');
    headerX = 15 + w + 5;
  }

  doc.setFontSize(24);
  doc.setTextColor(218, 165, 32);
  doc.setFont("times", "bold");
  doc.text("JEYCRACKERS", headerX, 22);

  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  doc.text(`${settings.city || 'Sivakasi'} • WhatsApp: ${settings.whatsapp} • Support: ${settings.phone}`, headerX, 29);
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Official Enquiry Quotation / Estimate", headerX, 36);

  // 2. Customer Section
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, 48, 170, 25, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(`Customer: ${i.customerName || i.name}`, 25, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Phone: ${i.phone}`, 25, 62);
  doc.text(`Address: ${i.address || 'N/A'}`, 25, 69);
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  const rawTime = i.timestamp?.toDate ? i.timestamp.toDate() : new Date(i.createdAt || 0);
  doc.text(`Enquiry Date: ${rawTime.toLocaleString("en-IN")}`, 150, 55);

  // 3. Table
  const tableData = (i.items || []).map(item => {
    // Try to find current product price if not stored
    const p = products.find(prod => prod.id === item.id) || defaultProducts.find(prod => prod.id === item.id);
    const unitPrice = p ? p.price : 0;
    const market = p ? (p.marketPrice || p.price * 3) : 0;
    return [
      item.name || item.id,
      p ? p.unit : '-',
      item.qty,
      price(market),
      price(unitPrice),
      price(unitPrice * item.qty)
    ];
  });

  doc.autoTable({
    startY: 75,
    head: [['Product', 'Unit', 'Qty', 'Market Price', 'Our Price', 'Total']],
    body: tableData,
    headStyles: { fillColor: [218, 165, 32], textColor: [0, 0, 0] },
    foot: [
      [
        { content: 'MARKET PRICE TOTAL', colSpan: 5, styles: { halign: 'right', textColor: [100, 100, 100] } },
        { content: price(i.total + (i.savings || 0)), styles: { halign: 'right', textColor: [100, 100, 100] } }
      ],
      [
        { content: 'TOTAL DISCOUNT', colSpan: 5, styles: { halign: 'right', textColor: [21, 128, 61] } },
        { content: `- ${price(i.savings || 0)}`, styles: { halign: 'right', textColor: [21, 128, 61], fontStyle: 'bold' } }
      ],
      [
        { content: 'NET PAYABLE', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: price(i.total), styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [218, 165, 32] } }
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 9 }
  });

  const finalY = doc.lastAutoTable.finalY || 150;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Generated from Jeycrackers Admin Panel", 105, finalY + 20, { align: 'center' });

  doc.save(`enquiry_${i.customerName || 'customer'}.pdf`);
};

window.exportInquiriesExcel = () => {
  if (inquiries.length === 0) {
    alert("No enquiries to export.");
    return;
  }

  // Create CSV Header
  let csv = "Date,Customer Name,Phone,Address,Items,Total Amount,Status\n";

  inquiries.forEach(i => {
    const rawTime = i.timestamp?.toDate ? i.timestamp.toDate() : new Date(i.createdAt || 0);
    const date = rawTime.toLocaleString("en-IN").replace(/,/g, " ");
    const items = (i.items || []).map(x => `${x.name || x.id}(${x.qty})`).join(" | ").replace(/,/g, " ");
    const name = (i.customerName || i.name || "N/A").replace(/,/g, " ");
    const addr = (i.address || "N/A").replace(/,/g, " ");
    const status = (i.status || "new").toUpperCase();

    csv += `${date},${name},${i.phone},${addr},"${items}",${i.total},${status}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `inquiries_export_${new Date().toLocaleDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.exportInquiriesPDF = () => {
  if (inquiries.length === 0) {
    alert("No enquiries to export.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more space

  doc.setFontSize(20);
  doc.text("All Customer Enquiries Report", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

  const tableData = inquiries.map(i => {
    const rawTime = i.timestamp?.toDate ? i.timestamp.toDate() : new Date(i.createdAt || 0);
    return [
      rawTime.toLocaleDateString(),
      i.customerName || i.name,
      i.phone,
      i.address || 'N/A',
      (i.items || []).length + " items",
      price(i.total),
      (i.status || 'new').toUpperCase()
    ];
  });

  doc.autoTable({
    startY: 30,
    head: [['Date', 'Customer', 'Phone', 'Address', 'Order', 'Total', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [218, 165, 32] }
  });

  doc.save(`inquiries_full_report_${new Date().toLocaleDateString()}.pdf`);
};

window.viewInquiry = (id) => {
  const i = inquiries.find(x => x.id === id);
  if (!i) return;
  alert(`Inquiry from ${i.customerName || i.name}\nTotal: ${price(i.total)}\nPhone: ${i.phone}\nMessage: ${i.message || 'No message'}`);
};

// --- FORM SUBMISSIONS ---
productForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = productForm.productId.value || slugify(productForm.productName.value);
  const data = {
    name: productForm.productName.value,
    category: productForm.productCategory.value,
    price: Number(productForm.productPrice.value),
    marketPrice: Number(productForm.productMarketPrice.value),
    unit: productForm.productUnit.value,
    videoUrl: productForm.productVideo.value,
    note: productForm.productNote.value,
    color: productForm.productColor.value,
    imageData: productForm.productImageData.value
  };

  try {
    await window.db.collection("products").doc(id).set(data, { merge: true });
    productForm.reset();
    productForm.productId.value = "";
  } catch (err) {
    alert("Save failed: " + err.message);
  }
});

document.getElementById("editForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const id = form.editProductId.value;
  const data = {
    name: form.editProductName.value,
    category: form.editProductCategory.value,
    price: Number(form.editProductPrice.value),
    marketPrice: Number(form.editProductMarketPrice.value),
    unit: form.editProductUnit.value,
    videoUrl: form.editProductVideo.value,
    note: form.editProductNote.value,
    color: form.editProductColor.value,
    imageData: form.editProductImageData.value
  };

  try {
    await window.db.collection("products").doc(id).set(data, { merge: true });
    window.closeEditModal();
    showToast('✓ Changes Saved!');
  } catch (err) {
    alert("Save failed: " + err.message);
  }
});

settingsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Manual Validation
  if (!settingsForm.shopName.value || !settingsForm.phone.value) {
    alert("Shop Name and Phone are required for global settings.");
    return;
  }

  const data = {
    shopName: settingsForm.shopName.value,
    phone: settingsForm.phone.value,
    whatsapp: settingsForm.whatsapp.value,
    city: settingsForm.city.value,
    heroTitle: settingsForm.heroTitleInput.value,
    heroText: settingsForm.heroTextInput.value
  };
  try {
    await window.db.collection("settings").doc("main").set(data, { merge: true });
    alert("All Settings saved!");
  } catch (err) {
    alert("Save failed: " + err.message);
  }
});

heroForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = heroForm.slideId.value || `slide-${Date.now()}`;
  const data = {
    eyebrow: heroForm.slideEyebrow.value,
    title: heroForm.slideTitle.value,
    description: heroForm.slideDescription.value,
    buttonText: heroForm.slideButtonText.value,
    buttonLink: heroForm.slideButtonLink.value,
    imageData: heroForm.slideImageData.value,
    videoData: heroForm.slideVideoData.value
  };

  try {
    await window.db.collection("slides").doc(id).set(data, { merge: true });
    heroForm.reset();
    heroForm.slideId.value = "";
    document.querySelector("#slideImagePreview").innerHTML = "No background image";
    document.querySelector("#slideVideoPreview").innerHTML = "No background video";
    alert("Slide saved!");
  } catch (err) {
    alert("Save failed: " + err.message);
  }
});

// Startup initialized below

// --- STARTUP ---
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initTabs();
  // Fallback rendering
  renderProducts();
  renderInquiries();
  renderSlides();
  renderStats();

  // Slide Image Upload with Compression
  document.querySelector("#slideImageUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Resize to max 1920px width
        const MAX_WIDTH = 1920;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress as JPEG at 70% quality (best balance for web)
        const data = canvas.toDataURL("image/jpeg", 0.7);
        
        heroForm.slideImageData.value = data;
        document.querySelector("#slideImagePreview").innerHTML = `
          <img src="${data}" style="max-height: 100px; border-radius: 4px; border: 1px solid var(--gold);">
          <p style="font-size: 0.7rem; color: var(--gold); margin-top: 5px;">Compressed: ${(data.length / 1024).toFixed(1)} KB</p>
        `;
        
        if (data.length > 1000000) {
          alert("Warning: This image is still very large (" + Math.round(data.length/1024) + "KB). It might fail to save.");
        }
      };
      img.src = re.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Slide Video Upload
  document.querySelector("#slideVideoUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      heroForm.slideVideoData.value = re.target.result;
      document.querySelector("#slideVideoPreview").innerHTML = `<p style="color:var(--gold)">Video loaded</p>`;
    };
    reader.readAsDataURL(file);
  });

  document.querySelector("#clearHeroForm")?.addEventListener("click", () => {
    heroForm.reset();
    heroForm.slideId.value = "";
    document.querySelector("#slideImagePreview").innerHTML = "No background image";
    document.querySelector("#slideVideoPreview").innerHTML = "No background video";
  });

  // Product Image Upload with Compression
  document.querySelector("#productImageUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Resize to max 800px (standard for product thumbs)
        const MAX_DIM = 800;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        const data = canvas.toDataURL("image/jpeg", 0.7);
        productForm.productImageData.value = data;
        document.querySelector("#imagePreview").innerHTML = `<img src="${data}" style="max-height: 100px; border-radius: 4px;">`;
      };
      img.src = re.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Edit Product Image Upload with Compression
  document.querySelector("#editProductImageUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        const MAX_DIM = 800;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        const data = canvas.toDataURL("image/jpeg", 0.7);
        document.getElementById("editProductImageData").value = data;
        document.querySelector("#editImagePreview").innerHTML = `<img src="${data}" style="max-height: 100px; border-radius: 4px;">`;
      };
      img.src = re.target.result;
    };
    reader.readAsDataURL(file);
  });
});

window.goToPage = (num) => {
  currentPage = num;
  renderProducts();
};

window.changePage = (dir) => {
  currentPage += dir;
  renderProducts();
};

window.changePageSize = (size) => {
  pageSize = size;
  currentPage = 1;
  renderProducts();
};

window.setSort = (key) => {
  if (sortKey === key) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey = key;
    sortDir = 'asc';
  }
  renderProducts();
};

window.setInquirySort = (key) => {
  if (iSortKey === key) {
    iSortDir = iSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    iSortKey = key;
    iSortDir = 'asc';
  }
  renderInquiries();
};

window.toggleExportMenu = (menuId = "exportMenu") => {
  const menu = document.getElementById(menuId);
  if (menu) menu.classList.toggle("active");
};

// Close menus when clicking outside
document.addEventListener("click", (e) => {
  const menus = document.querySelectorAll(".export-menu");
  const containers = document.querySelectorAll(".export-container");
  
  let clickedInside = false;
  containers.forEach(c => {
    if (c.contains(e.target)) clickedInside = true;
  });

  if (!clickedInside) {
    menus.forEach(m => m.classList.remove("active"));
  }
});

window.showProductForm = () => {
  const form = document.getElementById("productForm");
  if (form) form.style.display = "grid";
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.hideProductForm = () => {
  const form = document.getElementById("productForm");
  if (form) {
    form.style.display = "none";
    form.reset();
    document.getElementById("productId").value = "";
    document.getElementById("imagePreview").innerHTML = "No image selected";
  }
};

// Update export functions to close menu
const originalPDF = window.exportInquiriesPDF;
window.exportInquiriesPDF = () => {
  window.toggleExportMenu();
  originalPDF();
};

const originalExcel = window.exportInquiriesExcel;
window.changeInquiryPageSize = (size) => { // Existing
  iPageSize = size;
  currentInquiryPage = 1;
  renderInquiries();
};

window.exportInquiriesExcel = () => {
  window.toggleExportMenu();
  originalExcel();
};

window.exportProductsPDF = () => {
  window.toggleExportMenu('productExportMenu');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.text("Jey Crackers - Product Catalogue", 14, 15);
  
  const tableData = products.map((p, i) => [
    i + 1,
    p.name,
    p.category,
    p.price,
    p.marketPrice,
    p.unit,
    p.inStock !== false ? 'Yes' : 'No'
  ]);
  
  doc.autoTable({
    startY: 20,
    head: [['#', 'Product Name', 'Category', 'Price', 'Market Price', 'Unit', 'In Stock']],
    body: tableData,
  });
  
  doc.save(`products_catalogue_${new Date().toLocaleDateString()}.pdf`);
};

window.exportProductsExcel = () => {
  window.toggleExportMenu('productExportMenu');
  let csv = "ID,Name,Category,Price,MarketPrice,Unit,InStock\n";
  products.forEach(p => {
    csv += `${p.id},"${p.name}","${p.category}",${p.price},${p.marketPrice},"${p.unit}",${p.inStock !== false}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `products_export_${new Date().toLocaleDateString()}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Initialize everything
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  const ps = document.querySelector("#pageSize");
  if (ps) ps.value = pageSize;
});
