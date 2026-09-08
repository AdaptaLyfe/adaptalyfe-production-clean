export default function App() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-600">
          AdaptaLyfe
        </h1>
        <div className="text-center mb-8">
          <p className="text-lg text-gray-600">
            Grow with Guidance. Thrive with Confidence.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome to AdaptaLyfe</h2>
          <p className="text-gray-600 mb-6">
            Your comprehensive independence-building platform is now accessible without any login requirements.
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800">✓ Full Access Available</h3>
              <p className="text-blue-600">All features are now accessible without authentication</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800">✓ Mobile Responsive</h3>
              <p className="text-green-600">Works perfectly on all devices</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800">✓ Demo Ready</h3>
              <p className="text-purple-600">Perfect for showing potential users</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}