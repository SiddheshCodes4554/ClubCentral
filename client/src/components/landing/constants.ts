// Image Configuration - Update these URLs with your actual dashboard images
export const imageConfig = {
  heroDashboard: "https://i.postimg.cc/G3v5MBRs/Screenshot-14-11-2025-95042-localhost.jpg", // Set this to your hero dashboard image URL (e.g., "/images/dashboard-hero.png")
  productImages: [
    "https://res.cloudinary.com/dbmzrpfuq/image/upload/v1763094934/Screenshot_14-11-2025_10525_localhost_fnfaod.jpg",
    "https://res.cloudinary.com/dbmzrpfuq/image/upload/v1763095126/Screenshot_14-11-2025_10838_localhost_uk7gqp.jpg",
    "https://res.cloudinary.com/dbmzrpfuq/image/upload/v1763095198/Screenshot_14-11-2025_10950_localhost_yfewdk.jpg",
    "https://res.cloudinary.com/dbmzrpfuq/image/upload/v1763095270/Screenshot_14-11-2025_101058_localhost_wbhpdw.jpg",
    "https://res.cloudinary.com/dbmzrpfuq/image/upload/v1763095409/Screenshot_14-11-2025_101322_localhost_lh92k1.jpg",
    "https://res.cloudinary.com/dbmzrpfuq/image/upload/v1763095505/Screenshot_14-11-2025_101441_localhost_y27n1j.jpg"
  ]
};

// Premium Design Tokens - Aligned with Linear, Superhuman, Notion quality
export const tokens = {
  colors: {
    primary: {
      base: "#3B82F6",
      hover: "#2563EB",
      active: "#1D4ED8",
      light: "#DBEAFE",
      gradient: "from-[#3B82F6] to-[#4C6EF5]"
    },
    accent: {
      base: "#14B8A6",
      hover: "#0D9488",
      light: "#CCFBF1"
    },
    neutral: {
      ink: "#0F172A",           // Headlines, primary text
      inkSecondary: "#1E293B",  // Secondary text
      inkTertiary: "#334155",   // Tertiary text
      body: "#475569",          // Body copy
      muted: "#64748B",         // Muted text, captions
      placeholder: "#94A3B8",   // Placeholder text
      borderLight: "#E2E8F0",   // Light borders
      border: "#CBD5E1",        // Default borders
      divider: "#F1F5F9",       // Subtle dividers
      bgPrimary: "#FFFFFF",      // Primary background
      bgSecondary: "#F8FAFC",   // Secondary background
      bgTertiary: "#F1F5F9"     // Tertiary background
    }
  },
  spacing: {
    xs: "0.5rem",    // 8px
    sm: "1rem",      // 16px
    md: "1.5rem",    // 24px
    lg: "2rem",      // 32px
    xl: "3rem",      // 48px
    "2xl": "4rem",   // 64px
    "3xl": "6rem"    // 96px
  },
  typography: {
    h1: "text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] font-bold leading-[1.1] tracking-[-0.02em]",
    h2: "text-[2rem] md:text-[2.25rem] lg:text-[2.75rem] font-bold leading-[1.2] tracking-[-0.01em]",
    h3: "text-[1.5rem] md:text-[1.75rem] lg:text-[2rem] font-semibold leading-[1.3]",
    h4: "text-xl font-semibold leading-[1.4]",
    bodyLarge: "text-lg md:text-xl leading-[1.6]",
    body: "text-base leading-[1.6]",
    bodySmall: "text-sm leading-[1.5]",
    small: "text-xs leading-[1.4] font-medium tracking-[0.01em]"
  },
  shadows: {
    subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    soft: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
    medium: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    elevated: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    floating: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    hero: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
  },
  radius: {
    sm: "0.5rem",   // 8px
    md: "0.75rem",  // 12px
    lg: "1rem",     // 16px
    xl: "1.5rem",   // 24px
    full: "9999px"
  },
  transitions: {
    fast: "150ms cubic-bezier(0.16, 1, 0.3, 1)",
    base: "200ms cubic-bezier(0.16, 1, 0.3, 1)",
    slow: "300ms cubic-bezier(0.16, 1, 0.3, 1)",
    verySlow: "600ms cubic-bezier(0.16, 1, 0.3, 1)"
  }
};
