"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import ElementsSidebar from '@/components/ElementsSidebar';

import { FormElement } from '@/types/FormElement';

import FormCanvas from '@/components/FormCanvas';
import { getForm, saveForm } from '@/lib/actions';

interface Form {
    id: string;
    title: string;
    description?: string;
    published: boolean;
    formElements: FormElement[];
}


export default function EditForm() {
    const params = useParams();
    const formId = typeof params.formId === 'string' ? params.formId : params.formId?.[0] || '';
    const [form, setForm] = useState<Form | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availableForms, setAvailableForms] = useState<Array<{ id: string; title: string }>>([]);



    useEffect(() => {
        const fetchForm = async () => {
            try {
                const formData = await getForm(formId) as Form;

                setForm(formData);
                setFormTitle(formData.title);
                setFormDescription(formData.description || '');
                setIsPublished(formData.published);
                setIsLoading(false);
            } catch (err) {
                setError('Error loading form. Please try again.');
                setIsLoading(false);
            }
        };

        fetchForm();
    }, [formId]);


    const handleSaveForm = async () => {
        try {
            const updatedForm = await saveForm(formId, formTitle, formDescription, isPublished) as Form;

            setForm({
                ...form!,
                title: updatedForm.title,
                description: updatedForm.description,
                published: updatedForm.published,
            });
        } catch (err) {
            handleApiError('Error saving form. Please try again.');
        }
    };

    const handleApiError = (errorMessage: string) => {
        setError(errorMessage);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-red-500 mb-4">{error}</p>
                <Link href="/" className="text-emerald-500 hover:underline">
                    Return to Form Builder
                </Link>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="mb-4">Form not found</p>
                <Link href="/" className="text-emerald-500 hover:underline">
                    Return to Form Builder
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 mb-16">

            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Form Settings</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-gray-700 mb-2">
                            Form Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            className="input-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-gray-700 mb-2">
                            Form Description
                        </label>
                        <textarea
                            id="description"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            className="input-primary"
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="published"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-400 mr-2"
                        />
                        <label htmlFor="published" className="text-gray-700">
                            Published
                        </label>
                    </div>
                    <button
                        onClick={handleSaveForm}
                        className="btn-primary"
                    >
                        Save Form Settings
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* <DndContext
                    sensors={sensors}
                    collisionDetection={rectIntersection}
                    onDragEnd={handleDragEnd}
                >
                    <div className="lg:col-span-1">
                        <ElementsSidebar />
                    </div>

                    <FormCanvas 
                        form={form} 
                        formId={formId} 
                        setForm={setForm} 
                    />

                </DndContext> */}
                <ElementsSidebar />

                <FormCanvas formId={formId} />

            </div>
        </div>
    );
} 