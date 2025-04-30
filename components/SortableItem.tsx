import React, { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormElement } from '@/types/FormElement';
import { getForm } from '@/lib/actions';

interface FormElementProps {
  id: string;
  handleEditElement: (item: FormElement) => void;
  handleDeleteElement: (id: string) => void;
  item: FormElement;

}

interface Form {
  id: string;
  title: string;
  description?: string;
  published: boolean;
}


// Add a helper component for rendering SVG icons
const IconSvg = ({ path }: { path: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

export default function SortableFormElement({
  id,
  item,
  handleEditElement,
  handleDeleteElement,
}: FormElementProps) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [subform, setsubform] = useState<Form | null>(null);

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text':
        return (
          <IconSvg path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        );
      case 'email':
        return (
          <IconSvg path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        );
      case 'number':
        return (
          <IconSvg path="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        );
      case 'textarea':
        return (
          <IconSvg path="M4 6h16M4 12h16M4 18h7" />
        );
      case 'select':
        return (
          <IconSvg path="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        );
      case 'radio':
        return (
          <IconSvg path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        );
      case 'checkbox':
        return (
          <IconSvg path="M5 13l4 4L19 7" />
        );
      case 'date':
        return (
          <IconSvg path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        );
      case 'subform':
        return (
          <IconSvg path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        );
      case 'file':
        return (
          <IconSvg path="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        );
      case 'image':
        return (
          <IconSvg path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        );
      default:
        return null;
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  useEffect(() => {
    const fetchsubform = async () => {
      if (item.subformId) {
        const subformElement = await getForm(item.subformId) as Form;
        setsubform(subformElement);
      }
    }
    fetchsubform()
  })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border mt-8 mb-8 border-gray-200 rounded-xl p-4 hover:border-emerald-200 transition-colors duration-200 ${isDragging ? 'bg-emerald-50 shadow-md z-10' : 'bg-white'
        }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <span className="text-sm bg-emerald-100 text-emerald-800 px-2 py-1 rounded mr-2">
              {getElementIcon(item.type)}
            </span>
            <h3 className="font-semibold text-gray-800">{item.label}</h3>
            {item.required && (
              <span className="ml-2 text-sm text-red-500">*Required</span>
            )}
          </div>
          <div className="mt-1">
            {item.placeholder && <p className="text-sm text-gray-500 mt-1">{item.placeholder}</p>}
            {item.helpText && <p className="text-sm text-gray-500 mt-1">{item.helpText}</p>}
            {item.options && (
              <p className="text-gray-500 text-sm mt-1">
                Options: {(() => {
                  try {
                    const parsed = JSON.parse(item.options as string);
                    return parsed && parsed.choices && Array.isArray(parsed.choices)
                      ? parsed.choices.join(', ')
                      : 'No options';
                  } catch (e) {
                    return 'Invalid options format';
                  }
                })()}
              </p>
            )}
            {item.min && <p className="text-sm text-gray-500 mt-1">{item.min}</p>}
            {item.max && <p className="text-sm text-gray-500 mt-1">{item.max}</p>}
            {item.accept && (
              <p className="text-sm text-gray-500 mt-1">
                Accepted Types: {(() => {
                  try {
                    const parsed = JSON.parse(item.accept as string);
                    return parsed && parsed.types && Array.isArray(parsed.types)
                      ? parsed.types.join(', ')
                      : 'No accepted types';
                  } catch (e) {
                    return 'Invalid accepted types format';
                  }
                })()}
              </p>
            )}
            {item.subformId && subform && (
              <>
                <h3 className="text-sm text-gray-500 mt-1">
                  Subform : {subform?.title}
                </h3>
                <p className='text-sm text-gray-500 mt-1'>
                  Description: {subform?.description}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleEditElement(item)}
            className="p-1.5 text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleDeleteElement(id)}
            className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 