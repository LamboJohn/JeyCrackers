// --- SHARED DEFAULT DATA ---
// This file acts as the single source of truth for fallback data.

const defaultProducts = [
  // Sound Crackers
  { id: "lion-deluxe", name: "Lion Deluxe", category: "Sound Crackers", marketPrice: 175, price: 40.25, unit: "1 box", color: "#ef4444" },
  { id: "lakshmi-3.5", name: "3.5 Inch Lakshmi", category: "Sound Crackers", marketPrice: 60, price: 13.80, unit: "1 pkt", color: "#ef4444" },
  { id: "lakshmi-4", name: "4 Inch Lakshmi", category: "Sound Crackers", marketPrice: 100, price: 23.00, unit: "1 pkt", color: "#ef4444" },
  { id: "lakshmi-4-deluxe", name: "4 Inch Deluxe Lakshmi", category: "Sound Crackers", marketPrice: 120, price: 27.60, unit: "1 pkt", color: "#ef4444" },
  { id: "lakshmi-4-mega", name: "4 Inch Mega Deluxe Lakshmi", category: "Sound Crackers", marketPrice: 160, price: 36.80, unit: "1 pkt", color: "#ef4444" },
  { id: "kuruvi-2.75", name: "2.75 Inch Kuruvi", category: "Sound Crackers", marketPrice: 25, price: 5.75, unit: "1 pkt", color: "#ef4444" },
  { id: "2-sound", name: "2 Sound Crackers", category: "Sound Crackers", marketPrice: 140, price: 32.20, unit: "1 box", color: "#ef4444" },
  { id: "chorsa-28", name: "28 Chorsa", category: "Sound Crackers", marketPrice: 60, price: 13.80, unit: "1 pkt", color: "#ef4444" },
  { id: "giant-28", name: "28 Giant", category: "Sound Crackers", marketPrice: 100, price: 23.00, unit: "1 pkt", color: "#ef4444" },
  { id: "giant-56", name: "56 Giant", category: "Sound Crackers", marketPrice: 200, price: 46.00, unit: "1 pkt", color: "#ef4444" },
  { id: "deluxe-24", name: "24 Deluxe", category: "Sound Crackers", marketPrice: 220, price: 50.60, unit: "1 pkt", color: "#ef4444" },
  { id: "deluxe-50", name: "50 Deluxe", category: "Sound Crackers", marketPrice: 440, price: 101.20, unit: "1 pkt", color: "#ef4444" },
  { id: "red-bijili", name: "Red Bijili", category: "Sound Crackers", marketPrice: 75, price: 17.25, unit: "1 box", color: "#ef4444" },
  { id: "stripped-bijili", name: "Stripped Bijili", category: "Sound Crackers", marketPrice: 125, price: 28.75, unit: "1 box", color: "#ef4444" },
  
  // Walas
  { id: "5k-wala", name: "5k Full Counting", category: "Sound Crackers", marketPrice: 4500, price: 1035.00, unit: "1 roll", color: "#ef4444" },
  { id: "100-wala", name: "100 Wala", category: "Sound Crackers", marketPrice: 125, price: 28.75, unit: "1 roll", color: "#ef4444" },
  { id: "200-wala", name: "200 Wala", category: "Sound Crackers", marketPrice: 250, price: 57.50, unit: "1 roll", color: "#ef4444" },
  { id: "600-wala", name: "600 Wala", category: "Sound Crackers", marketPrice: 400, price: 92.00, unit: "1 roll", color: "#ef4444" },
  { id: "1000-wala", name: "1000 Wala", category: "Sound Crackers", marketPrice: 625, price: 143.75, unit: "1 roll", color: "#ef4444" },
  { id: "2000-wala", name: "2000 Wala", category: "Sound Crackers", marketPrice: 1250, price: 287.50, unit: "1 roll", color: "#ef4444" },
  { id: "5000-wala", name: "5000 Wala", category: "Sound Crackers", marketPrice: 3125, price: 718.75, unit: "1 roll", color: "#ef4444" },

  // Bombs
  { id: "hydro-bomb", name: "Hydro Bomb", category: "Bombs", marketPrice: 260, price: 59.80, unit: "1 box", color: "#1e3a8a" },
  { id: "classic-bomb", name: "Classic Bomb", category: "Bombs", marketPrice: 400, price: 92.00, unit: "1 box", color: "#1e3a8a" },
  { id: "king-bomb", name: "King Of King", category: "Bombs", marketPrice: 500, price: 115.00, unit: "1 box", color: "#1e3a8a" },
  { id: "oolai-vedi", name: "Oolai Vedi", category: "Bombs", marketPrice: 500, price: 115.00, unit: "1 box", color: "#1e3a8a" },
  { id: "bullet-bomb", name: "Bullet", category: "Bombs", marketPrice: 200, price: 46.00, unit: "1 box", color: "#1e3a8a" },

  // Chakkars
  { id: "wheel-4x4", name: "4x4 Wheel Chakkar", category: "Chakkars", marketPrice: 600, price: 138.00, unit: "1 box", color: "#ca8a04" },
  { id: "wireless-chakkar", name: "Wireless Chakkar", category: "Chakkars", marketPrice: 1000, price: 230.00, unit: "1 box", color: "#ca8a04" },
  { id: "chakkar-big", name: "Chakkar Big", category: "Chakkars", marketPrice: 200, price: 46.00, unit: "1 box", color: "#ca8a04" },
  { id: "chakkar-special", name: "Chakkar Special", category: "Chakkars", marketPrice: 400, price: 92.00, unit: "1 box", color: "#ca8a04" },
  { id: "chakkar-deluxe", name: "Chakkar Deluxe", category: "Chakkars", marketPrice: 500, price: 115.00, unit: "1 box", color: "#ca8a04" },
  { id: "disco-wheel", name: "Disco Wheel", category: "Chakkars", marketPrice: 300, price: 69.00, unit: "1 box", color: "#ca8a04" },
  { id: "spinner-super", name: "Spinner Super Deluxe", category: "Chakkars", marketPrice: 1000, price: 230.00, unit: "1 box", color: "#ca8a04" },
  { id: "spinner-special", name: "Spinner Special", category: "Chakkars", marketPrice: 600, price: 138.00, unit: "1 box", color: "#ca8a04" },

  // Pots & Fountains
  { id: "pot-small", name: "Small Pot", category: "Flower Pots", marketPrice: 150, price: 34.50, unit: "1 box", color: "#166534" },
  { id: "pot-big", name: "Big Pot", category: "Flower Pots", marketPrice: 210, price: 48.30, unit: "1 box", color: "#166534" },
  { id: "pot-special", name: "Special Pot", category: "Flower Pots", marketPrice: 250, price: 57.50, unit: "1 box", color: "#166534" },
  { id: "pot-ashoka", name: "Ashoka Pot", category: "Flower Pots", marketPrice: 400, price: 92.00, unit: "1 box", color: "#166534" },
  { id: "kotti-colour", name: "Colour Kotti", category: "Flower Pots", marketPrice: 750, price: 172.50, unit: "1 box", color: "#166534" },
  { id: "kotti-mega", name: "Mega Colour Kotti", category: "Flower Pots", marketPrice: 1100, price: 253.00, unit: "1 box", color: "#166534" },
  { id: "kotti-deluxe", name: "Mega Color Koti Deluxe", category: "Flower Pots", marketPrice: 1250, price: 287.50, unit: "1 box", color: "#166534" },
  { id: "fountain-tri", name: "Tri Colour Fountain", category: "Flower Pots", marketPrice: 1000, price: 230.00, unit: "1 box", color: "#166534" },

  // Pencils & Sparklers
  { id: "star-1.5", name: "1.5 Feet Twinkling Star", category: "Sparklers", marketPrice: 150, price: 34.50, unit: "1 pkt", color: "#6b21a8" },
  { id: "star-4", name: "4 Feet Twinkling Star", category: "Sparklers", marketPrice: 300, price: 69.00, unit: "1 pkt", color: "#6b21a8" },
  { id: "pencil-7", name: "7 Inch Pencil", category: "Fancy Items", marketPrice: 200, price: 46.00, unit: "1 box", color: "#6b21a8" },
  { id: "pencil-kids", name: "Kids Enjoy Pencil", category: "Fancy Items", marketPrice: 250, price: 57.50, unit: "1 box", color: "#6b21a8" },
  { id: "sparkler-7cm", name: "7cm Electric Sparkler", category: "Sparklers", marketPrice: 35, price: 8.05, unit: "1 pkt", color: "#6b21a8" },
  { id: "sparkler-30cm", name: "30cm Colour Sparkler", category: "Sparklers", marketPrice: 200, price: 46.00, unit: "1 pkt", color: "#6b21a8" },
  { id: "sparkler-50cm", name: "50cm Colour Sparkler", category: "Sparklers", marketPrice: 780, price: 179.40, unit: "1 pkt", color: "#6b21a8" },

  // Rockets & Fancy
  { id: "rocket-bomb", name: "Rocket Bomb", category: "Rockets", marketPrice: 350, price: 80.50, unit: "1 box", color: "#92400e" },
  { id: "rocket-lunic", name: "Lunic Rocket", category: "Rockets", marketPrice: 600, price: 138.00, unit: "1 box", color: "#92400e" },
  { id: "rocket-baby", name: "Baby Rocket", category: "Rockets", marketPrice: 200, price: 46.00, unit: "1 box", color: "#92400e" },
  { id: "siren", name: "Siren", category: "Fancy Items", marketPrice: 880, price: 202.40, unit: "1 box", color: "#92400e" },

  // Aerial Shots
  { id: "shots-12", name: "12 Shot Multi Colour", category: "Aerial Shots", marketPrice: 600, price: 138.00, unit: "1 box", color: "#be185d" },
  { id: "shots-30", name: "30 Shot Multicolour", category: "Aerial Shots", marketPrice: 1400, price: 322.00, unit: "1 box", color: "#be185d" },
  { id: "shots-60", name: "60 Shot Multicolour", category: "Aerial Shots", marketPrice: 2800, price: 644.00, unit: "1 box", color: "#be185d" },
  { id: "shots-100", name: "100 Shot Multi Colour", category: "Aerial Shots", marketPrice: 4700, price: 1081.00, unit: "1 box", color: "#be185d" },
  { id: "shots-120", name: "120 Shot Multicolour", category: "Aerial Shots", marketPrice: 5600, price: 1288.00, unit: "1 box", color: "#be185d" },
  { id: "shots-240", name: "240 Shot Multicolour", category: "Aerial Shots", marketPrice: 11200, price: 2576.00, unit: "1 box", color: "#be185d" },

  // Combos
  { id: "combo-3000", name: "Combo Pack 3000", category: "Gift Boxes", marketPrice: 15000, price: 3450.00, unit: "1 set", color: "#111827" },
  { id: "combo-5000", name: "Combo Pack 5000", category: "Gift Boxes", marketPrice: 25000, price: 5750.00, unit: "1 set", color: "#111827" },
  { id: "pack-kids-diamond", name: "Kids Diamond Pack", category: "Gift Boxes", marketPrice: 10000, price: 2300.00, unit: "1 set", color: "#111827" }
];

const defaultSlides = [];

const defaultSettings = {
  shopName: "Jey Crackers",
  phone: "9876543210",
  whatsapp: "919962384697",
  city: "Your City",
  heroTitle: "Buy Premium Diwali Crackers at Factory Prices",
  heroText: "Light up your Diwali with sparklers, fountains, rockets, gift boxes, and celebration crackers. Build your list and order in 2 minutes via WhatsApp with no login and no payment hassle."
};
