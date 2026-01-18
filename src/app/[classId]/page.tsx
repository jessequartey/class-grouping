import { notFound } from 'next/navigation';
import MemberRegistrationForm from '@/components/member-registration-form';
import GroupDisplay from '@/components/group-display';
import type { ClassWithDetails, GroupWithMembers, MemberWithGroup } from '@/lib/types';

interface ClassPageProps {
  params: Promise<{
    classId: string;
  }>;
}

async function getClassData(classId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/classes/${classId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.class as ClassWithDetails;
  } catch (error) {
    return null;
  }
}

async function getMembers(classId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/classes/${classId}/members`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.members as MemberWithGroup[];
  } catch (error) {
    return [];
  }
}

async function getGroups(classId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/classes/${classId}/groups`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.groups as GroupWithMembers[];
  } catch (error) {
    return [];
  }
}

export default async function ClassPage({ params }: ClassPageProps) {
  const { classId } = await params;
  const classData = await getClassData(classId);

  if (!classData) {
    notFound();
  }

  const members = await getMembers(classId);
  const groups = await getGroups(classId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{classData.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>{members.length} members registered</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                {classData.groupsCreated
                  ? `${groups.length} groups created`
                  : 'Groups not created yet'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Group size: {classData.minGroupSize}-{classData.maxGroupSize} members</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {classData.groupsCreated ? (
          // Show groups
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Groups</h2>
            <GroupDisplay groups={groups} />
          </div>
        ) : (
          // Show registration form
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <MemberRegistrationForm classId={classId} />
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Registered Members</h3>
                {members.length === 0 ? (
                  <p className="text-gray-500 text-sm">No members yet. Be the first to register!</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {member.sector} • {member.location}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Next Steps</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>All members register</li>
                  <li>Admin creates groups</li>
                  <li>Groups are displayed here</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
