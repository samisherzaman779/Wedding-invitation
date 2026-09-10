# Sami & Muqaddas — Wedding Invitation (Next.js)

A faithful Next.js (App Router) conversion of the original single-file HTML
wedding invitation. Same design, animations and interactions — loader,
3D card-opening sequence, countdown, story timeline, events, gallery +
lightbox, venue, dress code, RSVP, wishes, share/QR, custom cursor and
ambient particles.

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

## Project structure

```
app/
  layout.js          # Root layout: metadata, viewport, next/font setup
  page.js            # Home page (client-only via next/dynamic ssr:false)
  globals.css        # All styles from the original <style> block
components/
  weddingConfig.js   # CENTRAL CONFIG — edit all wedding details here
  Invitation.jsx     # The full interactive invitation (client component)
  icons.jsx          # Inline Lucide-style SVG icons (replaces lucide CDN)
public/
  wedding-music-placeholder.mp3   # Add your real audio file here
```

## Key conversion notes

| Original (HTML file)                    | Next.js version                                      |
|-----------------------------------------|------------------------------------------------------|
| Google Fonts `<link>` tags              | `next/font/google` (self-hosted, no layout shift)    |
| lucide UMD CDN script                   | Inline SVG icon components (`components/icons.jsx`)  |
| Inline `<script>` DOM manipulation      | React state + `useEffect` hooks                      |
| Scroll reveal via classList             | State-driven (`revealed` ids + IntersectionObserver) |
| QRCode via CDN script                   | Same CDN lib, loaded with `next/script`              |
| Central `wedding` config object         | `components/weddingConfig.js` (edit everything here) |

The page is rendered client-side only (`ssr: false`) because the experience
is a full-screen interactive sequence (card opening, audio autoplay, cursor).

## Customization

- **All content**: edit `components/weddingConfig.js` (couple, date, events,
  story, gallery, dress code, venue, music path, RSVP deadline).
- **Music**: drop an MP3 at `public/wedding-music-placeholder.mp3` (or change
  the `wedding.music` path).
- **Guest personalization**: `?guest=Name` in the URL shows "Dear Name".
- **Fonts**: the `Noto_Nastaliq_Urdu` font is loaded with subset `arabic`; if
  your Next version doesn't provide it, remove it from `app/layout.js` —
  `Amiri` already covers the Arabic text.
