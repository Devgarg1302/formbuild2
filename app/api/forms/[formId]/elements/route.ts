import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/forms/[formId]/elements - Get all elements for a form
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;

        const formElements = await prisma.formElement.findMany({
            where: {
                formId,
            },
            orderBy: {
                order: 'asc',
            },
        });

        return NextResponse.json(formElements);
    } catch (error) {
        console.error('Error fetching form elements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch form elements' },
            { status: 500 }
        );
    }
}

// POST /api/forms/[formId]/elements - Create a new form element
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;
        const { type, label, placeholder, helpText, required, options, validations } = await req.json();

        // Validation
        if (!type || !label) {
            return NextResponse.json(
                { error: 'Type and label are required' },
                { status: 400 }
            );
        }

        // Check if form exists
        const existingForm = await prisma.form.findUnique({
            where: {
                id: formId,
            },
        });

        if (!existingForm) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            );
        }

        // Get the max order to place the new element at the end
        const maxOrderElement = await prisma.formElement.findFirst({
            where: {
                formId,
            },
            orderBy: {
                order: 'desc',
            },
        });

        const nextOrder = maxOrderElement ? maxOrderElement.order + 1 : 0;

        const newElement = await prisma.formElement.create({
            data: {
                type,
                label,
                placeholder,
                helpText,
                required: required || false,
                order: nextOrder,
                options: options || null,
                validations: validations ? JSON.stringify(validations) : null,
                formId,
            },
        });

        return NextResponse.json(newElement, { status: 201 });
    } catch (error) {
        console.error('Error creating form element:', error);
        return NextResponse.json(
            { error: 'Failed to create form element' },
            { status: 500 }
        );
    }
}

// PATCH /api/forms/[formId]/elements - Update element order
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;
        const { elements } = await req.json();

        if (!Array.isArray(elements) || elements.length === 0) {
            return NextResponse.json(
                { error: 'Elements array is required' },
                { status: 400 }
            );
        }

        // Check if form exists
        const existingForm = await prisma.form.findUnique({
            where: {
                id: formId,
            },
        });

        if (!existingForm) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            );
        }

        // Update the order of all elements in a transaction
        await prisma.$transaction(
            elements.map((element, index) =>
                prisma.formElement.update({
                    where: {
                        id: element.id,
                    },
                    data: {
                        order: index,
                    },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating form element order:', error);
        return NextResponse.json(
            { error: 'Failed to update form element order' },
            { status: 500 }
        );
    }
} 