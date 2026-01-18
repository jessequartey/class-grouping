import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { classes } from '@/db/schema';
import { generateClassId, generateAdminToken } from '@/lib/id-generator';
import { validateClassCreation } from '@/utils/validation';
import type { CreateClassRequest, CreateClassResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: CreateClassRequest = await request.json();

    // Validate input
    const validation = validateClassCreation(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate IDs
    const classId = generateClassId();
    const adminToken = generateAdminToken();

    // Insert class into database
    await db.insert(classes).values({
      id: classId,
      name: body.name.trim(),
      maxGroups: body.maxGroups,
      minGroupSize: body.minGroupSize,
      maxGroupSize: body.maxGroupSize,
      adminToken,
      createdAt: new Date(),
      groupsCreated: false,
    });

    // Construct admin URL
    const adminUrl = `/${classId}/admin?token=${adminToken}`;

    const response: CreateClassResponse = {
      classId,
      adminToken,
      adminUrl,
    };

    revalidatePath('/');

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}
