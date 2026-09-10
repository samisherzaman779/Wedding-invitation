import './globals.css';
import { Playfair_Display, Cormorant_Garamond, Amiri, Inter, Noto_Nastaliq_Urdu } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-amiri',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['600'],
  variable: '--font-nastaliq',
  display: 'swap',
});

export const metadata = {
  title: 'Sami & Muqaddas — Wedding Invitation',
  description: "You're warmly invited to celebrate the wedding of Sami & Muqaddas.",
  openGraph: {
    title: 'Sami & Muqaddas — Wedding Invitation',
    description: "You're warmly invited to celebrate the wedding of Sami & Muqaddas.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050705',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${playfair.variable} ${cormorant.variable} ${amiri.variable} ${inter.variable} ${nastaliq.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
