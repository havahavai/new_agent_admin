

const Trips = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', margin: '0 0 10px 0' }}>
          Trips Dashboard - WORKING
        </h1>
        <p style={{ color: '#666', margin: '0 0 10px 0' }}>
          Flight management system is working!
        </p>
        <p style={{ color: 'green', fontSize: '14px', margin: '0' }}>
          ✓ Basic React component is working
        </p>
        <p style={{ color: 'blue', fontSize: '14px', margin: '5px 0 0 0' }}>
          Current time: {new Date().toLocaleString()}
        </p>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '24px', color: '#333', margin: '0 0 15px 0' }}>
          System Status
        </h2>
        <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
          <li style={{ padding: '5px 0', color: 'green' }}>✓ React is working</li>
          <li style={{ padding: '5px 0', color: 'green' }}>✓ Component is rendering</li>
          <li style={{ padding: '5px 0', color: 'green' }}>✓ Styles are applied</li>
          <li style={{ padding: '5px 0', color: 'green' }}>✓ JavaScript is executing</li>
          <li style={{ padding: '5px 0', color: 'orange' }}>⚠ Advanced components disabled for testing</li>
        </ul>
      </div>
    </div>
  )
}

export default Trips
