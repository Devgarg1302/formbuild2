import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
    title: "Welcome to form",
    description: "Create and share dynamic forms with ease",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>


                <main className="py-6 flex-grow">
                    {children}
                </main>

            </body>
        </html>
    );
}
