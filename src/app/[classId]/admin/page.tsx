import { notFound } from 'next/navigation';
import AdminControls from '@/components/admin-controls';
import GroupEditor from '@/components/group-editor';
import type { ClassWithDetails, GroupWithMembers, MemberWithGroup } from '@/lib/types';

interface AdminPageProps {
  params: Promise<{
    classId: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

async function validateAdminToken(classId: string, token: string | undefined) {
  if (!token) {
    return false;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/classes/${classId}`, {
      headers: {
        'x-admin-token': token,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.class.adminToken === token;
  } catch (error) {
    return false;
  }
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

export default async function AdminPage({ params, searchParams }: AdminPageProps) {
  const { classId } = await params;
  const { token } = await searchParams;

  const isValidToken = await validateAdminToken(classId, token);

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
              <p className="text-gray-600 mb-4">
                Invalid or missing admin token. Please use the admin link provided when you created the class.
              </p>
              <a
                href={`/${classId}`}
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Go to Class Page
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
              Admin Dashboard
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Manage your class groups and members
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href={`/${classId}`}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ← View Public Class Page
            </a>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="mb-8">
          <AdminControls
            classData={classData}
            memberCount={members.length}
            adminToken={token!}
          />
        </div>

        {/* Group Editor */}
        {classData.groupsCreated && groups.length > 0 && (
          <div>
            <GroupEditor
              initialGroups={groups}
              classId={classId}
              adminToken={token!}
              minGroupSize={classData.minGroupSize}
              maxGroupSize={classData.maxGroupSize}
            />
          </div>
        )}

        {/* Members List */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">All Registered Members</h3>
          {members.length === 0 ? (
            <p className="text-gray-500 text-sm">No members have registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`p-4 rounded-lg ${
                    !member.groupId
                      ? 'border-2 border-red-400 bg-red-50'
                      : 'border border-gray-200 bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {member.sector} • {member.location}
                  </p>
                  {member.group && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      📋 {member.group.name}
                    </p>
                  )}
                  {member.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">{member.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
