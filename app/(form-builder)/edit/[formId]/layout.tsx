
import type { Metadata } from "next";
import "@/app/globals.css";
import Swtich from "@/components/Swtich";


export const metadata: Metadata = {
    title: "Edit Your Form",
    description: "Edit form efficiently",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {


    return (
        <div className="container mx-auto px-4 py-8 mb-16">

            <Swtich />

            <main className="py-6 flex-grow">
                {children}
            </main>

        </div>
    );
}
