"use client"

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

function Swtich() {

    const router = useRouter();

    const params = useParams();
    const formId = typeof params.formId === 'string' ? params.formId : params.formId?.[0] || '';

    const pathname = usePathname();

    const [edit, setEdit] = useState(false);

    const previewPath = `/edit/${formId}/preview`;

    useEffect(() => {
        if (pathname === previewPath) {
            setEdit(true);
        }
    }, [pathname, previewPath]);

    const goBack = () => {
        router.back();
        setEdit(false);
    }

    return (
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Edit Form</h1>
                <p className="text-gray-500 mt-1">Drag and drop elements to build your form</p>
            </div>
            <div className="space-x-2">
                <Link
                    href={`/edit/${formId}/preview`}
                    className="inline-block px-4 py-2 bg-emerald-500 text-white rounded transition-colors duration-200 hover:bg-emerald-600"

                >
                    Preview
                </Link>
                <div
                    onClick={goBack}
                    className="cursor-pointer inline-block px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
                >
                    {edit ? "Back to Edit forms" : "Back to Forms"}
                </div>
            </div>
        </div>
    )
}

export default Swtich