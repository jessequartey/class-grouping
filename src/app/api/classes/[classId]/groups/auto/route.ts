import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { classes, members, groups, groupMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateGroupId, generateGroupMemberId } from '@/lib/id-generator';
import { createGroups } from '@/lib/grouping-algorithm';
import type { AutoGroupResponse, GroupConfig } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
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

    // Check if groups already exist
    if (classData.groupsCreated) {
      return NextResponse.json(
        { error: 'Groups have already been created for this class' },
        { status: 400 }
      );
    }

    // Fetch all members for this class
    const membersList = await db
      .select()
      .from(members)
      .where(eq(members.classId, classId));

    if (membersList.length === 0) {
      return NextResponse.json(
        { error: 'No members to group' },
        { status: 400 }
      );
    }

    // Prepare grouping config
    const config: GroupConfig = {
      maxGroups: classData.maxGroups,
      minGroupSize: classData.minGroupSize,
      maxGroupSize: classData.maxGroupSize,
    };

    // Run the grouping algorithm
    const groupResults = createGroups(membersList, config);

    // Insert groups and group members in a transaction
    // Note: better-sqlite3 doesn't support async transactions, so we'll do it sequentially
    const createdGroups = [];

    for (let i = 0; i < groupResults.length; i++) {
      const groupResult = groupResults[i];
      const groupId = generateGroupId();

      // Insert group
      await db.insert(groups).values({
        id: groupId,
        classId,
        name: groupResult.name,
        position: i + 1,
        createdAt: new Date(),
      });

      // Insert group members
      for (const member of groupResult.members) {
        await db.insert(groupMembers).values({
          id: generateGroupMemberId(),
          groupId,
          memberId: member.id,
          createdAt: new Date(),
        });
      }

      createdGroups.push({
        id: groupId,
        name: groupResult.name,
        position: i + 1,
        classId,
        createdAt: new Date(),
        members: groupResult.members,
      });
    }

    // Update class to mark groups as created
    await db
      .update(classes)
      .set({ groupsCreated: true })
      .where(eq(classes.id, classId));

    const response: AutoGroupResponse = {
      groups: createdGroups,
      success: true,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating groups:', error);
    return NextResponse.json(
      { error: 'Failed to create groups' },
      { status: 500 }
    );
  }
}
