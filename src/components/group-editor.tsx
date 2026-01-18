'use client';

import { useState } from 'react';
import type { GroupWithMembers, Member } from '@/lib/types';

interface GroupEditorProps {
  initialGroups: GroupWithMembers[];
  classId: string;
  adminToken: string;
  minGroupSize: number;
  maxGroupSize: number;
}

export default function GroupEditor({
  initialGroups,
  classId,
  adminToken,
  minGroupSize,
  maxGroupSize,
}: GroupEditorProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const moveMember = (memberId: string, fromGroupId: string, toGroupId: string) => {
    setGroups((prevGroups) => {
      const newGroups = prevGroups.map((group) => {
        if (group.id === fromGroupId) {
          return {
            ...group,
            members: group.members.filter((m) => m.id !== memberId),
          };
        }
        if (group.id === toGroupId) {
          const memberToMove = prevGroups
            .find((g) => g.id === fromGroupId)
            ?.members.find((m) => m.id === memberId);
          if (memberToMove) {
            return {
              ...group,
              members: [...group.members, memberToMove],
            };
          }
        }
        return group;
      });
      return newGroups;
    });
  };

  const renameGroup = (groupId: string, newName: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId ? { ...group, name: newName } : group
      )
    );
  };

  const validateGroups = (): string | null => {
    for (const group of groups) {
      if (group.members.length < minGroupSize) {
        return `Group "${group.name}" has ${group.members.length} members, minimum is ${minGroupSize}`;
      }
      if (group.members.length > maxGroupSize) {
        return `Group "${group.name}" has ${group.members.length} members, maximum is ${maxGroupSize}`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateGroups();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/classes/${classId}/groups`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          groups: groups.map((group, index) => ({
            id: group.id,
            name: group.name,
            position: index + 1,
            memberIds: group.members.map((m) => m.id),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update groups');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Edit Groups</h3>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">Groups updated successfully!</p>
        </div>
      )}

      <div className="space-y-6">
        {groups.map((group, groupIndex) => (
          <div key={group.id} className="border border-gray-200 rounded-lg p-4">
            <div className="mb-4">
              <input
                type="text"
                value={group.name}
                onChange={(e) => renameGroup(group.id, e.target.value)}
                className="text-lg font-bold text-gray-900 border-b-2 border-transparent hover:border-blue-500 focus:border-blue-500 focus:outline-none px-2 py-1"
              />
              <span
                className={`ml-3 text-sm ${
                  group.members.length < minGroupSize || group.members.length > maxGroupSize
                    ? 'text-red-600 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {group.members.length} members
              </span>
            </div>

            {group.members.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No members in this group</p>
            ) : (
              <ul className="space-y-2">
                {group.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-600">
                        {member.sector} • {member.location}
                      </p>
                    </div>

                    <select
                      onChange={(e) => {
                        if (e.target.value && e.target.value !== group.id) {
                          moveMember(member.id, group.id, e.target.value);
                        }
                        e.target.value = '';
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Move to...</option>
                      {groups
                        .filter((g) => g.id !== group.id)
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                    </select>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Use the dropdown next to each member to move them between groups.
          Click on group names to rename them. Make sure each group has between {minGroupSize} and {maxGroupSize} members.
        </p>
      </div>
    </div>
  );
}
