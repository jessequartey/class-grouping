'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AutocompleteField from './autocomplete-field';

interface MemberRegistrationFormProps {
  classId: string;
}

export default function MemberRegistrationForm({ classId }: MemberRegistrationFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    sector: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [autocompleteData, setAutocompleteData] = useState<{
    sectors: string[];
    locations: string[];
  } | null>(null);
  const [autocompleteLoading, setAutocompleteLoading] = useState(true);

  // Check if user has already submitted
  useEffect(() => {
    const hasSubmitted = localStorage.getItem(`submitted_${classId}`);
    if (hasSubmitted) {
      setSubmitted(true);
    }
  }, [classId]);

  // Fetch autocomplete data
  useEffect(() => {
    async function fetchAutocompleteData() {
      try {
        const response = await fetch(`/api/classes/${classId}/members/autocomplete`);
        if (response.ok) {
          const data = await response.json();
          setAutocompleteData(data);
        } else {
          setAutocompleteData({ sectors: [], locations: [] });
        }
      } catch (error) {
        console.error('Failed to fetch autocomplete data:', error);
        setAutocompleteData({ sectors: [], locations: [] });
      } finally {
        setAutocompleteLoading(false);
      }
    }
    fetchAutocompleteData();
  }, [classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/classes/${classId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      localStorage.setItem(`submitted_${classId}`, 'true');
      setSubmitted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Registration Complete!</h3>
          <p className="text-gray-600">
            Your details have been submitted. You'll be assigned to a group once the class admin creates the groups.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Register for Class</h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}

            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="John Doe"
          />
        </div>

        {autocompleteLoading ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              placeholder="Loading..."
            />
          </div>
        ) : (
          <AutocompleteField
            id="location"
            label="Location"
            value={formData.location}
            onChange={(value) => setFormData({ ...formData, location: value })}
            options={autocompleteData?.locations || []}
            placeholder="e.g., Accra, Kumasi, etc."
            required
            helperText="Select existing location if available to improve grouping accuracy"
          />
        )}

        {autocompleteLoading ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sector / Field of Work <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              placeholder="Loading..."
            />
          </div>
        ) : (
          <AutocompleteField
            id="sector"
            label="Sector / Field of Work"
            value={formData.sector}
            onChange={(value) => setFormData({ ...formData, sector: value })}
            options={autocompleteData?.sectors || []}
            placeholder="e.g., Technology, Finance, Healthcare, etc."
            required
            helperText="Groups will prioritize same sector - select existing if available"
          />
        )}

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Any additional information..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </>
        ) : (
          'Submit Registration'
        )}
      </button>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Note: You cannot edit your details after submission
      </p>
    </form>
  );
}
