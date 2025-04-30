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

    const IconSvg = ({ path }: { path: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
        </svg>
    );
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
                subformId: editingItem.subformId || undefined,
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
    // const renderFormElement = (item: FormElement) => {
    //     const options = item.options?.split(',').map(opt => opt.trim()) || [];

    //     switch (item.type) {
    //         case 'text':
    //             return (
    //                 <input
    //                     type='text'
    //                     className="border px-2 py-1 w-full"
    //                     placeholder={item.placeholder || "Input field"}
    //                     required={item.required ?? false}
    //                 />
    //             );

    //         case 'textarea':
    //             return (
    //                 <textarea
    //                     className="border px-2 py-1 w-full"
    //                     placeholder={item.placeholder || "Textarea field"}
    //                     required={item.required ?? false}
    //                 />
    //             );

    //         case 'checkbox':
    //             return (
    //                 <label className="flex items-center">
    //                     <input
    //                         type="checkbox"
    //                         className="mr-2"
    //                         required={item.required ?? false}
    //                     />
    //                     {item.placeholder || "Checkbox option"}
    //                 </label>
    //             );

    //         case 'radio':
    //             return (
    //                 <div className="space-y-2">
    //                     {options.map((option, i) => (
    //                         <label key={i} className="flex items-center">
    //                             <input
    //                                 type="radio"
    //                                 name={`radio-${item.id}`}
    //                                 className="mr-2"
    //                                 required={item.required ?? false}
    //                             />
    //                             {option}
    //                         </label>
    //                     ))}
    //                 </div>
    //             );

    //         case 'select':
    //             return (
    //                 <select
    //                     className="border px-2 py-1 w-full"
    //                     required={item.required ?? false}
    //                 >
    //                     <option value="">Select an option</option>
    //                     {options.map((option, i) => (
    //                         <option key={i} value={option}>{option}</option>
    //                     ))}
    //                 </select>
    //             );

    //         case 'number':
    //             return (
    //                 <input
    //                     type="number"
    //                     className="border px-2 py-1 w-full"
    //                     placeholder={item.placeholder || "Number field"}
    //                     min={item.min || undefined}
    //                     max={item.max || undefined}
    //                     step={item.step || undefined}
    //                     required={item.required ?? false}
    //                 />
    //             );

    //         case 'date':
    //             return (
    //                 <input
    //                     type="date"
    //                     className="border px-2 py-1 w-full"
    //                     required={item.required ?? false}
    //                 />
    //             );

    //         case 'email':
    //             return (
    //                 <input
    //                     type="email"
    //                     className="border px-2 py-1 w-full"
    //                     placeholder={item.placeholder || "Email field"}
    //                     required={item.required ?? false}
    //                 />
    //             );

    //         case 'password':
    //             return (
    //                 <input
    //                     type="password"
    //                     className="border px-2 py-1 w-full"
    //                     placeholder={item.placeholder || "Password field"}
    //                     required={item.required ?? false}
    //                 />
    //             );

    //         case 'file':
    //             return (
    //                 <input
    //                     type="file"
    //                     className="border px-2 py-1 w-full"
    //                     accept={item.accept || undefined}
    //                     required={item.required ?? false}
    //                 />
    //             );

    //         case 'image':
    //             return (
    //                 <input
    //                     type="image"
    //                     className="border px-2 py-1 w-full"
    //                     accept={item.accept || undefined}
    //                     required={item.required ?? false}
    //                 />
    //             );

    //         default:
    //             return (
    //                 <div className="text-red-500">Unknown element type: {item.type}</div>
    //             );
    //     }
    // };


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
                            <div className="opacity-90 scale-100">
                                <div className="border border-emerald-500 p-3 bg-white shadow-lg rounded-xl min-w-[250px]">
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
                            onSave={onSave}
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
            <div className='flex flex-row'>
                <span className="text-sm bg-emerald-100 text-emerald-800 px-2 py-1 rounded mr-2">{getElementIcon(item.type)}</span>
                <div className="font-medium mb-2">{item.label}</div>
            </div>
        );
    }
}
