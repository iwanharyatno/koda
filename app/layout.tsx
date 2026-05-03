import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

// Headings: Rounded but modern[cite: 2]
const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: "--font-outfit" 
});

// Body: High readability for planning logs[cite: 2]
const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], 
  variable: "--font-jakarta" 
});

export const metadata: Metadata = {
  title: "Koda | Smart AI Task Management",
  description: "Dynamic scheduling that breathes with your routine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jakarta.variable}`}>
      <body className="font-jakarta bg-koda-background text-koda-charcoal">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}