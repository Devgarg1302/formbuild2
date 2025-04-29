import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/forms/[formId]/elements/[elementId] - Get a specific element
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string; elementId: string }> }
) {
  try {
    const { formId, elementId } = await params;
    
    const element = await prisma.formElement.findUnique({
      where: {
        id: elementId,
      },
    });
    
    if (!element || element.formId !== formId) {
      return NextResponse.json(
        { error: 'Form element not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(element);
  } catch (error) {
    console.error('Error fetching form element:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form element' },
      { status: 500 }
    );
  }
}

// PATCH /api/forms/[formId]/elements/[elementId] - Update a form element
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string; elementId: string }> }
) {
  try {
    const { formId, elementId } = await params;
    const { type, label, placeholder, helpText, required, options, validations } = await req.json();
    
    // Log the options for debugging
    console.log('Received options:', options);
    console.log('Options type:', typeof options);
    
    // Check if element exists and belongs to the specified form
    const existingElement = await prisma.formElement.findUnique({
      where: {
        id: elementId,
      },
    });
    
    if (!existingElement || existingElement.formId !== formId) {
      return NextResponse.json(
        { error: 'Form element not found' },
        { status: 404 }
      );
    }
    
    const updateData: any = {
      type,
      label,
      placeholder,
      helpText,
      required,
      options: options === null ? null : (options || existingElement.options),
      validations: validations ? JSON.stringify(validations) : existingElement.validations,
    };
    
    
    const updatedElement = await prisma.formElement.update({
      where: {
        id: elementId,
      },
      data: updateData
    });
    
    return NextResponse.json(updatedElement);
  } catch (error) {
    console.error('Error updating form element:', error);
    return NextResponse.json(
      { error: 'Failed to update form element' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string; elementId: string }> }
) {
  try {
    const { formId, elementId } = await params;
    
    const existingElement = await prisma.formElement.findUnique({
      where: {
        id: elementId,
      },
    });
    
    if (!existingElement || existingElement.formId !== formId) {
      return NextResponse.json(
        { error: 'Form element not found' },
        { status: 404 }
      );
    }
    
    await prisma.formElement.delete({
      where: {
        id: elementId,
      },
    });
    
    const remainingElements = await prisma.formElement.findMany({
      where: {
        formId,
        order: {
          gt: existingElement.order,
        },
      },
    });
    
    if (remainingElements.length > 0) {
      await prisma.$transaction(
        remainingElements.map((element) =>
          prisma.formElement.update({
            where: {
              id: element.id,
            },
            data: {
              order: element.order - 1,
            },
          })
        )
      );
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting form element:', error);
    return NextResponse.json(
      { error: 'Failed to delete form element' },
      { status: 500 }
    );
  }
} 