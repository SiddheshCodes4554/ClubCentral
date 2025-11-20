// Design Tokens for ClubCentral Landing Page
// Following 8px grid system and premium SaaS design principles

export const designTokens = {
  colors: {
    primary: {
      from: "#3B82F6",
      to: "#4C6EF5",
      gradient: "from-[#3B82F6] to-[#4C6EF5]"
    },
    accent: "#14B8A6",
    neutral: {
      dark: "#0F172A",
      mid: "#64748B",
      light: "#F8FAFC"
    },
    background: "#FFFFFF"
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
    h1: {
      fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
      lineHeight: "1.1",
      fontWeight: "700",
      letterSpacing: "-0.02em"
    },
    h2: {
      fontSize: "clamp(2rem, 4vw, 2.75rem)",
      lineHeight: "1.2",
      fontWeight: "700",
      letterSpacing: "-0.01em"
    },
    h3: {
      fontSize: "1.5rem",
      lineHeight: "1.3",
      fontWeight: "600"
    },
    body: {
      fontSize: "1rem",
      lineHeight: "1.6",
      fontWeight: "400"
    },
    small: {
      fontSize: "0.875rem",
      lineHeight: "1.5",
      fontWeight: "400"
    }
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  },
  borderRadius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem"
  },
  transitions: {
    fast: "150ms cubic-bezier(0.16, 1, 0.3, 1)",
    base: "200ms cubic-bezier(0.16, 1, 0.3, 1)",
    slow: "300ms cubic-bezier(0.16, 1, 0.3, 1)"
  }
} as const;

