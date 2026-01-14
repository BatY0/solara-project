import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

// 1. SOLARA HAM RENK PALETİ
const solaraColors = {
  // Brand Greens (Güven, Tarım, Doğa)
  jungleGreen: { value: "#059669" },   // Ana Marka Rengi
  emerald: { value: "#10B981" },       // Başarı / Yüksek Skor
  deepGreen: { value: "#064E3B" },     // Hover / Koyu Ton
  softGreen: { value: "#D1FAE5" },     // Hafif Arkaplanlar

  // Solar & Accent (Enerji, Aksiyon, Uyarı)
  solarGold: { value: "#FBBF24" },     // Güneş İkonları
  tangerine: { value: "#F59E0B" },     // CTA (Analiz Et) Butonu
  deepOrange: { value: "#B45309" },    // Turuncu Hover

  // Neutrals (Modern Arayüz Yapısı)
  midnightSlate: { value: "#1E293B" }, // Sidebar / Koyu Metin
  slateText: { value: "#334155" },     // Gövde Metni
  slate400: { value: "#94a3b8" },      // Alt Metinler (Tailwind slate-400)
  borderGray: { value: "#E2E8F0" },    // Çizgiler
  iceWhite: { value: "#F8FAFC" },      // Sayfa Arka Planı (Canvas)
  pureWhite: { value: "#FFFFFF" },     // Kart İçi (Surface)

  // Data Visualization (Grafik Renkleri)
  waterBlue: { value: "#0EA5E9" },     // Su/Nem
  soilBrown: { value: "#8D6E63" },     // Toprak
  dangerRed: { value: "#EF4444" },     // Hata/Domates
}

// 2. TEMA KONFİGÜRASYONU (Chakra UI v3)
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Ham palete erişmek istersen diye 'solara' adıyla ekliyoruz
        solara: solaraColors,
        
        // Semantic Token Eşleştirmesi (Kullanım Amacına Göre)
        brand: {
          50: { value: solaraColors.softGreen.value },
          100: { value: "#ECFDF5" },
          500: { value: solaraColors.jungleGreen.value }, // Primary Color
          600: { value: solaraColors.deepGreen.value },   // Hover Color
        },
        
        accent: {
          400: { value: solaraColors.solarGold.value },
          500: { value: solaraColors.tangerine.value },   // Secondary / CTA
          600: { value: solaraColors.deepOrange.value },
        },

        neutral: {
          dark: { value: solaraColors.midnightSlate.value }, // Sidebar Background
          text: { value: solaraColors.slateText.value },     // Body Text
          subtext: { value: solaraColors.slate400.value },   // Secondary Text
          canvas: { value: solaraColors.iceWhite.value },    // Page Background
          surface: { value: solaraColors.pureWhite.value },  // Card Background
          border: { value: solaraColors.borderGray.value },
        },

        chart: {
            water: { value: solaraColors.waterBlue.value },
            soil: { value: solaraColors.soilBrown.value },
            danger: { value: solaraColors.dangerRed.value },
        }
      },
      fonts: {
        heading: { value: "'Inter', sans-serif" },
        body: { value: "'Inter', sans-serif" },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)