// Default data is now loaded from products-data.js
let products = [...defaultProducts];
let siteSettings = defaultSettings;
let promoCodes = [];

// Initialize Basket from LocalStorage
let basketData = [];
try {
  basketData = JSON.parse(localStorage.getItem("crackerBasket") || "[]");
} catch (e) {
  basketData = [];
}
const basket = new Map(Array.isArray(basketData) ? basketData : []);

const basketItems = document.querySelector("#basketItems");
const basketSavings = document.querySelector("#basketSavings");
const basketTotal = document.querySelector("#basketTotal");
const enquiryForm = document.querySelector("#enquiryForm");
const messagePreview = document.querySelector("#messagePreview");
const cartContent = document.querySelector("#cartContent");
const cartEmptyMessage = document.querySelector("#cartEmptyMessage");

// Pincode lookup
setTimeout(() => {
  const pincodeInput = document.querySelector("#pincode");
  const cityInput = document.querySelector("#city");
  const stateInput = document.querySelector("#state");

  if (pincodeInput) {
    pincodeInput.addEventListener("input", async (e) => {
      const pincode = e.target.value.trim();
      if (pincode.length === 6 && /^[0-9]+$/.test(pincode)) {
        try {
          if (cityInput) cityInput.placeholder = "Fetching City...";
          if (stateInput) stateInput.value = "Fetching State...";
          
          const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await response.json();
          
          if (data[0] && data[0].Status === "Success") {
            const postOffice = data[0].PostOffice[0];
            if (cityInput) {
              cityInput.value = postOffice.District;
              cityInput.placeholder = "City / District";
            }
            if (stateInput) stateInput.value = postOffice.State;
          } else {
            if (cityInput) cityInput.placeholder = "City not found";
            if (stateInput) stateInput.value = "";
          }
        } catch (err) {
          console.error("Pincode fetch error:", err);
          if (cityInput) cityInput.placeholder = "Error fetching city";
        }
      }
    });
  }
}, 500);

function price(value) {
  return `₹ ${Number(value || 0).toLocaleString("en-IN")}`;
}

function saveBasket() {
  localStorage.setItem("crackerBasket", JSON.stringify([...basket.entries()]));
}

function renderBasket() {
  const itemCountLabel = document.querySelector("#itemCountLabel");
  const mrpTotalLabel = document.querySelector("#mrpTotalLabel");

  if (basket.size === 0) {
    cartContent.style.display = "none";
    cartEmptyMessage.style.display = "block";
    return;
  }

  cartContent.style.display = "grid";
  cartEmptyMessage.style.display = "none";

  basketItems.innerHTML = "";
  let total = 0;
  let mrpTotal = 0;
  let itemCount = 0;

  basket.forEach((qty, id) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const itemTotal = product.price * qty;
    const mrp = product.marketPrice || product.price * 3.5;
    const itemMrp = mrp * qty;

    total += itemTotal;
    mrpTotal += itemMrp;
    itemCount += qty;

    const row = document.createElement("div");
    row.className = "basket-item-card";
    row.innerHTML = `
      <div class="item-main">
        <div class="item-image-placeholder">🔥</div>
        <div class="item-details">
          <h4>${product.name}</h4>
          <p class="item-meta">${product.category} • ${product.unit}</p>
        </div>
      </div>
      <div class="item-actions">
        <div class="qty-stepper">
          <button type="button" class="minus" data-id="${id}">-</button>
          <span class="qty-val">${qty}</span>
          <button type="button" class="plus" data-id="${id}">+</button>
        </div>
        <div class="item-pricing">
          <span class="current-price">${price(product.price)}</span>
          ${mrp > product.price ? `<span class="market-price">${price(mrp)}</span>` : ''}
        </div>
        <div class="item-total-col">
          <span class="label">Subtotal</span>
          <span class="val">${price(itemTotal)}</span>
        </div>
        <button type="button" class="remove-item-btn" data-id="${id}" title="Remove">&times;</button>
      </div>
    `;
    basketItems.appendChild(row);
  });

  const savings = mrpTotal - total;
  if (mrpTotalLabel) mrpTotalLabel.textContent = price(mrpTotal);
  if (basketSavings) basketSavings.textContent = price(savings);
  if (basketTotal) basketTotal.textContent = price(total);
}

function updateQuantity(id, delta) {
  const current = basket.get(id) || 0;
  const next = current + delta;
  if (next <= 0) {
    basket.delete(id);
  } else {
    basket.set(id, next);
  }
  saveBasket();
  renderBasket();
  // Dispatch event for any other tabs or components
  window.dispatchEvent(new Event("storage"));
}

basketItems.addEventListener("click", (e) => {
  const plus = e.target.closest(".plus");
  const minus = e.target.closest(".minus");
  const remove = e.target.closest(".remove-item-btn");

  if (plus) updateQuantity(plus.dataset.id, 1);
  if (minus) updateQuantity(minus.dataset.id, -1);
  if (remove) updateQuantity(remove.dataset.id, -9999);
});

async function applyPromo() {
  const input = document.querySelector("#promoCode");
  const status = document.querySelector("#promoStatus");
  const code = input.value.trim().toUpperCase();

  const found = promoCodes.find(p => p.code === code);
  if (!found) {
    status.textContent = "Invalid promo code";
    status.style.color = "#ef4444";
    return;
  }

  status.textContent = `Applied! ${found.type === 'percent' ? found.value + '%' : price(found.value)} discount.`;
  status.style.color = "#22c55e";
  // Logic for applying discount to total would go here if needed for display
}

function buildMessage(formData) {
  let msg = `*New Enquiry from ${formData.get("customerName")}*\n`;
  msg += `--------------------------\n`;

  let total = 0;
  basket.forEach((qty, id) => {
    const p = products.find(prod => prod.id === id);
    if (p) {
      msg += `• ${p.name} (${p.unit}) x ${qty} = ${price(p.price * qty)}\n`;
      total += p.price * qty;
    }
  });

  msg += `--------------------------\n`;
  msg += `*Total Amount: ${price(total)}*\n\n`;
  msg += `*Customer Details:*\n`;
  msg += `Name: ${formData.get("customerName")}\n`;
  msg += `Phone: ${formData.get("phone")}\n`;
  msg += `Address: ${formData.get("location")}, ${formData.get("state")} - ${formData.get("pincode")}\n`;

  return msg;
}

function basketSummary() {
  let subtotal = 0;
  let savings = 0;
  basket.forEach((qty, id) => {
    const p = products.find(prod => prod.id === id);
    if (p) {
      subtotal += p.price * qty;
      const mrp = p.marketPrice || p.price * 3.5;
      savings += (mrp - p.price) * qty;
    }
  });
  return { subtotal, savings, total: subtotal, discount: 0 };
}

async function saveInquiry(formData, message) {
  try {
    // Read the counter
    const counterDoc = await window.db.collection("counters").doc("inquiries").get();
    let count = 1000;
    if (counterDoc.exists) {
      count = counterDoc.data().currentValue || 1000;
    }
    const newCount = count + 1;
    
    // Update the counter immediately
    await window.db.collection("counters").doc("inquiries").set({ currentValue: newCount }, { merge: true });
    
    // Save the enquiry
    await window.db.collection("inquiries").add({
      orderNumber: newCount,
      customerName: formData.get("customerName"),
      phone: formData.get("phone"),
      address: `${formData.get("location")}, ${formData.get("state")} - ${formData.get("pincode")}`,
      items: [...basket.entries()].map(([id, qty]) => {
        const p = products.find(prod => prod.id === id);
        return { id, qty, name: p ? p.name : id };
      }),
      total: basketSummary().total,
      savings: basketSummary().savings,
      message,
      status: "new",
      createdAt: new Date().toISOString(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("Inquiry saved with order number #" + newCount);
    
    // Reset the cart after successful enquiry
    basket.clear();
    localStorage.removeItem("crackerBasket");
    renderBasket();
    
  } catch (err) {
    console.error("Error saving inquiry:", err);
  }
}
// Extreme Compression: Resize image using canvas before adding to PDF
function getCompressedDataUrl(img, maxWidth = 400) {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    ctx.fillStyle = "#0F1118"; // Matches header bg for seamless JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.6); // 60% quality is plenty for small logo
  } catch (e) {
    return img.src; // Fallback to original if canvas fails
  }
}

function generatePDF(formData, summary) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    compress: true
  });

  const pdfPrice = (val) => "Rs " + Number(val || 0).toLocaleString("en-IN");

  // 1. Header: Premium Navy Blue
  doc.setFillColor(15, 23, 42); // Navy Blue
  doc.rect(0, 0, 210, 40, 'F');

  // Subtle stars (night sky effect)
  doc.setFillColor(255, 255, 255);
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 210;
    const y = Math.random() * 40;
    const size = Math.random() * 0.2 + 0.05;
    doc.circle(x, y, size, 'F');
  }

  // Logo & Branding
  const logo = document.getElementById("pdfLogo");
  let headerTextX = 15;
  if (logo && logo.complete) {
    const imgProps = doc.getImageProperties(logo);
    const h = 24;
    const w = (imgProps.width * h) / imgProps.height;
    const miniLogo = getCompressedDataUrl(logo);
    doc.addImage(miniLogo, 'JPEG', 15, 8, w, h, undefined, 'FAST');
    headerTextX = 15 + w + 5;
  }

  doc.setFontSize(24);
  doc.setTextColor(218, 165, 32); // Gold
  doc.setFont("helvetica", "bold");
  doc.text("JEYCRACKERS", headerTextX, 22);

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255); // White
  doc.setFont("helvetica", "normal");
  doc.text(`No,25 CSI road, Thayilpatti, Sivakasi – 626123 • Support: ${siteSettings.phone}`, headerTextX, 29);
  
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text("Official Enquiry Quotation / Estimate", headerTextX, 36);

  // 2. Customer Details Section
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.setFillColor(245, 245, 245);
  doc.rect(15, 45, 180, 22, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(`Customer: ${formData.get("customerName")}`, 20, 51);
  doc.setFont("helvetica", "normal");
  doc.text(`Phone: ${formData.get("phone")}`, 20, 57);
  doc.text(`Address: ${formData.get("location")}, ${formData.get("state")} - ${formData.get("pincode")}`, 20, 63);
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 150, 51);

  // 3. Table Data
  const tableData = [];
  [...basket.entries()].forEach(([id, qty]) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      const marketPrice = product.marketPrice || product.price * 3.5;
      tableData.push([
        product.name,
        product.unit,
        qty,
        pdfPrice(marketPrice),
        pdfPrice(product.price),
        pdfPrice(product.price * qty)
      ]);
    }
  });

  // Table with clear borders (theme: 'grid')
  doc.autoTable({
    startY: 72,
    head: [['Product', 'Unit', 'Qty', 'Market Price', 'Our Price', 'Total']],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [218, 165, 32], fontStyle: 'bold' },
    theme: 'grid',
    styles: { fontSize: 9, font: 'helvetica' },
    margin: { left: 15, right: 15 }
  });

  const finalY = doc.lastAutoTable.finalY || 150;

  // 4. Totals Section (Below Table)
  const boxY = finalY + 5;
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(120, boxY, 75, 30, 'FD'); // Box on the right
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Gross Total:", 125, boxY + 8);
  doc.text(pdfPrice(summary.subtotal + summary.savings), 190, boxY + 8, { align: 'right' });
  
  doc.setTextColor(21, 128, 61); // Green
  doc.text("Your Savings:", 125, boxY + 16);
  doc.text(`- ${pdfPrice(summary.savings)}`, 190, boxY + 16, { align: 'right' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(125, boxY + 20, 190, boxY + 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Net Payable:", 125, boxY + 26);
  doc.text(pdfPrice(summary.total), 190, boxY + 26, { align: 'right' });

  // 5. Footer (Terms, Validity, Payment)
  const footerY = boxY + 40;
  
  // Terms and Conditions
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Terms and Conditions:", 15, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("• Goods once sold cannot be returned or exchanged.", 15, footerY + 5);
  doc.text("• This estimate is subject to product availability at the time of final confirmation.", 15, footerY + 10);
  doc.text("• We will contact you after receiving your enquiry to verify your order.", 15, footerY + 15);
  
  // Validity
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("Validity:", 15, footerY + 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + 5);
  doc.text(`• This quote is valid until ${validityDate.toLocaleDateString("en-IN")}.`, 15, footerY + 30);

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("This is a computer-generated estimate. Final availability will be confirmed on WhatsApp.", 105, footerY + 45, { align: 'center' });
  
  // Improved download method for Mobile Chrome safety
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `order_summary.pdf`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

enquiryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (basket.size === 0) return;

  const formData = new FormData(enquiryForm);
  const summary = basketSummary();
  const message = buildMessage(formData);

  // Build WhatsApp URL immediately — don't wait for anything
  const whatsappUrl = `https://wa.me/${siteSettings.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;

  // 1. Show success overlay
  showSuccessOverlay();

  // 2. Generate PDF (non-blocking)
  try {
    generatePDF(formData, summary);
  } catch (err) {
    console.error("PDF failed:", err);
  }

  // 3. Save to Firestore in background (non-blocking, don't await)
  saveInquiry(formData, message).catch(err => console.error("Inquiry save failed:", err));

  // 4. Redirect to WhatsApp after a longer delay to allow PDF download
  setTimeout(() => {
    // Only redirect if the overlay is still active (user hasn't manually closed it or navigated)
    if (document.querySelector(".success-overlay.active")) {
      window.location.href = whatsappUrl;
    }
  }, 5000); // Increased to 5s for mobile Chrome safety
});

function showSuccessOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "success-overlay active";
  overlay.innerHTML = `
    <div class="success-card">
      <div class="success-icon">✅</div>
      <h2>Enquiry Submitted!</h2>
      <p>Your PDF quotation is ready. If the download didn't start automatically, click below:</p>
      
      <div class="overlay-actions">
        <button id="retryDownload" class="button ghost sm" style="width: 100%; margin-bottom: 10px;">📥 Re-download PDF</button>
        <a href="#" id="manualWhatsApp" class="button primary block">💬 Open WhatsApp Now</a>
      </div>
      
      <p style="font-size: 0.8rem; margin-top: 15px; opacity: 0.7;">Redirecting to WhatsApp in <span id="timer">5</span>s...</p>
      <div class="loader-line"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Manual timer display
  let seconds = 5;
  const timerSpan = overlay.querySelector("#timer");
  const countdown = setInterval(() => {
    seconds--;
    if (timerSpan) timerSpan.textContent = seconds;
    if (seconds <= 0) clearInterval(countdown);
  }, 1000);

  // Manual actions
  overlay.querySelector("#retryDownload").onclick = (e) => {
    e.preventDefault();
    const formData = new FormData(document.querySelector("#enquiryForm"));
    const summary = basketSummary();
    generatePDF(formData, summary);
  };

  overlay.querySelector("#manualWhatsApp").onclick = (e) => {
    e.preventDefault();
    const formData = new FormData(document.querySelector("#enquiryForm"));
    const message = buildMessage(formData);
    const whatsappUrl = `https://wa.me/${siteSettings.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.location.href = whatsappUrl;
  };
}

// Load Initial Data with Caching
async function init() {
  if (!window.db) {
    console.error("Firestore not initialized");
    return;
  }

  // 1. Try Loading from Cache
  const cachedProducts = localStorage.getItem("jey_products_cache");
  const cacheTime = localStorage.getItem("jey_products_cache_time");
  const now = new Date().getTime();
  const oneHour = 60 * 60 * 1000;
  
  let needsFetch = true;
  if (cachedProducts && cacheTime && (now - parseInt(cacheTime) < oneHour)) {
    try {
      products = JSON.parse(cachedProducts);
      console.log("⚡ Cart loaded from Cache");
      needsFetch = false;
    } catch (e) {}
  }

  try {
    const settingsDoc = await window.db.collection("settings").doc("main").get();
    if (settingsDoc.exists) siteSettings = { ...siteSettings, ...settingsDoc.data() };

    // 2. Fetch from Firestore only if cache expired or missing
    if (needsFetch) {
      console.log("🔄 Fetching products from Firestore...");
      const prodSnap = await window.db.collection("products").orderBy("name").get();
      if (!prodSnap.empty) {
        products = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sync cache
        localStorage.setItem("jey_products_cache", JSON.stringify(products));
        localStorage.setItem("jey_products_cache_time", now.toString());
      } else if (!products || products.length === 0) {
        products = [...defaultProducts];
      }
    }

    const promoSnap = await window.db.collection("promoCodes").get();
    promoCodes = promoSnap.docs.map(d => d.data());
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    renderBasket();
    document.querySelector("#applyPromo")?.addEventListener("click", applyPromo);
  }
}

init();

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

initMobileMenu();
