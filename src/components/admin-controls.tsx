'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClassWithDetails } from '@/lib/types';

interface AdminControlsProps {
  classData: ClassWithDetails;
  memberCount: number;
  adminToken: string;
}

export default function AdminControls({
  classData,
  memberCount,
  adminToken,
}: AdminControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleCreateGroups = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/classes/${classData.id}/groups/auto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create groups');
      }

      // Refresh server component data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = () => {
    if (memberCount === 0) {
      setError('No members registered yet');
      return;
    }
    setShowConfirmModal(true);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Admin Controls</h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Total Members</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{memberCount}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Max Groups</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">{classData.maxGroups}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-medium">Group Size</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            {classData.minGroupSize}-{classData.maxGroupSize}
          </p>
        </div>
      </div>

      {!classData.groupsCreated ? (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-900">
              <strong>Ready to create groups?</strong> The algorithm will group members by sector first, then by location within sectors.
            </p>
          </div>

          <button
            onClick={openConfirmModal}
            disabled={loading || memberCount === 0}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Creating Groups...' : 'Auto-Create Groups'}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-green-900">
              Groups have been created! You can now edit them below.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Groups</h3>
                <p className="text-sm text-gray-600">Ready to auto-create groups?</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 mb-2">
                <strong>What will happen:</strong>
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li>Groups will be created from <strong>{memberCount} members</strong></li>
                <li>Members will be grouped by sector first</li>
                <li>Then organized by location within sectors</li>
                <li>Group sizes will be between {classData.minGroupSize}-{classData.maxGroupSize} members</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroups}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Create Groups
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
