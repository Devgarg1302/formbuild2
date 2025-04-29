"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Form {
  id: string;
  title: string;
  description?: string | null;
  published: boolean;
}

export default function FormBuilder() {
  const [forms, setForms] = useState<Form[]>([]);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch('/api/forms');

        if (!response.ok) {
          throw new Error('Failed to fetch forms');
        }

        const data = await response.json();
        setForms(data);
      } catch (err) {
        setError('Error loading forms. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForms();

  }, []);

  const handleCreateForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newFormTitle,
          description: newFormDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create form');
      }

      const newForm = await response.json();
      setForms([newForm, ...forms]);
      setIsCreatingForm(false);
      setNewFormTitle('');
      setNewFormDescription('');
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const handleDeleteForm = async (id: string) => {
    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete form');
      }

      setForms(forms.filter(form => form.id !== id));
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  }


  // Filter forms based on search query
  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-800">My Forms</h1>
            <p className="text-gray-600">Create, manage, and share your forms</p>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-grow lg:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search forms..."
                className="input-primary pl-10 pr-4 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsCreatingForm(true)}
              className="btn-primary px-6 py-2 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Form
            </button>
          </div>
        </div>

        {isCreatingForm && (
          <div className="bg-emerald-50 p-6 rounded-xl mb-8 border border-emerald-100 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Form
            </h2>
            <form onSubmit={handleCreateForm}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 mb-2 font-medium">
                  Form Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  className="input-primary"
                  placeholder="Enter form title..."
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="description" className="block text-gray-700 mb-2 font-medium">
                  Form Description
                </label>
                <textarea
                  id="description"
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                  className="input-primary"
                  rows={3}
                  placeholder="Enter form description (optional)..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Form
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-center">
            {error}
          </div>
        ) : (
          <>
            {filteredForms.length === 0 && searchQuery && (
              <div className="text-center py-6 bg-gray-50 rounded-lg mb-6">
                <p className="text-gray-500">No forms found matching "{searchQuery}"</p>
              </div>
            )}

            {filteredForms.length === 0 && !searchQuery ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-500 mb-1">No forms created yet</h3>
                <p className="text-gray-400 mb-6">Create your first form to get started</p>
                <button
                  onClick={() => setIsCreatingForm(true)}
                  className="btn-primary inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Your First Form
                </button>
              </div>
            ) : (!searchQuery || searchQuery.length >= 1) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredForms.map((form) => (
                  <div
                    key={form.id}
                    className="card group"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors duration-200">{form.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${form.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {form.published ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      <div className='flex flex-row items-center justify-between'>

                        {form.description && (
                          <p className="text-gray-600 mb-6 line-clamp-2">{form.description}</p>
                        )}
                        <div onClick={()=>handleDeleteForm(form.id)} className='inline-flex items-center px-3 py-1.5 text-sm bg-white text-red-500 rounded-md hover:bg-red-50 transition-colors duration-200'>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">0</span> responses
                        </div>
                        <div className="flex gap-2">

                          <Link
                            href={`/edit/${form.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-white text-emerald-600 rounded-md border border-emerald-200 hover:bg-emerald-50 transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit
                          </Link>
                          <Link
                            href={`/form/${form.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-200"
                            target="_blank"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}