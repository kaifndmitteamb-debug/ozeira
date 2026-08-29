import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CurrencyLanguageProvider } from "@/lib/context/CurrencyLanguageContext";
import { StoreProvider } from "@/lib/context/StoreContext";
import { CartProvider } from "@/lib/context/CartContext";
import { WishlistProvider } from "@/lib/context/WishlistContext";
import { CompareProvider } from "@/lib/context/CompareContext";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { MiniCartDrawer } from "@/components/cart/MiniCartDrawer";
import { FloatingLiveChat } from "@/components/common/FloatingLiveChat";
import { QuickCompareFloatingBar } from "@/components/common/QuickCompareFloatingBar";
import AnalyticsScripts from "@/components/common/AnalyticsScripts";
import AddToCartToast from "@/components/common/AddToCartToast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Ozeira | Modern Luxury & Conscious Craftsmanship",
  description: "Experience handcrafted apparel, full-grain Italian leather duffles, fine 18K jewelry, and Goodyear-welted footwear engineered for generational longevity.",
  keywords: ["luxury ecommerce", "ozeira", "handcrafted fashion", "leather duffle", "cashmere sweater", "goodyear welted boots", "emerald jewelry"],
  openGraph: {
    title: "Ozeira – Timeless Luxury Atelier",
    description: "Handcrafted Luxury Apparel, Leather Goods & High Accoutrements.",
    type: "website",
    locale: "en_US",
    siteName: "Ozeira",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} scroll-smooth`}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-[#fdfbf9] dark:bg-[#0f1014] text-[#1a1714] dark:text-[#f2ece4] selection:bg-[#d37b3f] selection:text-white transition-colors duration-200">
        <ThemeProvider>
        <AuthProvider>
          <CurrencyLanguageProvider>
            <StoreProvider>
              <CartProvider>
                <WishlistProvider>
                  <CompareProvider>
                    <AnalyticsScripts />
                    <AddToCartToast />
                    {children}
                    <MiniCartDrawer />
                    <FloatingLiveChat />
                    <QuickCompareFloatingBar />
                  </CompareProvider>
                </WishlistProvider>
              </CartProvider>
            </StoreProvider>
          </CurrencyLanguageProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
