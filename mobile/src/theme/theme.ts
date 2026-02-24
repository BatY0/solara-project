// Solara Color Palette (Matching Frontend)
export const colors = {
  // Brand Greens
  jungleGreen: "#059669",   // Primary Brand Color
  emerald: "#10B981",       // Success
  deepGreen: "#064E3B",     // Hover / Dark tone
  softGreen: "#D1FAE5",     // Light backgrounds
  
  // Solar & Accent
  solarGold: "#FBBF24",     // Sun icons
  tangerine: "#F59E0B",     // CTA
  deepOrange: "#B45309",    // Orange Hover
  
  // Neutrals
  midnightSlate: "#1E293B", // Sidebar / Dark Text
  slateText: "#334155",     // Body Text
  slate400: "#94a3b8",      // Subtext
  borderGray: "#E2E8F0",    // Borders
  iceWhite: "#F8FAFC",      // Canvas
  pureWhite: "#FFFFFF",     // Surface
  
  // Data Visualization
  waterBlue: "#0EA5E9",
  soilBrown: "#8D6E63",
  dangerRed: "#EF4444",
};

export const theme = {
  colors: {
    brand: {
      50: colors.softGreen,
      100: "#ECFDF5",
      500: colors.jungleGreen,
      600: colors.deepGreen,
      900: "#064E3B", // Darkest green for backgrounds
    },
    accent: {
      400: colors.solarGold,
      500: colors.tangerine,
      600: colors.deepOrange,
    },
    neutral: {
      dark: colors.midnightSlate,
      text: colors.slateText,
      subtext: colors.slate400,
      canvas: colors.iceWhite,
      surface: colors.pureWhite,
      border: colors.borderGray,
    },
    chart: {
      water: colors.waterBlue,
      soil: colors.soilBrown,
      danger: colors.dangerRed,
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
  }
};
