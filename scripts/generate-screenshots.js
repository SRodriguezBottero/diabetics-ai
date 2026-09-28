const sharp = require('sharp');
const path = require('path');

async function generateScreenshots() {
  const narrowSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="540" height="720" viewBox="0 0 540 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6"/>
          <stop offset="100%" style="stop-color:#ffffff"/>
        </linearGradient>
      </defs>
      <rect width="540" height="720" fill="url(#bg)"/>
      
      <!-- Header -->
      <text x="270" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#4f46e5">Diabetics-AI</text>
      
      <!-- Card -->
      <rect x="20" y="90" width="500" height="280" rx="12" fill="white" filter="url(#shadow)"/>
      
      <!-- Input section -->
      <text x="40" y="130" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#1f2937">Añadir nueva medición</text>
      <rect x="40" y="150" width="320" height="44" rx="6" fill="#f9fafb" stroke="#d1d5db"/>
      <text x="56" y="178" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">Nivel de glucosa</text>
      <text x="380" y="178" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">mg/dL</text>
      <rect x="420" y="150" width="80" height="44" rx="6" fill="#4f46e5"/>
      <text x="460" y="178" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="white">+ Añadir</text>
      
      <!-- Chat section -->
      <text x="40" y="240" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#1f2937">Habla conmigo</text>
      <rect x="40" y="260" width="460" height="90" rx="6" fill="#f9fafb" stroke="#d1d5db"/>
      <text x="56" y="290" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">Escribe tu pregunta...</text>
      
      <!-- Readings card -->
      <rect x="20" y="390" width="500" height="200" rx="12" fill="white"/>
      <text x="40" y="430" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#1f2937">Mediciones recientes</text>
      
      <!-- Sample readings -->
      <text x="40" y="470" font-family="Arial, sans-serif" font-size="14" font-weight="500" fill="#4f46e5">120 mg/dL</text>
      <text x="460" y="470" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Hoy, 9:30 AM</text>
      
      <text x="40" y="510" font-family="Arial, sans-serif" font-size="14" font-weight="500" fill="#4f46e5">115 mg/dL</text>
      <text x="460" y="510" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Ayer, 8:15 PM</text>
      
      <text x="40" y="550" font-family="Arial, sans-serif" font-size="14" font-weight="500" fill="#4f46e5">135 mg/dL</text>
      <text x="460" y="550" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Ayer, 12:00 PM</text>
      
      <!-- Bottom nav hint -->
      <rect x="20" y="620" width="500" height="80" rx="12" fill="white"/>
      <text x="270" y="670" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">📊 Historial  |  🤖 AI Insights  |  📤 Exportar</text>
    </svg>
  `);

  const wideSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6"/>
          <stop offset="100%" style="stop-color:#ffffff"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      
      <!-- Header -->
      <text x="640" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#4f46e5">Diabetics-AI</text>
      
      <!-- Left column - Input & Chat -->
      <rect x="40" y="80" width="580" height="280" rx="12" fill="white"/>
      <text x="70" y="120" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#1f2937">Añadir nueva medición</text>
      <rect x="70" y="140" width="300" height="40" rx="6" fill="#f9fafb" stroke="#d1d5db"/>
      <rect x="390" y="140" width="100" height="40" rx="6" fill="#4f46e5"/>
      <text x="440" y="166" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="white">+ Añadir</text>
      
      <text x="70" y="220" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#1f2937">Habla conmigo</text>
      <rect x="70" y="240" width="520" height="100" rx="6" fill="#f9fafb" stroke="#d1d5db"/>
      
      <!-- Right column - Readings -->
      <rect x="660" y="80" width="580" height="280" rx="12" fill="white"/>
      <text x="690" y="120" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#1f2937">Mediciones recientes</text>
      
      <text x="690" y="160" font-family="Arial, sans-serif" font-size="14" font-weight="500" fill="#4f46e5">120 mg/dL</text>
      <text x="1180" y="160" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Hoy, 9:30 AM</text>
      
      <text x="690" y="200" font-family="Arial, sans-serif" font-size="14" font-weight="500" fill="#4f46e5">115 mg/dL</text>
      <text x="1180" y="200" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Ayer, 8:15 PM</text>
      
      <!-- Chart area -->
      <rect x="40" y="380" width="1200" height="300" rx="12" fill="white"/>
      <text x="70" y="420" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#1f2937">Historial de glucosa</text>
      
      <!-- Simple chart representation -->
      <polyline points="100,600 200,550 300,580 400,520 500,560 600,500 700,540 800,480 900,520 1000,490 1100,510" 
                fill="none" stroke="#4f46e5" stroke-width="3"/>
      
      <!-- X-axis labels -->
      <text x="100" y="650" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Lun</text>
      <text x="300" y="650" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Mar</text>
      <text x="500" y="650" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Mié</text>
      <text x="700" y="650" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Jue</text>
      <text x="900" y="650" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Vie</text>
      <text x="1100" y="650" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Sáb</text>
    </svg>
  `);

  const screenshotsDir = path.join(__dirname, '../public/screenshots');

  await sharp(narrowSvg)
    .png()
    .toFile(path.join(screenshotsDir, 'home-narrow.png'));
  console.log('Generated: home-narrow.png');

  await sharp(wideSvg)
    .png()
    .toFile(path.join(screenshotsDir, 'home-wide.png'));
  console.log('Generated: home-wide.png');

  console.log('Screenshots generated successfully!');
}

generateScreenshots().catch(console.error);
