import { useState, useEffect } from 'react';

export default function ErrorTest() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Test potential null reference sources
      const testWindow = typeof window !== 'undefined' ? window : null;
      const testLocation = testWindow?.location;
      const testSearch = testLocation?.search;
      
      console.log('Window:', testWindow);
      console.log('Location:', testLocation);
      console.log('Search:', testSearch);
      
      // Test URLSearchParams
      const params = new URLSearchParams(testSearch || '');
      console.log('Params:', params);
      
    } catch (e) {
      console.error('Error in ErrorTest:', e);
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Error Test Page</h1>
      {error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded">
          Error: {error}
        </div>
      ) : (
        <div className="bg-green-100 text-green-700 p-4 rounded">
          No errors detected
        </div>
      )}
    </div>
  );
}