import Link from "next/link";


export default function Header() {
    return (

        <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Form Builder
                    </Link>
                    <nav className="flex items-center space-x-6">
                    
                        <Link href="/" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
                            Dashboard
                        </Link>
                        <Link
                            href="/"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition-colors shadow-sm"
                        >
                            My Forms
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    )
}