import { FormElement } from '@/types/FormElement';
import React, { useEffect, useState } from 'react'

interface Props {
  editingItem: FormElement;
  onSave: (editingItem: FormElement) => void;
  setEditingItem: (item: FormElement | null) => void;
}

export default function ElementEditor({ editingItem, onSave, setEditingItem }: Props) {

  const [label, setLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState('');
  const [accept, setAccept] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [step, setStep] = useState('');

  useEffect(() => {
    if (editingItem) {
      setLabel(editingItem.label || '');
      setPlaceholder(editingItem.placeholder || '');
      setHelpText(editingItem.helpText || '');
      setRequired(editingItem.required || false);

      if (editingItem.options) {
        try {
          const parsedOptions = JSON.parse(editingItem.options);
          if (parsedOptions.choices && Array.isArray(parsedOptions.choices)) {
            setOptions(parsedOptions.choices.join(', '));
          } else {
            setOptions('Option 1, Option 2, Option 3');
          }
        } catch (error) {
          console.error('Error parsing options:', error);
          setOptions('Option 1, Option 2, Option 3');
        }
      } else if (['select', 'radio', 'checkbox'].includes(editingItem.type)) {
        setOptions('Option 1, Option 2, Option 3');
      } else {
        setOptions('');
      }

      if (editingItem.accept) {
        try {
          const parsedAccept = JSON.parse(editingItem.accept);
          if (parsedAccept.types && Array.isArray(parsedAccept.types)) {
            setAccept(parsedAccept.types.join(', '));
          } else {
            setAccept('.pdf, .jpg, .png');
          }
        } catch (error) {
          console.error('Error parsing accept:', error);
          setAccept('.pdf, .jpg, .png');
        }
      } else if (editingItem.type === 'file') {
        setAccept('.pdf, .jpg, .png');
      } else {
        setAccept('');
      }
    }
  }, [editingItem]);

  if (!editingItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let processedOptions = null;
    if (['select', 'radio', 'checkbox'].includes(editingItem.type)) {
      const optionsArray = options ? options.split(',').map(option => option.trim()).filter(Boolean) : [];
      if (optionsArray.length === 0) {
        optionsArray.push('Option 1');
      }
      processedOptions = { choices: optionsArray };
    }

    let processedAccept = null;
    if (editingItem.type === 'file') {
      const acceptArray = accept ? accept.split(',').map(type => type.trim()).filter(Boolean) : [];
      if (acceptArray.length === 0) {
        acceptArray.push('.pdf', '.jpg', '.png');
      }
      processedAccept = { types: acceptArray };
    }

    onSave({
      ...editingItem,
      label,
      placeholder,
      helpText,
      required,
      accept: processedAccept ? JSON.stringify(processedAccept) : null,
      min,
      max,
      step,
      options: processedOptions ? JSON.stringify(processedOptions) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Edit {editingItem.label}</h3>

        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <label className="block mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="border px-2 py-1 w-full"
            />
          </div>

          {(editingItem.type === 'input' || editingItem.type === 'textarea' ||
            editingItem.type === 'number' || editingItem.type === 'email' ||
            editingItem.type === 'password') && (
              <div className="mb-3">
                <label className="block mb-1">Placeholder</label>
                <input
                  type="text"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  className="border px-2 py-1 w-full"
                />
              </div>
            )}

          {editingItem.type === 'file' && (
            <div className="mb-3">
              <label className="block mb-1">Accepted File Types</label>
              <input
                type="text"
                value={accept}
                onChange={(e) => setAccept(e.target.value)}
                className="border px-2 py-1 w-full"
                placeholder=".jpg, .png, .pdf"
              />
            </div>
          )}

          {editingItem.type === 'number' && (
            <>
              <div className="mb-3 grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1">Min</label>
                  <input
                    type="text"
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                    className="border px-2 py-1 w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1">Max</label>
                  <input
                    type="text"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                    className="border px-2 py-1 w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1">Step</label>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => setStep(e.target.value)}
                    className="border px-2 py-1 w-full"
                  />
                </div>
              </div>
            </>
          )}

          {['select', 'radio', 'checkbox'].includes(editingItem.type) && (
            <div>
              <label htmlFor="elementOptions" className="block text-gray-700 mb-2 font-medium">
                Options (comma separated)
              </label>
              <input
                type="text"
                id="elementOptions"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                className="input-primary"
                placeholder="Option 1, Option 2, Option 3"
              />
              <p className="text-xs text-gray-500 mt-1">
                If no options are provided, a default option will be added.
              </p>
            </div>
          )}

          <div className="mb-3">
            <label className="block mb-1">Help Text</label>
            <input
              type="text"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              className="border px-2 py-1 w-full"
            />
          </div>


          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={required ?? false}
                onChange={(e) => setRequired(e.target.checked)}
                className="mr-2"
              />
              Required field
            </label>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer transition-colors duration-200"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="mr-2 px-4 py-1 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
