const fs = require('fs');
const path = require('path');

async function prerender() {
  const projectId = "jeycrackers-e9b98";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products`;
  
  console.log("🚀 Starting Advanced SEO Prerender...");
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.documents) {
      console.log("✗ No documents found or failed to fetch.");
      return;
    }

    const products = data.documents.map(doc => {
      const fields = doc.fields;
      return {
        name: fields.name?.stringValue || "Unknown Product",
        price: fields.price?.integerValue || fields.price?.doubleValue || 0,
        category: fields.category?.stringValue || "General",
        unit: fields.unit?.stringValue || "unit",
        description: fields.description?.stringValue || ""
      };
    });

    const categories = [...new Set(products.map(p => p.category))];
    let indexHtml = fs.readFileSync('index.html', 'utf8');

    // 1. UPDATE MAIN INDEX.HTML
    updatePage(indexHtml, products, 'index.html', "Home");

    // 2. GENERATE CATEGORY PAGES
    console.log(`\n📂 Generating ${categories.length} Category Pages...`);
    
    for (const cat of categories) {
      const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const categoryDir = path.join('product-category', slug);
      
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }

      const categoryProducts = products.filter(p => p.category === cat);
      const catHtmlPath = path.join(categoryDir, 'index.html');
      
      // Fix paths in the template (since it's now 2 levels deep)
      let catTemplate = indexHtml
        .replace(/(href|src)="(?!(http|https|#|\/))/g, '$1="../../')
        .replace(/id="category" value="all"/, `id="category" value="${cat}"`);

      updatePage(catTemplate, categoryProducts, catHtmlPath, cat);
    }

    // 3. UPDATE SITEMAP
    updateSitemap(categories);

    console.log("\n✅ SEO Overhaul Complete! All category pages generated.");

  } catch (err) {
    console.error("✗ Error during prerendering:", err);
  }
}

function updatePage(template, products, filePath, categoryName) {
  let html = "";
  const baseUrl = "https://jeycrackers.com";
  
  // 1. Generate Product HTML
  products.forEach(p => {
    html += `
      <article class="product-card" style="border: 1px solid #30363d; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
        <h3>${p.name}</h3>
        <span class="tag" style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${p.category}</span>
        <p style="font-size: 0.85rem; opacity: 0.7; margin: 8px 0;">${p.description}</p>
        <div class="price-line" style="margin-top: 10px;">
          <strong style="color: #ffd700;">₹ ${p.price}</strong> / ${p.unit}
        </div>
      </article>
    `;
  });

  // 2. Generate JSON-LD Schema
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "Jey Crackers",
        "url": baseUrl,
        "logo": `${baseUrl}/images/jeycrackers-j-edited.png`,
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-9962384697",
          "contactType": "customer service"
        }
      },
      {
        "@type": "ItemList",
        "name": categoryName === "Home" ? "Our Firecracker Catalog" : `${categoryName} Collection`,
        "numberOfItems": products.length,
        "itemListElement": products.map((p, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": p.name,
            "description": p.description || `High-quality ${p.name} from Sivakasi.`,
            "brand": { "@type": "Brand", "name": "Jey Crackers" },
            "offers": {
              "@type": "Offer",
              "price": p.price,
              "priceCurrency": "INR",
              "availability": "https://schema.org/InStock"
            }
          }
        }))
      }
    ]
  };

  const schemaHtml = `\n  <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>`;

  let output = template;

  // Update Title & Meta for Categories
  if (categoryName !== "Home") {
    output = output.replace(/<title>.*?<\/title>/, `<title>${categoryName} - Buy Online | Jey Crackers</title>`);
    output = output.replace(/content="Jey Crackers - See It Burst Before You Buy It"/, `content="Buy high-quality ${categoryName} from Jey Crackers. See them burst before you buy. Wholesale prices and safe delivery."`);
  }

  // Inject Schema into Head
  output = output.replace('</head>', `${schemaHtml}\n</head>`);

  const regex = /(<div id="productGrid" class="product-grid" aria-live="polite">)([\s\S]*?)(<\/div>)(?=\s*<div id="pagination")/;
  if (regex.test(output)) {
    output = output.replace(regex, `$1${html}$3`);
    fs.writeFileSync(filePath, output);
    console.log(`  ✓ Generated: ${filePath} (with Schema)`);
  }
}

function updateSitemap(categories) {
  const baseUrl = "https://jeycrackers.com"; // Change if needed
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>
  <url><loc>${baseUrl}/about.html</loc><priority>0.8</priority></url>
  <url><loc>${baseUrl}/faq.html</loc><priority>0.5</priority></url>
  <url><loc>${baseUrl}/shipping.html</loc><priority>0.5</priority></url>
  <url><loc>${baseUrl}/ordering-process.html</loc><priority>0.5</priority></url>`;

  categories.forEach(cat => {
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    sitemap += `
  <url><loc>${baseUrl}/product-category/${slug}/</loc><priority>0.9</priority></url>`;
  });

  sitemap += `\n</urlset>`;
  fs.writeFileSync('sitemap.xml', sitemap);
  console.log("  ✓ Updated: sitemap.xml");
}

prerender();
