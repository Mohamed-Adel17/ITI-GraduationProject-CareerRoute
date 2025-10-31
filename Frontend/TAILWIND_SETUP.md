# Tailwind CSS Setup for Career Route Frontend

**Date Updated:** 2025-10-31
**Version:** Tailwind CSS v3.4.18

---

## 📦 Installed Packages

```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.18",
    "postcss": "^8.5.6",
    "autoprefixer": "^10.4.21"
  }
}
```

---

## ⚙️ Configuration Files

### 1. `postcss.config.js` (Root Directory)

**Tailwind CSS v3 uses PostCSS plugin:**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 2. `src/styles.css` (Global Styles)

**Tailwind CSS v3 uses `@tailwind` directives:**

```css
/* Tailwind CSS v3 Directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global Styles for Career Route Application */
@layer base {
  body {
    @apply font-sans antialiased;
  }

  html {
    @apply scroll-smooth;
  }
}
```

**Configuration Details:**
- **@tailwind directives:** Injects Tailwind's base styles, component classes, and utilities
- **@apply:** Used to apply utility classes to custom selectors
- **Dark Mode:** Configured with `darkMode: 'class'` in `tailwind.config.js` (toggle with `dark` class on HTML element)
- **Primary Color:** Blue (#2563eb) with full shade palette (defined in config)
- **Font Family:** System font stack for optimal performance
- **Content Scanning:** Configured via `content` array in `tailwind.config.js`

### 3. `tailwind.config.js` (Required for v3)

Tailwind CSS v3 requires `tailwind.config.js` for configuration:

```javascript
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
```

**Configuration Details:**
- **content:** Specifies which files to scan for Tailwind classes
- **darkMode:** Set to `'class'` for manual dark mode toggle
- **theme.extend.colors:** Adds custom color palette (primary blue)
- **plugins:** Currently empty, can add Tailwind plugins here

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary (Blue) | `#2563eb` | Buttons, links, highlights |
| Gray-50 | `#f9fafb` | Light backgrounds |
| Gray-900 | `#111827` | Dark mode backgrounds |
| Red-600 | `#dc2626` | Error messages |
| Green-600 | `#16a34a` | Success messages |

### Typography

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-3xl` | 30px | Regular | Headings |
| `text-4xl` | 36px | Regular | Large headings |
| `text-sm` | 14px | Regular | Labels, small text |
| `font-bold` | 700 | Bold | Emphasis |
| `font-medium` | 500 | Medium | Semi-bold |

### Spacing Scale

Tailwind uses a spacing scale based on `0.25rem` (4px) increments:
- `p-4` = 1rem (16px)
- `p-8` = 2rem (32px)
- `p-12` = 3rem (48px)

### Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Large desktops |
| `2xl:` | 1536px | Extra large |

---

## 🚀 Usage Examples

### Basic Layout
```html
<div class="min-h-screen bg-gray-50 flex items-center justify-center p-8">
  <div class="max-w-md w-full">
    <!-- Content -->
  </div>
</div>
```

### Responsive Design
```html
<div class="w-full lg:w-1/2">
  <!-- Full width on mobile, half width on desktop -->
</div>
```

### Dark Mode
```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <!-- Light mode: white bg, dark text -->
  <!-- Dark mode: dark bg, light text -->
</div>
```

### Form Input
```html
<input
  type="text"
  class="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
/>
```

### Button
```html
<button
  class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
>
  Submit
</button>
```

---

## 🔧 Development Workflow

### Running the Development Server
```bash
npm start
# or
ng serve
```

Angular's build process automatically:
1. Processes Tailwind CSS directives
2. Scans HTML/TS files for classes
3. Generates optimized CSS
4. Includes only used classes (tree-shaking)

### Production Build
```bash
npm run build
# or
ng build
```

Production builds:
- Purge unused CSS classes
- Minify CSS
- Optimize for performance

---

## 📝 Components Using Tailwind

### Implemented ✅
1. **LoginComponent** (`features/auth/login/`)
   - Two-column responsive layout
   - Form validation styles
   - Dark mode support
   - Hover/focus states
   - Loading states

### Planned Components
- RegisterComponent (T068)
- PasswordResetComponent (T069)
- EmailVerificationComponent (T070)
- UserProfileComponent (T071)
- EditProfileComponent (T072)
- MentorProfileFormComponent (T073)
- MentorApplicationComponent (T074)
- HeaderComponent (T075)
- ToastContainerComponent (T076)

---

## 🎯 Best Practices

### 1. Use Utility Classes in Templates
```html
<!-- ✅ Good -->
<div class="flex items-center gap-4 p-4 rounded-lg bg-white">

<!-- ❌ Avoid custom CSS when possible -->
<div class="custom-card">
```

### 2. Component-Specific Styles in CSS Files
For animations and complex hover effects not available as utilities:
```css
/* login.component.css */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

div[role='alert'] {
  animation: slideDown 0.3s ease-out;
}
```

### 3. Use `@apply` for Repeated Patterns
```css
@layer components {
  .btn-primary {
    @apply px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg;
  }
}
```

### 4. Responsive Design Mobile-First
```html
<!-- Mobile first, then desktop -->
<div class="flex-col lg:flex-row">
```

### 5. Dark Mode Support
Always provide dark mode variants:
```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
```

---

## 🔍 Debugging Tailwind Classes

### Check if Classes are Generated
1. Run dev server: `npm start`
2. Open browser DevTools
3. Inspect element
4. Check if Tailwind classes have CSS rules

### Class Not Working?
- **Typo:** Check spelling (e.g., `bg-grey-50` vs `bg-gray-50`)
- **Not Scanned:** Ensure file is in `content` array in `tailwind.config.js`
- **Purged:** In production, unused classes are removed (add to safelist if needed)
- **Custom Class:** If custom, define in `tailwind.config.js` or use `@apply`

---

## 📚 Resources

- **Official Docs:** https://tailwindcss.com/docs
- **Cheat Sheet:** https://nerdcave.com/tailwind-cheat-sheet
- **Playground:** https://play.tailwindcss.com/
- **Components:** https://tailwindui.com/components (paid)

---

## ⚠️ Migration Notes

### Bootstrap 5 Coexistence
Bootstrap 5.3.8 is still installed alongside Tailwind CSS. They can coexist, but:
- **Avoid mixing** utilities from both frameworks
- **Decide per component:** Use either Bootstrap OR Tailwind, not both
- **Recommendation:** Use Tailwind for new components, migrate old ones gradually

### Eventual Bootstrap Removal
Once all components use Tailwind:
```bash
npm uninstall bootstrap
```

---

## 🐛 Troubleshooting

### Issue: Styles Not Applied
**Solution:** Restart dev server after Tailwind installation

### Issue: Dark Mode Not Working
**Solution:** Add `dark` class to `<html>` element:
```typescript
// In app.component.ts or theme service
document.documentElement.classList.add('dark');
```

### Issue: Custom Colors Not Working
**Solution:** Check `tailwind.config.js` theme extension

### Issue: Build Errors
**Solution:** Ensure `tailwind.config.js` is in root directory

---

## 🎉 Setup Complete!

Tailwind CSS v3 is fully configured and ready to use in the Career Route application.

**Next Steps:**
1. ✅ LoginComponent already uses Tailwind
2. Run `npm start` to see Tailwind styles in action
3. Build remaining components with Tailwind utilities
4. Enjoy rapid UI development! 🚀

---

**Last Updated:** 2025-10-31
**Version:** Tailwind CSS v3.4.18 + PostCSS v8.5.6 + Autoprefixer v10.4.21

---

## 📋 Current Setup Summary

**Version:** Tailwind CSS v3.4.18
**Status:** ✅ Properly configured and ready to use

### Files in Use

- `tailwind.config.js` - Configuration file with content scanning and theme customization
- `postcss.config.js` - PostCSS plugin configuration
- `src/styles.css` - Global styles with Tailwind directives
- `TAILWIND_SETUP.md` - This documentation file

### Configuration Verified

✅ PostCSS configured with `tailwindcss` plugin and `autoprefixer`
✅ `styles.css` has correct `@tailwind` directives
✅ `tailwind.config.js` scans `./src/**/*.{html,ts}` for classes
✅ Dark mode enabled with `darkMode: 'class'`
✅ Primary color palette extended with blue shades
