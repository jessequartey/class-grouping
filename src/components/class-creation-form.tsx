'use client';

import { useState } from 'react';
import type { CreateClassResponse } from '@/lib/types';

export default function ClassCreationForm() {
  const [formData, setFormData] = useState({
    name: '',
    maxGroups: 10,
    minGroupSize: 3,
    maxGroupSize: 6,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CreateClassResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create class');
      }

      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Class Created Successfully!</h2>
          <p className="text-gray-600 mb-6">Share these links with your class members</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Member Registration Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/${success.classId}`}
                className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-sm"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${success.classId}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <label className="block text-sm font-medium text-purple-900 mb-2">
              Admin Dashboard Link (Keep this private!)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}${success.adminUrl}`}
                className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded text-sm"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}${success.adminUrl}`)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-900">
              <strong>Important:</strong> Save the admin link above. You'll need it to manage groups and create the automatic grouping.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSuccess(null);
            setFormData({ name: '', maxGroups: 10, minGroupSize: 3, maxGroupSize: 6 });
          }}
          className="w-full mt-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Create Another Class
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a New Class</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Class Name
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., MBA Class 2026"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="maxGroups" className="block text-sm font-medium text-gray-700 mb-2">
              Max Number of Groups
            </label>
            <input
              type="number"
              id="maxGroups"
              required
              min="1"
              max="100"
              value={formData.maxGroups}
              onChange={(e) => setFormData({ ...formData, maxGroups: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="minGroupSize" className="block text-sm font-medium text-gray-700 mb-2">
              Min Group Size
            </label>
            <input
              type="number"
              id="minGroupSize"
              required
              min="1"
              value={formData.minGroupSize}
              onChange={(e) => setFormData({ ...formData, minGroupSize: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="maxGroupSize" className="block text-sm font-medium text-gray-700 mb-2">
              Max Group Size
            </label>
            <input
              type="number"
              id="maxGroupSize"
              required
              min="1"
              value={formData.maxGroupSize}
              onChange={(e) => setFormData({ ...formData, maxGroupSize: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Members register with their name, location, and sector</li>
            <li>• Groups are created automatically based on sector (primary) and location (secondary)</li>
            <li>• You can manually adjust groups after automatic creation</li>
          </ul>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Creating...' : 'Create Class'}
      </button>
    </form>
  );
}
