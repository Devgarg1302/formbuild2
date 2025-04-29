import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-white shadow-inner py-6 mt-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <Link href="/" className="text-lg font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                            Form Builder
                        </Link>
                        <p className="text-gray-500 text-sm mt-1">Create beautiful forms in minutes</p>
                    </div>
                    <div className="flex space-x-6">
                        <Link href="/" className="text-gray-500 hover:text-emerald-600 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/" className="text-gray-500 hover:text-emerald-600 transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/" className="text-gray-500 hover:text-emerald-600 transition-colors">
                            Contact
                        </Link>
                    </div>
                </div>
                <div className="border-t border-gray-200 mt-6 pt-6 text-center text-gray-500">
                    <p>© {new Date().getFullYear()} Dynamic Form Builder | Built with Next.js, Prisma and PostgreSQL</p>
                </div>
            </div>
        </footer>
    )
}
