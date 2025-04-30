'use server';

import { prisma } from '@/lib/prisma';

export async function getAllForms(){
    try {
        const forms = await prisma.form.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return forms;
    } catch (error) {
        console.error('Error fetching forms:', error);
        return error;
    }   
}

export async function getForm(formId: string) {
    try {

        const forms = await prisma.form.findUnique({
            where: {
                id: formId,
            },
            include: {
                formElements: {
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        });

        return forms;

    } catch (error) {
        console.error('Error fetching forms:', error);
        return error;
    }
}

export async function saveForm(formId: string, title: string, description: string, published: boolean) {
    try {

        const existingForm = await prisma.form.findUnique({
            where: {
                id: formId,
            },
        });

        if (!existingForm) {
            return console.error("form not found");
        }

        const form = await prisma.form.update({
            where: {
                id: formId,
            },
            data: {
                title,
                description,
                published,
            },
        });

        return form;
    } catch (error) {
        console.error('Error saving form:', error);
        return error;
    }
}


export async function getFormElements(formId: string) {
    return prisma.formElement.findMany({
        where: { formId },
        orderBy: { order: 'asc' },
    });
}

export async function insertFormElement(formId: string, element: {
    id: string;
    type: string;
    label: string;
    order: number;
    placeholder?: string;
    helpText?: string;
    required?: boolean;
    options?: string;
    min?: string;
    max?: string;
    step?: string;
    accept?: string;
}) {
    console.log('Inserting element:', { formId, ...element });
    try {
        // Now we can create with all properties
        const result = await prisma.formElement.create({
            data: {
                id: element.id,
                type: element.type,
                label: element.label,
                order: element.order,
                placeholder: element.placeholder || null,
                helpText: element.helpText || null,
                required: element.required || false,
                options: element.options || null,
                min: element.min || null,
                max: element.max || null,
                step: element.step || null,
                accept: element.accept || null,
                formId,
            },
        });

        return result;
    } catch (error) {
        console.error('Error creating form element:', error);
        throw error;
    }
}

export async function reorderFormElements(formId: string, orderedIds: string[]) {
    const updatePromises = orderedIds.map((id, index) =>
        prisma.formElement.update({
            where: { id },
            data: { order: index },
        })
    );
    await Promise.all(updatePromises);
}

export async function deleteFormElement(id: string) {
    console.log('Server action - deleting element with ID:', id);
    try {
        const result = await prisma.formElement.delete({
            where: { id }
        });
        console.log('Delete result:', result);
        return result;
    } catch (error) {
        console.error('Error in deleteFormElement:', error);
        throw error;
    }
}

export async function updateFormElement(id: string, data: {
    label?: string;
    placeholder?: string | null;
    helpText?: string | null;
    required?: boolean | null;
    options?: string | null;
    min?: string | null;
    max?: string | null;
    step?: string | null;
    accept?: string | null;
    subformId?: string | null;
}) {
    console.log('Updating element:', { id, ...data });
    try {
        // Transform data to handle null values correctly
        const prismaData: {
            label?: string;
            placeholder?: string | null;
            helpText?: string | null;
            required?: boolean;
            options?: string | null;
            min?: string | null;
            max?: string | null;
            step?: string | null;
            accept?: string | null;
            subformId?: string | null;
        } = {};

        // Only include properties that exist in the input
        if ('label' in data) prismaData.label = data.label;
        if ('placeholder' in data) prismaData.placeholder = data.placeholder;
        if ('helpText' in data) prismaData.helpText = data.helpText;
        if ('required' in data) prismaData.required = data.required === null ? false : data.required;
        if ('options' in data) prismaData.options = data.options;
        if ('min' in data) prismaData.min = data.min;
        if ('max' in data) prismaData.max = data.max;
        if ('step' in data) prismaData.step = data.step;
        if ('accept' in data) prismaData.accept = data.accept;
        if('subformId' in data) prismaData.subformId = data.subformId;

        const result = await prisma.formElement.update({
            where: { id },
            data: prismaData
        });
        return result;
    } catch (error) {
        console.error('Error updating form element:', error);
        throw error;
    }
}
