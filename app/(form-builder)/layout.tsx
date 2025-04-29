import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Dynamic Form Builder",
  description: "Create and share dynamic forms with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <Header />

        <main className="py-6 flex-grow">
          {children}
        </main>
        
        <Footer />
      </body>
    </html>
  );
}
