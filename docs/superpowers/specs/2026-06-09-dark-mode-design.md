# Dark Mode Toggle — Design Spec

**Date:** 2026-06-09  
**Status:** Approved

---

## Overview

Add a sun/moon icon toggle to the app header that switches between light and dark mode. The user's preference is persisted in `localStorage` and restored on next visit.

---

## What Already Exists

The `.dark` CSS class and all token overrides are fully defined in `src/index.css`. No CSS changes are needed. The Tailwind dark variant is configured via `@custom-variant dark (&:is(.dark *))` — dark mode activates whenever the `.dark` class is present on any ancestor element.

---

## Behaviour

- **Default:** Light mode (`isDark = false`) unless `localStorage.getItem('theme') === 'dark'`
- **Toggle:** Clicking the icon flips `isDark`, updates `document.documentElement.classList`, and writes `'dark'` or `'light'` to `localStorage`
- **Persistence:** On next page load, `MainLayout` reads `localStorage` and restores the last preference

---

## UI

Toggle button position in the header:

```
[☰]  [logo]  Cattleya Resort  ···  [🌙 or ☀]  [logout]
```

- Uses the existing `<Button variant="ghost" size="icon">` pattern already in `MainLayout`
- Icon: `<Moon>` when currently light (click → go dark), `<Sun>` when currently dark (click → go light)
- Both `Moon` and `Sun` are available from `lucide-react`

---

## Architecture

**Single file change: `src/layouts/MainLayout.tsx`**

```ts
// State
const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

// Effect — syncs class + localStorage whenever isDark changes
useEffect(() => {
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}, [isDark]);

// Toggle handler
const toggleDark = () => setIsDark((prev) => !prev);
```

The lazy initializer on `useState` reads `localStorage` once at mount — no separate `useEffect` needed for initialization.

---

## Files Changed

| Action | File | Change |
|---|---|---|
| Modify | `src/layouts/MainLayout.tsx` | Add `isDark` state, sync effect, toggle button with `Moon`/`Sun` icon |

No other files change.
