import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { classes, members, groups } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import type { ClassWithDetails } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
    const adminToken = request.headers.get('x-admin-token');

    // Fetch class details
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if admin token is valid
    const isAdmin = adminToken === classData.adminToken;

    // Get member count
    const memberCountResult = await db
      .select({ count: count() })
      .from(members)
      .where(eq(members.classId, classId));

    const memberCount = memberCountResult[0]?.count || 0;

    // Get group count
    const groupCountResult = await db
      .select({ count: count() })
      .from(groups)
      .where(eq(groups.classId, classId));

    const groupCount = groupCountResult[0]?.count || 0;

    // Prepare response (exclude adminToken from response)
    const response: ClassWithDetails = {
      id: classData.id,
      name: classData.name,
      maxGroups: classData.maxGroups,
      minGroupSize: classData.minGroupSize,
      maxGroupSize: classData.maxGroupSize,
      adminToken: classData.adminToken,
      createdAt: classData.createdAt,
      groupsCreated: classData.groupsCreated,
      isAdmin,
      memberCount,
      groupCount,
    };

    // Remove adminToken from response if not admin
    if (!isAdmin) {
      delete (response as any).adminToken;
    }

    return NextResponse.json({ class: response });
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class details' },
      { status: 500 }
    );
  }
}
