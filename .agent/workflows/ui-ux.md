---
description: Run UI/UX Pro Max Skill
---
# UI/UX Pro Max

AI-powered design intelligence toolkit providing searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines.

## Quick Reference

### 1. Accessibility (CRITICAL)
- `color-contrast` - Minimum 4.5:1 ratio for normal text
- `focus-states` - Visible focus rings on interactive elements
- `alt-text` - Descriptive alt text for meaningful images

### 2. Touch & Interaction (CRITICAL)
- `touch-target-size` - Minimum 44x44px touch targets
- `hover-vs-tap` - Use click/tap for primary interactions

## Prerequisites

Check if Python is installed:
```bash
python --version
```

## How to Use This Skill

When user requests UI/UX work (design, build, create, implement, review, fix, improve), follow this workflow:

### Step 1: Analyze User Requirements
Extract key information: Product type, Style keywords, Industry, Stack (default: html-tailwind).

### Step 2: Generate Design System (REQUIRED)
**Always start with `--design-system`** to get comprehensive recommendations:

```bash
python d:\Code\AIDetector-web\.agent\skills\ui-ux-pro-max\src\ui-ux-pro-max\scripts\search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

### Step 3: Supplement with Detailed Searches (as needed)
Use domain searches for additional details:

```bash
python d:\Code\AIDetector-web\.agent\skills\ui-ux-pro-max\src\ui-ux-pro-max\scripts\search.py "<keyword>" --domain <domain> [-n <max_results>]
```

Domains: `style`, `chart`, `ux`, `typography`, `landing`.

### Step 4: Stack Guidelines
Get implementation-specific best practices:
```bash
python d:\Code\AIDetector-web\.agent\skills\ui-ux-pro-max\src\ui-ux-pro-max\scripts\search.py "<keyword>" --stack html-tailwind
```
