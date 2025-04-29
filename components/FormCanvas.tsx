'use client'

import React, { useEffect, useState } from 'react'
import SortableItem from '@/components/SortableItem';
import ElementEditor from '@/components/ElementEditor';
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { deleteFormElement, getFormElements, insertFormElement, reorderFormElements, updateFormElement } from '@/lib/actions';
import { FormElement } from '@/types/FormElement';

interface Props {
    formId: string;
}

export default function FormCanvas({ formId }: Props) {
    const [items, setItems] = useState<FormElement[]>([]);
    const [editingItem, setEditingItem] = useState<FormElement | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [draggingNewElement, setDraggingNewElement] = useState<{ type: string; label: string } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 2,
            },
        })
    );

    useEffect(() => {
        getFormElements(formId).then(setItems);
    }, [formId]);

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();

        const data = e.dataTransfer.getData('application/json');
        if (!data) return;

        const parsed = JSON.parse(data);
        setDraggingNewElement(null);

        let options = undefined;
        if (parsed.type === 'select' || parsed.type === 'radio') {
            const defaultOptions = ['Option 1', 'Option 2', 'Option 3'];
            options = JSON.stringify({ choices: defaultOptions });
        }

        let accept = undefined;
        if (parsed.type === 'file') {
            const defaultAccept = ['.pdf', '.jpg', '.png'];
            accept = JSON.stringify({ types: defaultAccept });
        }

        const newItem = {
            id: crypto.randomUUID(),
            type: parsed.type,
            label: parsed.label,
            order: items.length,
            placeholder: '',
            helpText: '',
            required: false,
            options: options,
            min: parsed.type === 'number' ? '0' : undefined,
            max: parsed.type === 'number' ? '100' : undefined,
            step: parsed.type === 'number' ? '1' : undefined,
            accept: accept
        };
        const updated = [...items, newItem];
        setItems(updated);

        await insertFormElement(formId, newItem);
    }

    const handleDragStart = (e: DragStartEvent) => {
        if (typeof e.active.id === 'string') {
            setActiveId(e.active.id);
        }
    }

    const handleDragEnd = async (e: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = e;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const reordered = arrayMove(items, oldIndex, newIndex);
        setItems(reordered);

        await reorderFormElements(formId, reordered.map((el) => el.id)); //from actions.ts
    }


    useEffect(() => {
        const handleSidebarDragStart = () => {
            try {
                // Get the element data from localStorage
                const jsonData = localStorage.getItem('dragging-element');
                if (jsonData) {
                    const parsed = JSON.parse(jsonData);
                    setDraggingNewElement(parsed);
                }
            } catch (err) {
                console.error('Error reading drag data:', err);
            }
        };

        const handleSidebarDragEnd = () => {
            setDraggingNewElement(null);
        };

        // Listen for custom events from Sidebar
        document.addEventListener('sidebar-drag-start', handleSidebarDragStart);
        document.addEventListener('sidebar-drag-end', handleSidebarDragEnd);

        return () => {
            document.removeEventListener('sidebar-drag-start', handleSidebarDragStart);
            document.removeEventListener('sidebar-drag-end', handleSidebarDragEnd);
        };
    }, []);

    const handleDeleteElement = async (id: string) => {
        try {
            console.log('Deleting element with ID:', id);

            setItems(prev => prev.filter(item => item.id !== id));
            // Call delete API
            await deleteFormElement(id);

        } catch (error) {
            console.error('Error deleting element:', error);
            alert('Failed to delete element. See console for details.');
        }
    };

    const handleEditElement = (item: FormElement) => {
        setEditingItem({ ...item });
    };

    const onSave = async (editingItem: FormElement) => {
        if (!editingItem) return;

        try {
            const dataToUpdate = {
                label: editingItem.label || '',
                placeholder: editingItem.placeholder || undefined,
                helpText: editingItem.helpText || undefined,
                required: editingItem.required === null ? undefined : editingItem.required,
                options: editingItem.options,
                min: editingItem.min || undefined,
                max: editingItem.max || undefined,
                step: editingItem.step || undefined,
                accept: editingItem.accept || undefined,
            }

            await updateFormElement(editingItem.id, dataToUpdate);

            setItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
            setEditingItem(null);
        } catch (error) {
            console.error('Error updating element:', error);
            alert('Failed to update element. See console for details.');
        }
    }

    // const handleSaveEdit = async () => {
    //     if (!editingItem) return;

    //     try {
    //         let processedOptions = editingItem.options;
    //         if (['radio', 'checkbox', 'select'].includes(editingItem.type)) {
    //             // Split options by comma and trim each option
    //             const optionsArray = editingItem.options?.split(',').map(opt => opt.trim()).filter(Boolean) || [];
    //             processedOptions = JSON.stringify({ choices: optionsArray });
    //         }

    //         const dataToUpdate = {
    //             label: editingItem.label || '',
    //             placeholder: editingItem.placeholder || undefined,
    //             helpText: editingItem.helpText || undefined,
    //             required: editingItem.required === null ? undefined : editingItem.required,
    //             options: processedOptions,
    //         }

    //         await updateFormElement(editingItem.id, dataToUpdate);

    //         setItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
    //         setEditingItem(null);
    //     } catch (error) {
    //         console.error('Error updating element:', error);
    //         alert('Failed to update element. See console for details.');
    //     }
    // }

    // const handleEditingChange = (field: string, value: string | boolean) => {
    //     if (!editingItem) return;
        
    //     if (field === 'options' && ['radio', 'checkbox', 'select'].includes(editingItem.type)) {
    //         // Split by comma and trim each option
    //         const optionsArray = typeof value === 'string' ? value.split(',').map(opt => opt.trim()).filter(Boolean) : [];
    //         setEditingItem({
    //             ...editingItem,
    //             options: JSON.stringify({ choices: optionsArray })
    //         });
    //     } else {
    //         setEditingItem({
    //             ...editingItem,
    //             [field]: value
    //         });
    //     }
    // };

    // Helper function to render the appropriate form element preview
    const renderFormElement = (item: FormElement) => {
        const options = item.options?.split(',').map(opt => opt.trim()) || [];

        switch (item.type) {
            case 'text':
                return (
                    <input
                        type='text'
                        className="border px-2 py-1 w-full"
                        placeholder={item.placeholder || "Input field"}
                        required={item.required ?? false}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        className="border px-2 py-1 w-full"
                        placeholder={item.placeholder || "Textarea field"}
                        required={item.required ?? false}
                    />
                );

            case 'checkbox':
                return (
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-2"
                            required={item.required ?? false}
                        />
                        {item.placeholder || "Checkbox option"}
                    </label>
                );

            case 'radio':
                return (
                    <div className="space-y-2">
                        {options.map((option, i) => (
                            <label key={i} className="flex items-center">
                                <input
                                    type="radio"
                                    name={`radio-${item.id}`}
                                    className="mr-2"
                                    required={item.required ?? false}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                );

            case 'select':
                return (
                    <select
                        className="border px-2 py-1 w-full"
                        required={item.required ?? false}
                    >
                        <option value="">Select an option</option>
                        {options.map((option, i) => (
                            <option key={i} value={option}>{option}</option>
                        ))}
                    </select>
                );

            case 'number':
                return (
                    <input
                        type="number"
                        className="border px-2 py-1 w-full"
                        placeholder={item.placeholder || "Number field"}
                        min={item.min || undefined}
                        max={item.max || undefined}
                        step={item.step || undefined}
                        required={item.required ?? false}
                    />
                );

            case 'date':
                return (
                    <input
                        type="date"
                        className="border px-2 py-1 w-full"
                        required={item.required ?? false}
                    />
                );

            case 'email':
                return (
                    <input
                        type="email"
                        className="border px-2 py-1 w-full"
                        placeholder={item.placeholder || "Email field"}
                        required={item.required ?? false}
                    />
                );

            case 'password':
                return (
                    <input
                        type="password"
                        className="border px-2 py-1 w-full"
                        placeholder={item.placeholder || "Password field"}
                        required={item.required ?? false}
                    />
                );

            case 'file':
                return (
                    <input
                        type="file"
                        className="border px-2 py-1 w-full"
                        accept={item.accept || undefined}
                        required={item.required ?? false}
                    />
                );

            case 'image':
                return (
                    <input
                        type="image"
                        className="border px-2 py-1 w-full"
                        accept={item.accept || undefined}
                        required={item.required ?? false}
                    />
                );

            default:
                return (
                    <div className="text-red-500">Unknown element type: {item.type}</div>
                );
        }
    };


    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="lg:col-span-3"
        >
            <div className=' bg-white p-6 rounded-xl shadow-md'>
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                >

                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Form Elements</h2>
                    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                        {items.map((item) => (
                            <SortableItem
                                key={item.id}
                                id={item.id}
                                handleEditElement={handleEditElement}
                                handleDeleteElement={handleDeleteElement}
                                item={item}
                            />
                        ))}
                    </SortableContext>

                    <DragOverlay zIndex={1000} adjustScale={true} dropAnimation={null}>
                        {activeId ? (
                            <div className="opacity-90 scale-105">
                                <div className="border p-3 bg-white shadow-lg rounded min-w-[250px]">
                                    {renderPreviewForId(activeId)}
                                </div>
                            </div>
                        ) : draggingNewElement ? (
                            <div className="border p-3 bg-white shadow-lg rounded-lg min-w-[250px] scale-105 opacity-90">
                                <div className="font-medium text-gray-800 mb-2">{draggingNewElement.label}</div>
                                {draggingNewElement.type === 'input' && <input className="border px-2 py-1 w-full" placeholder="Text input" />}
                                {draggingNewElement.type === 'textarea' && <textarea className="border px-2 py-1 w-full" placeholder="Textarea" />}
                                {draggingNewElement.type === 'checkbox' && (
                                    <label className="flex items-center"><input type="checkbox" className="mr-2" />Checkbox option</label>
                                )}
                                {draggingNewElement.type === 'radio' && (
                                    <div className="space-y-1">
                                        <label className="flex items-center"><input type="radio" name="option" className="mr-2" />Option 1</label>
                                        <label className="flex items-center"><input type="radio" name="option" className="mr-2" />Option 2</label>
                                    </div>
                                )}
                                {draggingNewElement.type === 'select' && (
                                    <select className="border px-2 py-1 w-full">
                                        <option>Select an option</option>
                                        <option>Option 1</option>
                                    </select>
                                )}
                            </div>
                        ) : null}
                    </DragOverlay>


                </DndContext>

                {
                    items.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-gray-400">
                            <p className="mb-2">Drag and drop form elements here</p>
                            <p className="text-sm">Elements will appear in this area</p>
                        </div>
                    )
                }

                {
                    editingItem && (
                        <ElementEditor
                            editingItem={editingItem}
                            setEditingItem={setEditingItem}
                            onSave = {onSave}
                        />
                    )
                }
            </div>

        </div >
    )

    function renderPreviewForId(id: string) {
        const item = items.find(item => item.id === id);
        if (!item) return null;

        return (
            <div>
                <div className="font-medium mb-2">{item.label}</div>
                {renderFormElement(item)}
            </div>
        );
    }
}
