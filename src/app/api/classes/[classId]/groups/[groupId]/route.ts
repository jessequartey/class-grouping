import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { classes, groups } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string; groupId: string }> }
) {
  try {
    const { classId, groupId } = await params;
    const adminToken = request.headers.get('x-admin-token');

    // Fetch class data
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Validate admin token
    if (!adminToken || adminToken !== classData.adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if group exists and belongs to this class
    const group = await db.query.groups.findFirst({
      where: and(
        eq(groups.id, groupId),
        eq(groups.classId, classId)
      ),
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or does not belong to this class' },
        { status: 404 }
      );
    }

    // Delete the group (cascading delete handles group_members automatically)
    await db.delete(groups).where(eq(groups.id, groupId));

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
