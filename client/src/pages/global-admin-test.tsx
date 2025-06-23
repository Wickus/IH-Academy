export default function GlobalAdminDashboard() {
  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#20366B', fontSize: '32px', marginBottom: '20px' }}>
        Global Admin Dashboard
      </h1>
      <p style={{ color: '#666', fontSize: '16px' }}>
        Dashboard is working! This confirms the routing is correct.
      </p>
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#278DD4', marginBottom: '10px' }}>Test Successful</h2>
        <p>The global admin routing is working correctly.</p>
      </div>
    </div>
  );
}