# ClubCentral Landing Page - Premium UI/UX Design Specification

**Version:** 1.0  
**Date:** 2025  
**Designer:** Senior Product Designer  
**Reference Quality:** Linear, Superhuman, Notion, Cron, Vercel, Framer, Raycast

---

## 🎯 1. Art Direction

### Design Philosophy
ClubCentral's landing page embodies a **premium, minimal, calm, confident, organized, and trustworthy** aesthetic. The design should feel handcrafted, intentional, and sophisticated—never generic or template-like.

### Visual Style Keywords
- **Premium**: High-quality materials, refined details, sophisticated interactions
- **Minimal**: Essential elements only, generous whitespace, clear hierarchy
- **Calm**: Soft colors, gentle motion, breathing room
- **Confident**: Bold typography, clear messaging, decisive layouts
- **Organized**: 8px grid system, consistent spacing, logical flow
- **Trustworthy**: Professional, reliable, institutional-grade quality

### Design Principles
1. **8px Grid System**: All spacing must align to 8px increments (8, 16, 24, 32, 40, 48, 64, 96px)
2. **Intentional Whitespace**: Use whitespace as a design element, not filler
3. **Soft Depth**: Subtle shadows, layers, and blur effects—never harsh or cartoonish
4. **Micro-interactions**: Every interactive element should provide gentle, meaningful feedback
5. **Visual Hierarchy**: Clear distinction between primary, secondary, and tertiary information
6. **Consistency**: Every component follows the same design language

---

## 🎨 2. Color System

### Primary Colors
```
Primary Blue (Brand):
- Base: #3B82F6 (Blue 500)
- Hover: #2563EB (Blue 600)
- Active: #1D4ED8 (Blue 700)
- Light: #DBEAFE (Blue 100)
- Gradient: linear-gradient(135deg, #3B82F6 0%, #4C6EF5 100%)
- Usage: Primary CTAs, links, brand elements

Accent Teal (Secondary):
- Base: #14B8A6 (Teal 500)
- Hover: #0D9488 (Teal 600)
- Light: #CCFBF1 (Teal 100)
- Usage: Success states, highlights, secondary actions
```

### Neutral Palette
```
Ink (Text Primary):
- #0F172A (Slate 900) - Headlines, primary text
- #1E293B (Slate 800) - Secondary text
- #334155 (Slate 700) - Tertiary text

Body Text:
- #475569 (Slate 600) - Body copy
- #64748B (Slate 500) - Muted text, captions
- #94A3B8 (Slate 400) - Placeholder text

Borders & Dividers:
- #E2E8F0 (Slate 200) - Light borders
- #CBD5E1 (Slate 300) - Default borders
- #F1F5F9 (Slate 100) - Subtle dividers

Backgrounds:
- #FFFFFF - Primary background
- #F8FAFC (Slate 50) - Secondary background
- #F1F5F9 (Slate 100) - Tertiary background
```

### Interactive States
```
Hover:
- Buttons: 2% scale increase, shadow elevation
- Links: Color transition, underline animation
- Cards: 4px lift, shadow increase

Active:
- Buttons: 1% scale decrease, shadow reduction
- Cards: Slight press effect

Focus:
- Ring: 2px solid #3B82F6 with 4px offset
- Background: rgba(59, 130, 246, 0.1)
```

### Shadow System
```
Level 0 (None): 0 0 0 0 rgba(0,0,0,0)
Level 1 (Subtle): 0 1px 2px 0 rgba(0,0,0,0.05)
Level 2 (Soft): 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)
Level 3 (Medium): 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)
Level 4 (Elevated): 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)
Level 5 (Floating): 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)
Level 6 (Hero): 0 25px 50px -12px rgba(0,0,0,0.25)
```

### Depth Layers
```
Layer 0: Base background (#FFFFFF)
Layer 1: Cards, panels (shadow level 2-3)
Layer 2: Floating elements (shadow level 4-5)
Layer 3: Hero mockups (shadow level 6)
Layer 4: Navigation (backdrop blur, shadow level 1)
```

---

## ✍️ 3. Typography System

### Font Family
**Primary:** Inter (Variable Weight: 400-700)  
**Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

**Rationale:** Inter provides excellent readability at all sizes, professional appearance, and wide language support. Similar to fonts used by Linear, Vercel, and Notion.

### Type Scale
```
H1 (Hero Headline):
- Desktop: 56px (3.5rem) / Line Height: 1.1 / Weight: 700 / Tracking: -0.02em
- Tablet: 48px (3rem) / Line Height: 1.1 / Weight: 700 / Tracking: -0.02em
- Mobile: 40px (2.5rem) / Line Height: 1.1 / Weight: 700 / Tracking: -0.02em

H2 (Section Headlines):
- Desktop: 44px (2.75rem) / Line Height: 1.2 / Weight: 700 / Tracking: -0.01em
- Tablet: 36px (2.25rem) / Line Height: 1.2 / Weight: 700 / Tracking: -0.01em
- Mobile: 32px (2rem) / Line Height: 1.2 / Weight: 700 / Tracking: -0.01em

H3 (Subsection Headlines):
- Desktop: 32px (2rem) / Line Height: 1.3 / Weight: 600 / Tracking: 0
- Tablet: 28px (1.75rem) / Line Height: 1.3 / Weight: 600 / Tracking: 0
- Mobile: 24px (1.5rem) / Line Height: 1.3 / Weight: 600 / Tracking: 0

H4 (Card Titles):
- All: 20px (1.25rem) / Line Height: 1.4 / Weight: 600 / Tracking: 0

Body Large (Hero Description):
- Desktop: 20px (1.25rem) / Line Height: 1.6 / Weight: 400 / Tracking: 0
- Mobile: 18px (1.125rem) / Line Height: 1.6 / Weight: 400 / Tracking: 0

Body (Default):
- All: 16px (1rem) / Line Height: 1.6 / Weight: 400 / Tracking: 0

Body Small (Captions):
- All: 14px (0.875rem) / Line Height: 1.5 / Weight: 400 / Tracking: 0

Small (Labels, Badges):
- All: 12px (0.75rem) / Line Height: 1.4 / Weight: 500 / Tracking: 0.01em
```

### Typography Usage Guidelines
1. **Headlines**: Use H1 for hero, H2 for major sections, H3 for subsections
2. **Body Text**: Maximum 65-75 characters per line for optimal readability
3. **Line Height**: 1.6 for body text, 1.1-1.3 for headlines
4. **Color Hierarchy**: 
   - H1-H3: #0F172A (Ink)
   - Body: #475569 (Slate 600)
   - Muted: #64748B (Slate 500)
5. **Letter Spacing**: Negative tracking for large headlines, normal for body

---

## 📐 4. Component Library

### Navigation Bar
**Height:** 64px (desktop), 56px (mobile)  
**Background:** Transparent → White/80 with backdrop-blur-xl on scroll  
**Padding:** 24px horizontal (desktop), 16px (mobile)  
**Border:** 1px solid #E2E8F0 (appears on scroll)  
**Logo:** 28px height, 4px gap to text  
**Nav Links:** 14px, 500 weight, #64748B → #0F172A on hover  
**Link Spacing:** 32px between items  
**CTA Button:** Primary blue, 40px height, 16px horizontal padding  
**Hover Effect:** Underline animation (1px, #3B82F6, 300ms ease)

### Hero Section
**Layout:** 2-column grid (desktop), stacked (mobile)  
**Container:** max-width 1280px, 48px horizontal padding  
**Vertical Spacing:** 96px top, 80px bottom  
**Headline:** H1, max-width 640px  
**Description:** Body Large, max-width 560px, 24px margin below headline  
**CTA Buttons:** 48px height, 24px horizontal padding, 12px gap between  
**Badge:** 8px padding, 20px border-radius, #3B82F6/10 background  
**Dashboard Mockup:** 
- Border-radius: 24px
- Shadow: Level 6
- Border: 1px solid #E2E8F0
- Tilt animation: ±12px based on mouse position
- Floating cards: 8px offset, shadow level 4

### Buttons

**Primary Button:**
- Height: 48px (large), 40px (default), 32px (small)
- Padding: 24px horizontal (large), 16px (default), 12px (small)
- Background: #3B82F6 → #2563EB on hover
- Text: 16px, 500 weight, white
- Border-radius: 12px
- Shadow: Level 2 → Level 3 on hover
- Transition: 200ms cubic-bezier(0.16, 1, 0.3, 1)
- Hover: scale(1.02), shadow elevation
- Active: scale(0.98)

**Secondary Button (Outline):**
- Same dimensions as primary
- Background: transparent
- Border: 1px solid #E2E8F0
- Text: #0F172A
- Hover: Background #F8FAFC, border #CBD5E1

**Ghost Button:**
- Same dimensions, no border
- Text: #64748B → #0F172A on hover
- Hover: Background #F8FAFC

### Feature Cards
**Layout:** 3-column grid (desktop), 2-column (tablet), 1-column (mobile)  
**Card Dimensions:** Auto height, full width  
**Padding:** 32px (24px mobile)  
**Border:** 1px solid #E2E8F0  
**Border-radius:** 16px  
**Background:** #FFFFFF  
**Icon Container:** 48px × 48px, #3B82F6/10 background, 12px border-radius  
**Icon:** 24px × 24px, #3B82F6  
**Title:** H4, 16px margin below icon  
**Description:** Body, #64748B, 8px margin below title  
**Hover:** 
- Lift: translateY(-4px)
- Shadow: Level 2 → Level 4
- Border: #CBD5E1
- Icon background: #3B82F6/20
- Transition: 300ms cubic-bezier(0.16, 1, 0.3, 1)

### Section Containers
**Max-width:** 1280px  
**Horizontal Padding:** 48px (desktop), 24px (tablet), 16px (mobile)  
**Vertical Padding:** 96px (desktop), 64px (tablet), 48px (mobile)  
**Background Alternation:** White ↔ #F8FAFC

### Grid System
**Base:** 12-column grid  
**Gap:** 24px (desktop), 16px (tablet/mobile)  
**Breakpoints:**
- Mobile: < 768px (1 column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (3-4 columns)

---

## 🧩 5. Section-by-Section Blueprint

### A. Navigation Bar
**Visual Description:**
- Fixed position, top of viewport
- Transparent background initially
- On scroll: white/80 background with backdrop-blur-xl
- Subtle border appears (1px #E2E8F0)
- Logo + brand name on left (28px logo, 18px text, 4px gap)
- Center: Navigation links (Features, How it works, Benefits)
- Right: Login (ghost) + Get Started (primary) buttons
- Smooth slide-down animation on page load
- Mobile: Hamburger menu, full-screen overlay

**Interaction:**
- Nav links: Smooth scroll to sections
- Hover: Underline animation (1px, #3B82F6, 300ms)
- CTA: Primary button with hover scale

### B. Hero Section
**Visual Description:**
- Full viewport height (min-height: 100vh)
- Subtle gradient background: white → #F8FAFC → white
- Left column (50% width):
  - Badge: "Trusted by 500+ clubs" (8px padding, rounded-full)
  - H1: "The operating system for college clubs" (gradient on "for college clubs")
  - Body Large: 2-line description
  - CTA buttons: Primary + Secondary (48px height, 12px gap)
- Right column (50% width):
  - Dashboard mockup in white card
  - 24px border-radius, shadow level 6
  - Tilt animation based on mouse position (±12px)
  - Two floating cards (top-right, bottom-left)
  - Floating animation: 8px vertical movement, 4s duration

**Interaction:**
- Mouse movement: Dashboard tilts subtly
- Scroll: Dashboard fades slightly (opacity 1 → 0.8)
- Buttons: Hover scale, active press

### C. Feature Highlights
**Visual Description:**
- White background section
- Centered headline (H2) + description (Body, max-width 640px)
- 3-column grid of feature cards
- Each card: Icon (48px), Title (H4), Description (Body)
- Cards have subtle borders, hover elevation
- 24px gap between cards

**Interaction:**
- Scroll-triggered fade-up animation
- Staggered delay: 100ms per card
- Hover: Lift + shadow increase

### D. Institution Mode Explanation
**Visual Description:**
- White background
- 2-column layout (50/50 split)
- Left: H2 headline + Body description
- Right: Visual flow diagram
  - Three boxes: Institution → Club → President & Council → Operations
  - Connected with arrows (ChevronRight icons)
  - Boxes: #F8FAFC background, 1px border, 16px padding
  - 12px border-radius

**Interaction:**
- Fade-in on scroll
- Boxes have subtle hover effect

### E. How It Works (3-Step)
**Visual Description:**
- White background
- Centered headline + description
- 3-column grid (equal width)
- Each step:
  - Icon container (64px × 64px, #3B82F6/10)
  - Large number (80px, #F1F5F9, bold)
  - Title (H3)
  - Description (Body)
- Vertical alignment: center

**Interaction:**
- Staggered fade-up (150ms delay per step)
- Icon containers: Subtle pulse on hover

### F. Dashboard Previews
**Visual Description:**
- #F8FAFC background
- Centered headline + description
- Stacked dashboard screenshots (3-4 images)
- Each image:
  - White background
  - 24px border-radius
  - Shadow level 5
  - Slight rotation/offset for depth
  - Overlapping layout (z-index stacking)
- Floating animation: Alternating up/down movement (8px, 6s duration)

**Interaction:**
- Scroll-triggered reveal
- Images float independently
- Click to expand (optional)

### G. Benefits Section
**Visual Description:**
- #F8FAFC background
- Centered headline
- 4 benefit items, alternating layout:
  - Item 1: Text left, illustration right
  - Item 2: Text right, illustration left
  - Item 3: Text left, illustration right
  - Item 4: Text right, illustration left
- Each item:
  - Icon (56px × 56px, #3B82F6/10)
  - Title (H3)
  - Description (Body Large)
  - Illustration placeholder (256px height, #F1F5F9 background)

**Interaction:**
- Scroll-triggered slide-in (left/right based on side)
- 600ms duration, ease-out

### H. Dashboard Module Showcase
**Visual Description:**
- White background
- Centered headline
- 4-column grid (8 modules)
- Each module:
  - Icon container (44px × 44px, #3B82F6/10)
  - Title (14px, 600 weight)
  - 20px padding
  - 1px border, 12px border-radius

**Interaction:**
- Staggered fade-in (50ms delay)
- Hover: 4px lift, shadow increase

### I. Final CTA Banner
**Visual Description:**
- #0F172A (dark) background
- White text
- Centered content (max-width 768px)
- H2 headline (white)
- Body description (gray-400)
- Two buttons:
  - Primary: #3B82F6 background, white text
  - Secondary: Outline, white border, white text
- 96px vertical padding

**Interaction:**
- Fade-up on scroll
- Buttons: Standard hover effects

### J. Footer
**Visual Description:**
- White background
- 1px top border (#E2E8F0)
- 4-column grid (desktop), stacked (mobile)
- Column 1: Logo + tagline
- Columns 2-4: Links (Product, Company, Support)
- Bottom: Copyright (centered, 1px top border)
- 48px vertical padding

**Interaction:**
- Links: Color transition on hover

---

## 🌀 6. Interaction & Motion Guidelines

### Easing Curves
```
Standard: cubic-bezier(0.16, 1, 0.3, 1) - Smooth, natural
Entrance: cubic-bezier(0.16, 1, 0.3, 1) - Gentle start
Exit: cubic-bezier(0.4, 0, 1, 1) - Quick finish
Spring: { type: "spring", stiffness: 400, damping: 30 } - Bouncy
```

### Duration Guidelines
```
Fast: 150ms - Hover states, micro-interactions
Base: 200ms - Standard transitions
Slow: 300ms - Card animations, page transitions
Very Slow: 600ms - Section reveals, complex animations
```

### Motion Principles
1. **Subtlety**: Motion should enhance, not distract
2. **Purpose**: Every animation serves a function
3. **Performance**: 60fps, GPU-accelerated transforms
4. **Accessibility**: Respect prefers-reduced-motion
5. **Consistency**: Same motion for similar interactions

### Scroll-Triggered Animations
- **Fade-up**: opacity 0 → 1, translateY(20px) → 0
- **Slide-in**: opacity 0 → 1, translateX(±40px) → 0
- **Scale**: opacity 0 → 1, scale(0.95) → 1
- **Stagger**: 50-150ms delay between items

### Hover States
- **Buttons**: scale(1.02), shadow elevation, 200ms
- **Cards**: translateY(-4px), shadow increase, 300ms
- **Links**: Color transition, underline, 200ms
- **Icons**: scale(1.1), color shift, 200ms

---

## 🖼️ 7. Dashboard Mockup Direction

### Framing Guidelines
1. **Real UI Screenshots**: Use actual product screenshots, not mockups
2. **Clean Borders**: 1px solid #E2E8F0, 24px border-radius
3. **Browser Chrome**: Optional—if included, use subtle gray (#F1F5F9)
4. **Shadow Depth**: Level 6 for hero, Level 5 for previews
5. **Aspect Ratio**: Maintain 16:10 or 16:9 for consistency

### Hero Mockup
- **Size**: 100% width of container (max 640px)
- **Position**: Right column, centered vertically
- **Animation**: Tilt based on mouse position (±12px)
- **Floating Cards**: 2 cards, 8px offset, shadow level 4
- **Background**: White card on gradient background

### Preview Gallery
- **Count**: 3-4 screenshots
- **Layout**: Stacked, overlapping (z-index)
- **Spacing**: 24px offset between images
- **Rotation**: ±2° for depth (optional)
- **Animation**: Floating (alternating, 6s duration)

### Image Quality
- **Resolution**: Minimum 2x for retina displays
- **Format**: WebP with JPEG fallback
- **Optimization**: Compressed, < 500KB per image
- **Loading**: Lazy load below fold

---

## ⚠️ 8. Do's and Don'ts

### ✅ Do's

**Layout & Spacing:**
- ✅ Use 8px grid system consistently
- ✅ Maintain generous whitespace (minimum 48px between sections)
- ✅ Align all elements to grid
- ✅ Use consistent padding (24px, 32px, 48px)
- ✅ Create clear visual hierarchy

**Typography:**
- ✅ Use Inter font family
- ✅ Maintain 65-75 character line length
- ✅ Use proper heading hierarchy (H1 → H2 → H3)
- ✅ Ensure sufficient contrast (WCAG AA minimum)
- ✅ Use negative letter-spacing for large headlines

**Colors:**
- ✅ Stick to defined color palette
- ✅ Use subtle gradients (primary blue only)
- ✅ Maintain consistent opacity levels
- ✅ Use shadows for depth, not borders
- ✅ Test in light and dark modes (if applicable)

**Interactions:**
- ✅ Provide hover feedback on all interactive elements
- ✅ Use smooth transitions (200-300ms)
- ✅ Respect prefers-reduced-motion
- ✅ Ensure keyboard navigation works
- ✅ Add focus states for accessibility

**Components:**
- ✅ Use consistent border-radius (12px, 16px, 24px)
- ✅ Apply shadow system consistently
- ✅ Maintain button height standards (32px, 40px, 48px)
- ✅ Use icon sizes consistently (16px, 20px, 24px)
- ✅ Keep card padding consistent (24px, 32px)

### ❌ Don'ts

**Layout & Spacing:**
- ❌ Don't use random spacing values
- ❌ Don't overcrowd sections
- ❌ Don't break the 8px grid
- ❌ Don't use excessive padding
- ❌ Don't create inconsistent gaps

**Typography:**
- ❌ Don't use more than 3 font sizes per section
- ❌ Don't use decorative fonts
- ❌ Don't use text smaller than 12px
- ❌ Don't use excessive line-height (> 1.8)
- ❌ Don't use all caps for body text

**Colors:**
- ❌ Don't use bright, saturated colors
- ❌ Don't use rainbow gradients
- ❌ Don't use pure black (#000000)
- ❌ Don't use low contrast text
- ❌ Don't use more than 2 accent colors

**Interactions:**
- ❌ Don't use bouncy, cartoonish animations
- ❌ Don't animate everything at once
- ❌ Don't use transitions longer than 600ms
- ❌ Don't ignore reduced motion preferences
- ❌ Don't use hover effects without purpose

**Components:**
- ❌ Don't use inconsistent border-radius
- ❌ Don't use harsh shadows or glows
- ❌ Don't use generic icon sets
- ❌ Don't create AI-looking mockups
- ❌ Don't use template-like layouts

**General:**
- ❌ Don't use stock photos
- ❌ Don't use generic illustrations
- ❌ Don't create cluttered designs
- ❌ Don't ignore mobile experience
- ❌ Don't sacrifice performance for visuals

---

## 🎯 9. Example Copywriting

### Hero Section
**Headline:** "The operating system for college clubs."  
**Subheadline:** "Institution-grade control for clubs. President-grade velocity for operations — events, tasks, finance, and social in one dashboard."  
**CTA Primary:** "Get Started"  
**CTA Secondary:** "Watch Demo"  
**Badge:** "Trusted by 500+ clubs"

### Feature Grid
**Headline:** "Everything you need in one place"  
**Description:** "Powerful features designed to streamline your club operations"

**Features:**
1. **Event Management** - "Plan and track all club events with intelligent scheduling."
2. **Task Tracking** - "Assign tasks and deadlines with complete visibility."
3. **Team Organization** - "Structure your team with clear roles and permissions."
4. **Member Approvals** - "Streamline approvals with automated workflows."
5. **Finance Tracking** - "Track income, expenses, and manage approvals."
6. **Social Scheduling** - "Plan and schedule content across platforms."

### Institution Mode
**Headline:** "Why Institutions choose ClubCentral"  
**Description:** "Create clubs, assign Presidents and Council, enforce governance and workflows. One source of truth across campus."

### How It Works
**Headline:** "How it works"  
**Description:** "Get started in three simple steps"

**Steps:**
1. **Create Your Club** - "Set up your club with a unique code and onboard your core team."
2. **Approve & Organize** - "Approve applicants, assign roles, and structure your team."
3. **Manage Everything** - "Track events, tasks, finance, and social posts from one dashboard."

### Benefits
**Headline:** "Why clubs choose ClubCentral"

**Benefits:**
1. **Centralized Operations** - "Everything in one place. No more switching between multiple tools and platforms."
2. **Zero Confusion** - "Clear workflows and transparent processes keep everyone on the same page."
3. **Transparent Workflows** - "See exactly what's happening at every stage of your operations."
4. **Faster Execution** - "Streamlined planning and execution means events happen on time, every time."

### Final CTA
**Headline:** "Ready to streamline your club operations?"  
**Description:** "Start your free trial today. No credit card required."  
**CTA Primary:** "Get Started"  
**CTA Secondary:** "Watch Demo"

---

## 🎨 10. Final Visual Walkthrough

### Top to Bottom Experience

**1. Navigation (0-64px)**
- Fixed, transparent initially
- Logo + brand name on left
- Navigation links center
- CTAs on right
- Smooth slide-down on load
- On scroll: white background with blur, border appears

**2. Hero Section (64px-100vh)**
- Full viewport height
- Subtle gradient background
- Left: Badge, headline (gradient text), description, CTAs
- Right: Dashboard mockup with tilt animation
- Floating cards (top-right, bottom-left)
- Smooth fade-in on load

**3. Feature Grid (100vh-100vh+480px)**
- White background
- Centered headline + description
- 3-column grid of feature cards
- Cards fade up with stagger
- Hover: lift + shadow increase

**4. Institution Mode (100vh+480px-100vh+960px)**
- White background
- 2-column layout
- Left: Headline + description
- Right: Flow diagram (Institution → Club → Operations)
- Fade-in on scroll

**5. How It Works (100vh+960px-100vh+1440px)**
- White background
- Centered headline
- 3-column grid (steps)
- Each step: Icon, number, title, description
- Staggered fade-up animation

**6. Dashboard Previews (100vh+1440px-100vh+1920px)**
- #F8FAFC background
- Centered headline
- Stacked dashboard screenshots
- Floating animation (alternating)
- Overlapping layout for depth

**7. Benefits (100vh+1920px-100vh+2880px)**
- #F8FAFC background
- Centered headline
- 4 items, alternating layout
- Slide-in animation (left/right)
- Icon + title + description + illustration

**8. Module Showcase (100vh+2880px-100vh+3360px)**
- White background
- Centered headline
- 4-column grid (8 modules)
- Staggered fade-in
- Hover: lift effect

**9. Final CTA (100vh+3360px-100vh+3456px)**
- #0F172A background
- White text
- Centered content
- Headline + description + 2 CTAs
- Fade-up on scroll

**10. Footer (100vh+3456px-end)**
- White background
- Top border
- 4-column grid (links)
- Copyright at bottom
- Minimal, clean design

---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Single column layouts
- Reduced padding (16px horizontal)
- Smaller typography (H1: 40px, H2: 32px)
- Stacked hero (content above mockup)
- Hamburger navigation
- Touch-optimized buttons (minimum 44px height)

### Tablet (768px - 1024px)
- 2-column grids where applicable
- 24px horizontal padding
- Medium typography (H1: 48px, H2: 36px)
- Side-by-side hero (if space allows)
- Full navigation menu

### Desktop (> 1024px)
- 3-4 column grids
- 48px horizontal padding
- Full typography scale
- Side-by-side hero
- Full navigation + CTAs

---

## 🎯 Implementation Notes

1. **Performance**: Lazy load images, optimize animations
2. **Accessibility**: ARIA labels, keyboard navigation, focus states
3. **SEO**: Semantic HTML, proper heading hierarchy
4. **Analytics**: Track CTA clicks, scroll depth, section views
5. **Testing**: Cross-browser, responsive, performance testing

---

**End of Design Specification**

This specification serves as the complete blueprint for implementing a world-class landing page that matches the quality of Linear, Superhuman, Notion, and other premium SaaS products.

