import React from 'react'

const TestPage: React.FC = () => {
  return (
    <div className="p-8 bg-white">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Test Page Working!</h1>
      <p className="text-gray-700 mb-4">
        If you can see this, React is rendering correctly.
      </p>
      <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
        <p className="text-green-800 font-medium">
          ✅ Application is working
        </p>
      </div>
    </div>
  )
}

export default TestPage
