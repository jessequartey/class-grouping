'use client';

import type { GroupWithMembers } from '@/lib/types';

interface GroupDisplayProps {
  groups: GroupWithMembers[];
}

export default function GroupDisplay({ groups }: GroupDisplayProps) {
  if (groups.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 text-center">
        <p className="text-gray-600">No groups have been created yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-1">Groups Created!</h3>
        <p className="text-sm text-blue-800">
          {groups.length} group{groups.length !== 1 ? 's' : ''} have been formed based on sector and location
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
              <h3 className="text-xl font-bold text-white">{group.name}</h3>
              <p className="text-blue-100 text-sm">
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-4">
              {group.members.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No members assigned</p>
              ) : (
                <ul className="space-y-3">
                  {group.members.map((member) => (
                    <li key={member.id} className="pb-3 border-b border-gray-100 last:border-0">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {member.location}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                          </svg>
                          {member.sector}
                        </span>
                      </div>
                      {member.notes && (
                        <p className="mt-2 text-xs text-gray-600 italic">{member.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
