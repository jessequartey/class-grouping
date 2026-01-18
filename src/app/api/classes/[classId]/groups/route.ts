import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { classes, groups, members, groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateGroupUpdate } from '@/utils/validation';
import type { GroupWithMembers, UpdateGroupsRequest } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    // Check if class exists
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Fetch all groups with their members using Drizzle relational queries
    const groupsList = await db.query.groups.findMany({
      where: eq(groups.classId, classId),
      orderBy: (groups, { asc }) => [asc(groups.position)],
      with: {
        members: {
          with: {
            member: true,
          },
        },
      },
    });

    // Transform the data to match our response type
    const groupsWithMembers: GroupWithMembers[] = groupsList.map((group) => ({
      id: group.id,
      classId: group.classId,
      name: group.name,
      position: group.position,
      createdAt: group.createdAt,
      members: group.members.map((gm) => gm.member),
    }));

    return NextResponse.json({
      groups: groupsWithMembers,
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
    const adminToken = request.headers.get('x-admin-token');
    const body: UpdateGroupsRequest = await request.json();

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

    // Validate the update request
    const validation = validateGroupUpdate(body, {
      minGroupSize: classData.minGroupSize,
      maxGroupSize: classData.maxGroupSize,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Verify all groups belong to this class
    const groupIds = body.groups.map((g) => g.id);
    const existingGroups = await db
      .select()
      .from(groups)
      .where(eq(groups.classId, classId));

    const existingGroupIds = existingGroups.map((g) => g.id);
    const invalidGroupIds = groupIds.filter((id) => !existingGroupIds.includes(id));

    if (invalidGroupIds.length > 0) {
      return NextResponse.json(
        { error: 'Some group IDs are invalid or do not belong to this class' },
        { status: 400 }
      );
    }

    // Verify all member IDs belong to this class
    const allMemberIds = body.groups.flatMap((g) => g.memberIds);
    const existingMembers = await db
      .select()
      .from(members)
      .where(eq(members.classId, classId));

    const existingMemberIds = existingMembers.map((m) => m.id);
    const invalidMemberIds = allMemberIds.filter((id) => !existingMemberIds.includes(id));

    if (invalidMemberIds.length > 0) {
      return NextResponse.json(
        { error: 'Some member IDs are invalid or do not belong to this class' },
        { status: 400 }
      );
    }

    // Check for duplicate member assignments
    const memberIdSet = new Set<string>();
    for (const memberId of allMemberIds) {
      if (memberIdSet.has(memberId)) {
        return NextResponse.json(
          { error: 'A member cannot be assigned to multiple groups' },
          { status: 400 }
        );
      }
      memberIdSet.add(memberId);
    }

    // Update groups (name and position)
    for (const group of body.groups) {
      await db
        .update(groups)
        .set({
          name: group.name,
          position: group.position,
        })
        .where(eq(groups.id, group.id));
    }

    // Delete all existing group member assignments for these groups
    for (const groupId of groupIds) {
      await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
    }

    // Insert new group member assignments
    for (const group of body.groups) {
      for (const memberId of group.memberIds) {
        await db.insert(groupMembers).values({
          id: `gm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          groupId: group.id,
          memberId,
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Groups updated successfully',
    });
  } catch (error) {
    console.error('Error updating groups:', error);
    return NextResponse.json(
      { error: 'Failed to update groups' },
      { status: 500 }
    );
  }
}
