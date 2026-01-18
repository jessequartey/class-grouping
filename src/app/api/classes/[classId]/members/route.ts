import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { classes, members, groups, groupMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateMemberId } from '@/lib/id-generator';
import { validateMemberRegistration } from '@/utils/validation';
import type { CreateMemberRequest, CreateMemberResponse, MemberWithGroup } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
    const body: CreateMemberRequest = await request.json();

    // Validate input
    const validation = validateMemberRegistration(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

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

    // Check if groups have already been created
    if (classData.groupsCreated) {
      return NextResponse.json(
        { error: 'Cannot register members after groups have been created' },
        { status: 400 }
      );
    }

    // Generate member ID
    const memberId = generateMemberId();

    // Insert member into database
    await db.insert(members).values({
      id: memberId,
      classId,
      name: body.name.trim(),
      location: body.location.trim(),
      sector: body.sector.trim(),
      notes: body.notes?.trim() || null,
      createdAt: new Date(),
    });

    const response: CreateMemberResponse = {
      memberId,
      success: true,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error registering member:', error);
    return NextResponse.json(
      { error: 'Failed to register member' },
      { status: 500 }
    );
  }
}

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

    // Fetch all members for this class with their group assignments
    const membersList = await db
      .select({
        id: members.id,
        classId: members.classId,
        name: members.name,
        location: members.location,
        sector: members.sector,
        notes: members.notes,
        createdAt: members.createdAt,
        groupId: groups.id,
        groupName: groups.name,
      })
      .from(members)
      .leftJoin(groupMembers, eq(members.id, groupMembers.memberId))
      .leftJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(members.classId, classId))
      .orderBy(members.createdAt);

    const membersWithGroups: MemberWithGroup[] = membersList.map((m) => ({
      id: m.id,
      classId: m.classId,
      name: m.name,
      location: m.location,
      sector: m.sector,
      notes: m.notes,
      createdAt: m.createdAt,
      groupId: m.groupId || null,
      groupName: m.groupName || null,
    }));

    return NextResponse.json({
      members: membersWithGroups,
      totalCount: membersWithGroups.length,
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
