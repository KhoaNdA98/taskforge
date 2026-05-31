import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: 12, height: 12, flexShrink: 0, background: '#ff914d', boxShadow: '2px 0 0 #ffde59, 0 2px 0 #ffde59, 2px 2px 0 #cc6b30' }} />
            <span style={{
              fontFamily: "'VT323', monospace", fontSize: '42px', letterSpacing: '0.1em',
              color: '#111111',
              textShadow: '-1px -1px 0 #ff914d, 1px -1px 0 #ff914d, -1px 1px 0 #ff914d, 1px 1px 0 #ff914d, 2px 3px 0 #cc6b30, 3px 4px 0 #111111',
            }}>
              ⭐ TASKFORGE
            </span>
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(252,234,187,0.3)', textTransform: 'uppercase' }}>
            Golden Arcade Edition
          </div>
        </div>

        {/* Panel */}
        <div style={{
          background: '#232323',
          border: '3px solid #111111',
          boxShadow: 'inset 0 0 0 1px rgba(255,145,77,0.2), 5px 5px 0 #111111',
          padding: '28px',
        }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(255,145,77,0.5)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Enter World
          </div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: '28px', color: '#fceabb', letterSpacing: '0.06em', marginBottom: '20px' }}>
            SIGN IN
          </div>
          <LoginForm />
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(252,234,187,0.15)', letterSpacing: '0.06em' }}>
          task &amp; billing tracker for freelancers
        </div>
      </div>
    </div>
  );
}
