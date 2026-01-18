import ClassCreationForm from '@/components/class-creation-form';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Class Group Manager
          </h1>
          <p className="text-lg text-gray-600">
            Automatically create study groups based on sector and location
          </p>
        </div>

        <ClassCreationForm />

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Simple. Fast. Organized.</p>
        </div>
      </div>
    </div>
  );
}
