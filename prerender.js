const fs = require('fs');

async function prerender() {
  const projectId = "jeycrackers-e9b98";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products`;
  
  console.log("Fetching products from Firestore...");
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.documents) {
      console.log("No documents found or failed to fetch.");
      return;
    }

    let html = "";
    data.documents.forEach(doc => {
      const fields = doc.fields;
      const name = fields.name?.stringValue || "Unknown Product";
      const price = fields.price?.integerValue || fields.price?.doubleValue || 0;
      const category = fields.category?.stringValue || "General";
      const unit = fields.unit?.stringValue || "unit";
      
      html += `
        <article class="product-card" style="border: 1px solid #30363d; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <h3>${name}</h3>
          <span class="tag" style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${category}</span>
          <div class="price-line" style="margin-top: 10px;">
            <strong style="color: var(--gold);">Rs. ${price}</strong> / ${unit}
          </div>
        </article>
      `;
    });
    
    let indexHtml = fs.readFileSync('index.html', 'utf8');
    
    // Regex to find productGrid and replace its content
    const regex = /(<div id="productGrid" class="product-grid" aria-live="polite">)([\s\S]*?)(<\/div>)/;
    
    if (regex.test(indexHtml)) {
      indexHtml = indexHtml.replace(regex, `$1${html}$3`);
      fs.writeFileSync('index.html', indexHtml);
      console.log("✓ Success: Prerendered products inserted into index.html!");
      console.log("Now search engines and Gemini will see your products!");
    } else {
      console.log("✗ Error: Could not find the productGrid div in index.html");
    }
  } catch (err) {
    console.error("Error during prerendering:", err);
  }
}

prerender();
