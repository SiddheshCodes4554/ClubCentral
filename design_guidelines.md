# ClubCentral Design Guidelines

## Design Approach
**System**: Fluent Design + Linear-inspired aesthetics
**Rationale**: SaaS productivity tool requiring clarity, efficiency, and professional polish for administrative workflows

## Typography
**Font Families**:
- Primary: Inter (headings, UI elements, navigation)
- Secondary: SF Mono (data tables, IDs, codes)

**Hierarchy**:
- Page Titles: 32px, semibold
- Section Headers: 24px, semibold
- Card Titles: 18px, medium
- Body Text: 14px, regular
- Table Data: 13px, regular
- Labels/Meta: 12px, medium, uppercase tracking

## Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8, 12, 16 (p-2, m-4, gap-6, py-8, etc.)
**Grid**: Consistent 24px base rhythm

**Application Structure**:
- Fixed sidebar: 280px width
- Main content area: Full remaining width with max-w-7xl container
- Page padding: px-8 py-6
- Card spacing: gap-6 for grid layouts
- Section spacing: mb-12 between major sections

## Component Library

### Navigation
**Sidebar**:
- Fixed left position, full height
- Club logo + name at top (py-6)
- Role badge below club name
- Navigation items with icon + label, 40px height, rounded-lg on hover
- Nested sub-items indented by 12px
- User profile section at bottom with avatar, name, role

### Dashboards
**Dashboard Cards**:
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Card height: min-h-32, with p-6
- Include metric number (48px, bold), label, and trend indicator
- Action buttons in top-right corner

**Quick Actions Panel**:
- Prominent card at top with 2-3 primary actions as large buttons
- Each button: icon + label, min-h-20

### Data Tables
**Structure**:
- Sticky header row with semibold text
- Alternating row subtle background treatment
- Row height: 56px for breathing room
- Action column always right-aligned with icon buttons
- Include search bar and filters above table
- Pagination controls below

**Table Features**:
- Status badges with rounded-full styling
- Avatar + name combinations for user columns
- Expandable rows for detailed views (optional usage)

### Forms & Modals
**Forms**:
- Two-column layout on desktop (md:grid-cols-2)
- Single column on mobile
- Input height: 44px
- Label above input with mb-2
- Helper text below inputs in smaller, muted text
- Required field indicators (asterisk)

**Modals**:
- Max width: 600px for forms, 800px for complex content
- Overlay with backdrop blur
- Header with title + close button
- Footer with action buttons (right-aligned)
- Scrollable body content

### Authentication Pages
**Layout**: Centered card, max-w-md, with logo and club branding
**President Signup**: Multi-step form with progress indicator (3 steps: User Info → Club Info → Review)
**Login**: Simple centered form with "Create Club" link
**Member Application**: Full-page form via invite link with club branding header

### Cards & Content Blocks
**Standard Card**:
- Rounded-xl corners
- Subtle shadow
- p-6 padding
- Header with title + action icon
- Content area with appropriate spacing

**Event/Task Cards**:
- Include status indicator (vertical colored border-l-4)
- Metadata row (date, assignee, budget) with icons
- Action dropdown in top-right

**Finance Cards**:
- Split layout: transaction info left, amount right
- Receipt thumbnail if available
- Approval status badge
- President/VP approval signature area

### Status & Badges
**System**: Rounded-full px-3 py-1 with appropriate semantic treatments
- Pending: Amber tone
- Approved/Completed: Green tone
- Rejected/Cancelled: Red tone
- In Progress: Blue tone
- Draft: Gray tone

### Buttons & Actions
**Primary**: Solid fill, rounded-lg, px-6 py-3
**Secondary**: Outlined, same dimensions
**Icon Buttons**: 40px × 40px, rounded-lg
**Destructive**: Red tone for delete/reject actions

### Role-Based UI
**Dashboard Variations**:
- President: Full admin access, settings tab visible
- Vice-President: Most features, no club settings
- Council Heads: Filtered views based on permissions

**Visual Indicators**:
- Role badge in sidebar and profile
- Permission-gated sections with subtle lock icon when not accessible
- Different dashboard widgets based on role

### Pending Approvals Interface
**Layout**: Split view
- Left: List of pending applicants (scrollable)
- Right: Selected applicant details with full profile
- Action bar: Approve (with role dropdown) + Reject buttons

### Settings Page
**Organization**: Tabbed interface
- Club Profile tab
- Members & Roles tab
- Integrations tab
- Danger Zone (delete club, regenerate code)

## Images
No hero images needed for this internal SaaS tool. Focus on:
- Club logo uploads (displayed in sidebar and settings)
- User avatars (32px circular in tables/lists, 48px in profiles)
- Receipt/document previews in finance module
- Social post image thumbnails in planner

**Icon System**: Heroicons (outline for navigation, solid for actions)

## Interaction Patterns
**Page Transitions**: Instant, no fade effects
**Loading States**: Skeleton screens for tables, spinner for form submissions
**Toast Notifications**: Top-right, 4-second auto-dismiss
**Confirmations**: Modal dialogs for destructive actions
**Inline Editing**: Click to edit for certain fields in tables (role assignments)

## Unique Features
**Invite Link Generator**: Dedicated modal with copyable link + QR code display
**Club Code Display**: Monospace font, copyable with icon button
**Permission Matrix**: Visual grid showing role permissions (checkmarks/crosses)
**Activity Feed**: Timeline-style display in dashboards showing recent events

This design creates a professional, efficient administrative interface optimized for rapid task completion and clear information hierarchy.