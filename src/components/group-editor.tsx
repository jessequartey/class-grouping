'use client';

import { useState, useEffect } from 'react';
import type { GroupWithMembers, Member, MemberWithGroup } from '@/lib/types';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [unassignedMembers, setUnassignedMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (showCreateModal) {
      fetchUnassignedMembers();
    }
  }, [showCreateModal]);

  const fetchUnassignedMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/classes/${classId}/members`);
      const data = await response.json();

      // Filter to only unassigned members
      const assignedMemberIds = new Set(
        groups.flatMap(g => g.members.map(m => m.id))
      );
      const unassigned = data.members.filter(
        (m: MemberWithGroup) => !assignedMemberIds.has(m.id)
      );
      setUnassignedMembers(unassigned);
    } catch (err) {
      console.error('Failed to fetch unassigned members:', err);
      setUnassignedMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

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

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${groupName}"?\n\nAll members in this group will become unassigned.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/classes/${classId}/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete group');
      }

      // Remove group from local state
      setGroups(groups.filter(g => g.id !== groupId));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCreateGroup = async () => {
    // Client-side validation
    if (!newGroupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedMemberIds.length < minGroupSize) {
      setError(`Group must have at least ${minGroupSize} members`);
      return;
    }

    if (selectedMemberIds.length > maxGroupSize) {
      setError(`Group cannot exceed ${maxGroupSize} members`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/classes/${classId}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
          memberIds: selectedMemberIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create group');
      }

      // Add new group to local state
      const newGroup: GroupWithMembers = {
        id: data.group.id,
        classId,
        name: newGroupName.trim(),
        position: groups.length + 1,
        createdAt: new Date(),
        members: unassignedMembers.filter(m => selectedMemberIds.includes(m.id)),
      };

      setGroups([...groups, newGroup]);

      // Reset modal state
      setShowCreateModal(false);
      setNewGroupName('');
      setSelectedMemberIds([]);
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            Create Group
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
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
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => renameGroup(group.id, e.target.value)}
                  className="text-lg font-bold text-gray-900 border-b-2 border-transparent hover:border-blue-500 focus:border-blue-500 focus:outline-none px-2 py-1"
                />
                <span
                  className={`text-sm ${
                    group.members.length < minGroupSize || group.members.length > maxGroupSize
                      ? 'text-red-600 font-medium'
                      : 'text-gray-600'
                  }`}
                >
                  {group.members.length} members
                </span>
              </div>
              <button
                onClick={() => handleDeleteGroup(group.id, group.name)}
                disabled={loading}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-1"
                title="Delete this group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
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

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create New Group</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroupName('');
                  setSelectedMemberIds([]);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Group Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Group 5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                maxLength={100}
              />
            </div>

            {/* Member Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Members ({selectedMemberIds.length} selected, need {minGroupSize}-{maxGroupSize})
              </label>

              {loadingMembers ? (
                <div className="text-center py-8 text-gray-500">Loading unassigned members...</div>
              ) : unassignedMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  No unassigned members available. All members are already in groups.
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg max-h-80 overflow-y-auto">
                  {unassignedMembers.map((member) => (
                    <label
                      key={member.id}
                      className={`flex items-center p-3 border-b last:border-b-0 border-gray-200 cursor-pointer hover:bg-gray-50 ${
                        selectedMemberIds.includes(member.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(member.id)}
                        onChange={() => toggleMemberSelection(member.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-600">
                          {member.sector} • {member.location}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                        Unassigned
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroupName('');
                  setSelectedMemberIds([]);
                  setError(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={loading || selectedMemberIds.length === 0 || !newGroupName.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
