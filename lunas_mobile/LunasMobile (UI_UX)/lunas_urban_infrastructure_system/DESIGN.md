---
name: LUNAS Urban Infrastructure System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#424752'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#727783'
  outline-variant: '#c2c6d4'
  surface-tint: '#005db7'
  primary: '#004d99'
  on-primary: '#ffffff'
  primary-container: '#1565c0'
  on-primary-container: '#dae5ff'
  inverse-primary: '#a9c7ff'
  secondary: '#1b6d24'
  on-secondary: '#ffffff'
  secondary-container: '#a0f399'
  on-secondary-container: '#217128'
  tertiary: '#6d4500'
  on-tertiary: '#ffffff'
  tertiary-container: '#8e5b00'
  on-tertiary-container: '#ffe0bb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#00468c'
  secondary-fixed: '#a3f69c'
  secondary-fixed-dim: '#88d982'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005312'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#ffb957'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#643f00'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  heading:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  title:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  subtitle:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  button:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container_padding: 16px
  gutter: 12px
---

## Brand & Style

The design system is built for high-stakes urban utility management. The visual narrative balances **Government-grade reliability** with **AI-enhanced efficiency**. It adopts a **Modern Corporate** aesthetic that leans heavily into functional clarity and structured information density.

The interface prioritizes trust through a systematic application of Material Design 3 principles. It utilizes a clean, airy layout with heavy whitespace to reduce cognitive load for field technicians and city planners. The aesthetic is "Invisible UI"—where the design recedes to let critical infrastructure data and AI insights take center stage.

## Colors

This design system uses a logic-driven color palette optimized for glanceability in various lighting conditions (outdoor field use). 

- **Primary Blue** signifies action and authority.
- **Secondary Green** is reserved for environmental and completion statuses.
- **Surface & Background** tones use a cool-gray scale to maintain a professional, hardware-integrated feel.
- **Status Colors** are strictly reserved for work-order lifecycles to ensure technicians can prioritize tasks instantly without reading labels.

## Typography

The design system utilizes **Inter** for its exceptional legibility on mobile screens and neutral, systematic character. 

- **Display & Heading** levels use bold weights to establish clear content hierarchy in data-heavy screens.
- **Body Text** is set at 14px to balance information density with readability during field operations.
- **Button Text** uses a slightly larger 15px size with SemiBold weight to create a clear "tappable" affordance.

## Layout & Spacing

The design system follows an **8pt linear scale** for all spatial relationships. 

- **Grid:** A 4-column fluid grid is used for mobile (breakpoints < 600px) with 16px side margins and 12px gutters.
- **Touch Targets:** Minimum touch targets are 48x48px, even if the visual element (like a small icon) is smaller.
- **Consistency:** Spacing between related elements (e.g., label and input) should use `xs` or `sm` (4px/8px), while spacing between sections should use `lg` (24px).

## Elevation & Depth

This design system employs **Tonal Layers** and **Soft Shadows** to convey hierarchy, following Material Design 3 elevation logic:

- **Level 0 (Flat):** Main background surface.
- **Level 1 (Low):** Cards and secondary buttons. Use a 4px blur, 0% offset, and 5% black opacity shadow.
- **Level 2 (Medium):** App bars and active state cards. Use an 8px blur, 2px Y-offset, and 8% black opacity.
- **Level 3 (High):** Dialogs and Bottom Sheets. Use a 20px blur, 10px Y-offset, and 12% black opacity.

Avoid harsh outlines; use subtle `border-color` (#E2E8F0) to define boundaries on flat surfaces.

## Shapes

The shape language is "Hyper-Rounded," which softens the industrial nature of the data. 

- **Base Radius:** 14px for primary interactive elements (Buttons, Text Fields).
- **Container Radius:** 16px for content cards to provide a distinct visual framing.
- **Overlay Radius:** Larger radii (20px-24px) for Dialogs and Bottom Sheets to emphasize their "floating" nature and differentiate them from the base layout.

## Components

### Buttons
- **Primary:** Filled with Primary Blue, White text, 14px radius.
- **Secondary:** Tonal (Light blue background with Primary Blue text).
- **Floating Action Button (FAB):** Large rounded-square (16px radius) for the primary "Create Work Order" action.

### Text Fields
- **Style:** MD3 "Filled" style with 14px top-corner radius.
- **Colors:** Surface background (#F1F5F9), Primary Blue indicator line (2px) on focus.
- **Icons:** Material Symbols Rounded (24px) placed in the leading position for context.

### Cards
- **Status Cards:** Use a 4px left-border accent colored by the `status` tokens.
- **Padding:** Always 16px internal padding.

### Chips
- **Status Chips:** Small, pill-shaped with low-opacity backgrounds of their status color and high-contrast text.

### Navigation
- **Bottom Navigation:** Use for primary app sections (Map, Tasks, AI Insights, Profile). High-contrast active state with a pill-shaped indicator behind the icon.