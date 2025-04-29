import { NextRequest, NextResponse } from 'next/server';
import {prisma} from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    
    const forms = await prisma.form.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const newForm = await prisma.form.create({
      data: {
        title,
        description,
      },
    });
    
    return NextResponse.json(newForm, { status: 201 });
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    );
  }
} 

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }
    
    const deletedForm = await prisma.form.delete({
      where: { id },
    });
    
    return NextResponse.json(deletedForm, { status: 200 });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    );
  }
}