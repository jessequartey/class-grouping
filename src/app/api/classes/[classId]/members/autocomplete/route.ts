import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { classes, members } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    // Fetch unique sectors (uses idx_members_sector index)
    const sectorResults = await db
      .selectDistinct({ sector: members.sector })
      .from(members)
      .where(eq(members.classId, classId))
      .orderBy(members.sector);

    // Fetch unique locations (uses idx_members_location index)
    const locationResults = await db
      .selectDistinct({ location: members.location })
      .from(members)
      .where(eq(members.classId, classId))
      .orderBy(members.location);

    const sectors = sectorResults.map(r => r.sector);
    const locations = locationResults.map(r => r.location);

    return NextResponse.json({ sectors, locations });
  } catch (error) {
    console.error('Error fetching autocomplete data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch autocomplete data' },
      { status: 500 }
    );
  }
}
