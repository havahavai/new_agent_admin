import React from 'react'

const TestComponent: React.FC = () => {
  return (
    <div className="p-6 bg-green-100 border-2 border-green-500 rounded-lg">
      <h2 className="text-2xl font-bold text-green-800 mb-4">✅ Test Component Working!</h2>
      <p className="text-green-700">
        If you can see this, React is working correctly.
      </p>
      <div className="mt-4 space-y-2">
        <div className="text-sm text-green-600">✅ React rendering</div>
        <div className="text-sm text-green-600">✅ Tailwind CSS styling</div>
        <div className="text-sm text-green-600">✅ Component imports</div>
      </div>
    </div>
  )
}

export default TestComponent
