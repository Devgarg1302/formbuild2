"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormElement {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number;
  options?: string;
  validations?: string;
  subformId?: string;
}

interface Form {
  id: string;
  title: string;
  description?: string;
  published: boolean;
  formElements: FormElement[];
}

interface NestedForm {
  id: string;
  title: string;
  formElements: FormElement[];
}

export default function FormDisplay() {
  const { formId } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [nestedForms, setNestedForms] = useState<Record<string, NestedForm>>({});
  const [fileUploads, setFileUploads] = useState<Record<string, { url: string, fileName: string }>>({});
  const [fileUploadErrors, setFileUploadErrors] = useState<Record<string, string>>({});
  const [fileUploading, setFileUploading] = useState<Record<string, boolean>>({});

  const router = useRouter();

  // Fetch form data
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${formId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch form');
        }

        const formData = await response.json();

        // Check if form is published
        if (!formData.published) {
          setError('This form is not available for submission.');
          setIsLoading(false);
          return;
        }

        setForm(formData);

        // Find all subform elements
        const subformElements = formData.formElements.filter(
          (element: FormElement) => element.type === 'subform' && element.subformId
        );


        // Fetch all subform data
        if (subformElements.length > 0) {
          const nestedFormsData: Record<string, NestedForm> = {};

          await Promise.all(
            subformElements.map(async (element: FormElement) => {
              if (element.subformId) {
                try {
                  const subformResponse = await fetch(`/api/forms/${element.subformId}`);
                  if (subformResponse.ok) {
                    const subformData = await subformResponse.json();
                    nestedFormsData[element.subformId] = subformData;
                  }
                } catch (err) {
                  console.error(`Error fetching subform ${element.subformId}:`, err);
                }
              }
            })
          );

          setNestedForms(nestedFormsData);
        }

        // Initialize form values
        const initialValues: Record<string, any> = {};
        formData.formElements.forEach((element: FormElement) => {
          if (element.type === 'checkbox') {
            initialValues[element.id] = [];
          } else if (element.type === 'subform') {
            // Initialize nested form values if the subform exists
            if (element.subformId) {
              initialValues[element.id] = {}; // Container for subform values
            }
          } else {
            initialValues[element.id] = '';
          }
        });

        setFormValues(initialValues);
        setIsLoading(false);
      } catch (err) {
        setError('Error loading form. Please try again.');
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleInputChange = (elementId: string, value: any, nestedElementId?: string) => {
    if (nestedElementId) {
      // Handle nested form element changes
      setFormValues({
        ...formValues,
        [elementId]: {
          ...formValues[elementId],
          [nestedElementId]: value,
        },
      });

      // Clear validation error when input changes
      if (formErrors[`${elementId}.${nestedElementId}`]) {
        setFormErrors({
          ...formErrors,
          [`${elementId}.${nestedElementId}`]: '',
        });
      }
    } else {
      // Handle regular form element changes
      setFormValues({
        ...formValues,
        [elementId]: value,
      });

      // Clear validation error when input changes
      if (formErrors[elementId]) {
        setFormErrors({
          ...formErrors,
          [elementId]: '',
        });
      }
    }
  };

  const handleCheckboxChange = (elementId: string, value: string, checked: boolean, nestedElementId?: string) => {
    if (nestedElementId) {
      // Handle nested checkbox changes
      const currentNestedValues = formValues[elementId]?.[nestedElementId] || [];
      let newNestedValues;

      if (checked) {
        newNestedValues = [...currentNestedValues, value];
      } else {
        newNestedValues = currentNestedValues.filter((val: string) => val !== value);
      }

      setFormValues({
        ...formValues,
        [elementId]: {
          ...formValues[elementId],
          [nestedElementId]: newNestedValues,
        },
      });

      // Clear validation error when input changes
      if (formErrors[`${elementId}.${nestedElementId}`]) {
        setFormErrors({
          ...formErrors,
          [`${elementId}.${nestedElementId}`]: '',
        });
      }
    } else {
      // Handle regular checkbox changes
      const currentValues = formValues[elementId] || [];
      let newValues;

      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter((val: string) => val !== value);
      }

      setFormValues({
        ...formValues,
        [elementId]: newValues,
      });

      // Clear validation error when input changes
      if (formErrors[elementId]) {
        setFormErrors({
          ...formErrors,
          [elementId]: '',
        });
      }
    }
  };

  const handleFileUpload = async (elementId: string, file: File) => {
    if (!file) return;

    // Clear previous errors
    setFileUploadErrors(prev => ({
      ...prev,
      [elementId]: ''
    }));

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setFileUploadErrors(prev => ({
        ...prev,
        [elementId]: 'File size exceeds 10MB limit'
      }));
      return;
    }

    // Set uploading state
    setFileUploading(prev => ({
      ...prev,
      [elementId]: true
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();

      // Store file URL
      setFileUploads(prev => ({
        ...prev,
        [elementId]: {
          url: data.url,
          fileName: data.fileName
        }
      }));

      // Update form values with the file URL
      setFormValues(prev => ({
        ...prev,
        [elementId]: data.url
      }));

    } catch (err) {
      console.error('Error uploading file:', err);
      setFileUploadErrors(prev => ({
        ...prev,
        [elementId]: 'Failed to upload file. Please try again.'
      }));
    } finally {
      setFileUploading(prev => ({
        ...prev,
        [elementId]: false
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!form) return false;

    // Validate main form elements
    form.formElements.forEach((element) => {
      // Check required fields
      if (element.required) {
        const value = formValues[element.id];

        if (element.type === 'checkbox') {
          if (!Array.isArray(value) || value.length === 0) {
            errors[element.id] = 'This field is required';
            isValid = false;
          }
        } else if (element.type === 'subform') {
          // Nested form validation happens separately
        } else if (value === undefined || value === null || value === '') {
          errors[element.id] = 'This field is required';
          isValid = false;
        }
      }

      // Check email validation
      if (element.type === 'email' && formValues[element.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formValues[element.id])) {
          errors[element.id] = 'Please enter a valid email address';
          isValid = false;
        }
      }

      // Check number validation
      if (element.type === 'number' && formValues[element.id]) {
        if (isNaN(Number(formValues[element.id]))) {
          errors[element.id] = 'Please enter a valid number';
          isValid = false;
        }
      }

      // Validate subform elements if this is a subform element
      if (element.type === 'subform' && element.subformId) {
        const subform = nestedForms[element.subformId];
        if (!subform || !subform.formElements) {
          return; // Skip validation if subform data isn't loaded
        }

        const subformValues = formValues[element.id] || {};

        subform.formElements.forEach((subElement) => {
          if (subElement.required) {
            const subValue = subformValues[subElement.id];

            if (subElement.type === 'checkbox') {
              if (!Array.isArray(subValue) || subValue.length === 0) {
                errors[`${element.id}.${subElement.id}`] = 'This field is required';
                isValid = false;
              }
            } else if (!subValue && subValue !== 0) {
              errors[`${element.id}.${subElement.id}`] = 'This field is required';
              isValid = false;
            }
          }
        });
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Flatten nested form values and convert to responses format
      const responses = [];

      for (const [elementId, value] of Object.entries(formValues || {})) {
        if (value === null || value === undefined) {
          // Skip null or undefined values
          continue;
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
          // This is a subform value
          for (const [subElementId, subValue] of Object.entries(value || {})) {
            if (subValue === null || subValue === undefined) {
              // Skip null or undefined sub-values
              continue;
            }

            responses.push({
              formElementId: elementId,
              subElementId,
              value: Array.isArray(subValue)
                ? subValue.join(', ')
                : subValue === null || subValue === undefined
                  ? ''
                  : String(subValue),
            });
          }
        } else {
          // This is a regular form value
          responses.push({
            formElementId: elementId,
            value: Array.isArray(value)
              ? value.join(', ')
              : String(value),
          });
        }
      }

      const submissionData = {
        formId: formId,
        responses,
      };

      // Submit form data
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setIsSubmitted(true);

    } catch (err) {
      setError('Error submitting form. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <div onClick={() => { router.back() }} className="text-blue-500 hover:underline cursor-pointer">
          Return Home
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">Form not found</p>
        <div onClick={() => { router.back() }} className="text-blue-500 hover:underline cursor-pointer">
          Return Home
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="bg-white p-8 rounded shadow-md text-center">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">Form Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">Thank you for your submission.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-blue-500 text-white rounded">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Helper function to safely parse options JSON
  const safelyParseOptions = (optionsString?: string) => {
    if (!optionsString) return { choices: [] };

    try {
      const parsed = JSON.parse(optionsString);
      if (!parsed || !parsed.choices || !Array.isArray(parsed.choices)) {
        return { choices: [] };
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing options:', e);
      return { choices: [] };
    }
  };

  // Render a nested form's elements
  const renderNestedFormElements = (parentElement: FormElement) => {
    if (!parentElement.subformId || !nestedForms[parentElement.subformId]) {
      return (
        <div className="p-3 bg-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm">Nested form not found</p>
        </div>
      );
    }

    const nestedForm = nestedForms[parentElement.subformId];
    const nestedFormValues = formValues[parentElement.id] || {};


    return (
      <div className="border-l-4 border-blue-200 pl-4 py-2">
        <p className="text-xxl text-gray-600 mb-2">
          {nestedForm.title}
        </p>
        <div className="space-y-4">
          {nestedForm.formElements
            .sort((a, b) => a.order - b.order)
            .map((element) => (
              <div key={element.id} className="space-y-2">
                <label className="block text-gray-700 font-medium">
                  {element.label}
                  {element.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {element.helpText && (
                  <p className="text-gray-500 text-sm">{element.helpText}</p>
                )}

                {element.type === 'text' && (
                  <input
                    type="text"
                    placeholder={element.placeholder}
                    value={nestedFormValues[element.id] || ''}
                    onChange={(e) => handleInputChange(parentElement.id, e.target.value, element.id)}
                    className={`w-full px-3 py-2 border rounded ${formErrors[`${parentElement.id}.${element.id}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                )}

                {element.type === 'email' && (
                  <input
                    type="email"
                    placeholder={element.placeholder}
                    value={nestedFormValues[element.id] || ''}
                    onChange={(e) => handleInputChange(parentElement.id, e.target.value, element.id)}
                    className={`w-full px-3 py-2 border rounded ${formErrors[`${parentElement.id}.${element.id}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                )}

                {element.type === 'number' && (
                  <input
                    type="number"
                    placeholder={element.placeholder}
                    value={nestedFormValues[element.id] || ''}
                    onChange={(e) => handleInputChange(parentElement.id, e.target.value, element.id)}
                    className={`w-full px-3 py-2 border rounded ${formErrors[`${parentElement.id}.${element.id}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                )}

                {element.type === 'textarea' && (
                  <textarea
                    placeholder={element.placeholder}
                    value={nestedFormValues[element.id] || ''}
                    onChange={(e) => handleInputChange(parentElement.id, e.target.value, element.id)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded ${formErrors[`${parentElement.id}.${element.id}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                )}

                {element.type === 'select' && element.options && (
                  <select
                    value={nestedFormValues[element.id] || ''}
                    onChange={(e) => handleInputChange(parentElement.id, e.target.value, element.id)}
                    className={`w-full px-3 py-2 border rounded ${formErrors[`${parentElement.id}.${element.id}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select an option</option>
                    {safelyParseOptions(element.options).choices.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {element.type === 'radio' && element.options && (
                  <div className="space-y-2">
                    {safelyParseOptions(element.options).choices.map((option: string) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="radio"
                          id={`${element.id}-${option}`}
                          name={element.id}
                          value={option}
                          checked={nestedFormValues[element.id] === option}
                          onChange={(e) => handleInputChange(parentElement.id, e.target.value, element.id)}
                          className="mr-2"
                        />
                        <label htmlFor={`${element.id}-${option}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                )}

                {element.type === 'checkbox' && element.options && (
                  <div className="space-y-2">
                    {safelyParseOptions(element.options).choices.map((option: string) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${element.id}-${option}`}
                          value={option}
                          checked={(nestedFormValues[element.id] || []).includes(option)}
                          onChange={(e) => handleCheckboxChange(parentElement.id, option, e.target.checked, element.id)}
                          className="mr-2"
                        />
                        <label htmlFor={`${element.id}-${option}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                )}

                {element.type === 'date' && (
                  <input
                    type="date"
                    value={nestedFormValues[element.id] || ''}
                    onChange={(e) => handleInputChange(parentElement.id, e.target.value, element.id)}
                    className={`w-full px-3 py-2 border rounded ${formErrors[`${parentElement.id}.${element.id}`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                )}

                {element.type === 'file' && (
                  <div className="mt-1">
                    <input
                      type="file"
                      id={`file-${parentElement.id}-${element.id}`}
                      onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(`${parentElement.id}-${element.id}`, e.target.files[0])}
                      className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${fileUploadErrors[`${parentElement.id}-${element.id}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      disabled={fileUploading[`${parentElement.id}-${element.id}`]}
                    />
                    {fileUploading[`${parentElement.id}-${element.id}`] && (
                      <div className="mt-2 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-500">Uploading...</span>
                      </div>
                    )}
                    {fileUploads[`${parentElement.id}-${element.id}`] && (
                      <div className="mt-2 flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Uploaded: {fileUploads[`${parentElement.id}-${element.id}`].fileName}</span>
                      </div>
                    )}
                    {fileUploadErrors[`${parentElement.id}-${element.id}`] && (
                      <p className="mt-1 text-sm text-red-500">{fileUploadErrors[`${parentElement.id}-${element.id}`]}</p>
                    )}
                  </div>
                )}

                {element.type === 'image' && (
                  <div className="mt-1">
                    <input
                      type="file"
                      id={`image-${parentElement.id}-${element.id}`}
                      accept="image/*"
                      onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(`${parentElement.id}-${element.id}`, e.target.files[0])}
                      className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${fileUploadErrors[`${parentElement.id}-${element.id}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      disabled={fileUploading[`${parentElement.id}-${element.id}`]}
                    />
                    {fileUploading[`${parentElement.id}-${element.id}`] && (
                      <div className="mt-2 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-500">Uploading image...</span>
                      </div>
                    )}
                    {fileUploads[`${parentElement.id}-${element.id}`] && (
                      <div className="mt-2">
                        <div className="relative w-24 h-24 overflow-hidden rounded border border-gray-200">
                          <img
                            src={fileUploads[`${parentElement.id}-${element.id}`].url}
                            alt="Uploaded preview"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                    )}
                    {fileUploadErrors[`${parentElement.id}-${element.id}`] && (
                      <p className="mt-1 text-sm text-red-500">{fileUploadErrors[`${parentElement.id}-${element.id}`]}</p>
                    )}
                  </div>
                )}

                {element.type === 'subform' && element.subformId && (
                  renderNestedFormElements({
                    ...element,
                    id: `${element.id}`
                  })
                )}

                {formErrors[`${parentElement.id}.${element.id}`] && (
                  <p className="text-red-500 text-sm">{formErrors[`${parentElement.id}.${element.id}`]}</p>
                )}
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
        {form.description && <p className="text-gray-600 mb-6">{form.description}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {form.formElements
            .sort((a, b) => a.order - b.order)
            .map((element) => (
              <div key={element.id} className="space-y-2">
                <label className="block text-gray-700 font-medium">
                  {element.label}
                  {element.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {element.helpText && (
                  <p className="text-gray-500 text-sm">{element.helpText}</p>
                )}

                {element.type === 'text' && (
                  <input
                    type="text"
                    placeholder={element.placeholder}
                    value={formValues[element.id] || ''}
                    onChange={(e) => handleInputChange(element.id, e.target.value)}
                    className={`w-full px-3 py-2 border rounded ${formErrors[element.id] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                )}

                {element.type === 'email' && (
                  <input
                    type="email"
                    placeholder={element.placeholder}
                    value={formValues[element.id] || ''}
                    onChange={(e) => handleInputChange(element.id, e.target.value)}
                    className={`w-full px-3 py-2 border rounded ${formErrors[element.id] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                )}

                {element.type === 'number' && (
                  <input
                    type="number"
                    placeholder={element.placeholder}
                    value={formValues[element.id] || ''}
                    onChange={(e) => handleInputChange(element.id, e.target.value)}
                    className={`w-full px-3 py-2 border rounded ${formErrors[element.id] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                )}

                {element.type === 'textarea' && (
                  <textarea
                    placeholder={element.placeholder}
                    value={formValues[element.id] || ''}
                    onChange={(e) => handleInputChange(element.id, e.target.value)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded ${formErrors[element.id] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                )}

                {element.type === 'select' && element.options && (
                  <select
                    value={formValues[element.id] || ''}
                    onChange={(e) => handleInputChange(element.id, e.target.value)}
                    className={`w-full px-3 py-2 border rounded ${formErrors[element.id] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select an option</option>
                    {safelyParseOptions(element.options).choices.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {element.type === 'radio' && element.options && (
                  <div className="space-y-2">
                    {safelyParseOptions(element.options).choices.map((option: string) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="radio"
                          id={`${element.id}-${option}`}
                          name={element.id}
                          value={option}
                          checked={formValues[element.id] === option}
                          onChange={(e) => handleInputChange(element.id, e.target.value)}
                          className="mr-2"
                        />
                        <label htmlFor={`${element.id}-${option}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                )}

                {element.type === 'checkbox' && element.options && (
                  <div className="space-y-2">
                    {safelyParseOptions(element.options).choices.map((option: string) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${element.id}-${option}`}
                          value={option}
                          checked={(formValues[element.id] || []).includes(option)}
                          onChange={(e) => handleCheckboxChange(element.id, option, e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor={`${element.id}-${option}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                )}

                {element.type === 'date' && (
                  <input
                    type="date"
                    value={formValues[element.id] || ''}
                    onChange={(e) => handleInputChange(element.id, e.target.value)}
                    className={`w-full px-3 py-2 border rounded ${formErrors[element.id] ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                )}

                {element.type === 'file' && (
                  <div className="mt-1">
                    <input
                      type="file"
                      id={`file-${element.id}`}
                      onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(element.id, e.target.files[0])}
                      className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${fileUploadErrors[element.id] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      disabled={fileUploading[element.id]}
                    />
                    {fileUploading[element.id] && (
                      <div className="mt-2 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-500">Uploading...</span>
                      </div>
                    )}
                    {fileUploads[element.id] && (
                      <div className="mt-2 flex items-center text-sm text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Uploaded: {fileUploads[element.id].fileName}</span>
                      </div>
                    )}
                    {fileUploadErrors[element.id] && (
                      <p className="mt-1 text-sm text-red-500">{fileUploadErrors[element.id]}</p>
                    )}
                  </div>
                )}

                {element.type === 'image' && (
                  <div className="mt-1">
                    <input
                      type="file"
                      id={`image-${element.id}`}
                      accept="image/*"
                      onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(element.id, e.target.files[0])}
                      className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${fileUploadErrors[element.id] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      disabled={fileUploading[element.id]}
                    />
                    {fileUploading[element.id] && (
                      <div className="mt-2 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-500">Uploading image...</span>
                      </div>
                    )}
                    {fileUploads[element.id] && (
                      <div className="mt-2">
                        <div className="relative w-24 h-24 overflow-hidden rounded border border-gray-200">
                          <img
                            src={fileUploads[element.id].url}
                            alt="Uploaded preview"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                    )}
                    {fileUploadErrors[element.id] && (
                      <p className="mt-1 text-sm text-red-500">{fileUploadErrors[element.id]}</p>
                    )}
                  </div>
                )}

                {element.type === 'subform' && (
                  renderNestedFormElements(element)
                )}

                {formErrors[element.id] && (
                  <p className="text-red-500 text-sm">{formErrors[element.id]}</p>
                )}
              </div>
            ))}

          <div className="mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 