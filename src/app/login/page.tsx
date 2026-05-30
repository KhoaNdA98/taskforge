import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#08080e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 10, height: 10,
              background: '#7c3aed',
              boxShadow: '0 0 10px #7c3aed, 3px 0 0 #a855f7, 0 3px 0 #a855f7',
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: 'var(--font-pixel), VT323, monospace',
              fontSize: 36,
              color: '#a855f7',
              letterSpacing: '0.14em',
              textShadow: '0 0 16px rgba(168,85,247,0.5)',
            }}>
              TASKFORGE
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--font-pixel), VT323, monospace',
            fontSize: 15,
            color: 'rgba(168,85,247,0.4)',
            letterSpacing: '0.1em',
          }}>
            {'// RPG EDITION v1.0'}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#0e0e18',
          border: '2px solid #2d2d3d',
          boxShadow: '8px 8px 0 rgba(0,0,0,0.8)',
          padding: '28px 28px 24px',
        }}>
          {/* Title */}
          <div style={{
            fontFamily: 'var(--font-pixel), VT323, monospace',
            fontSize: 13,
            color: 'rgba(168,85,247,0.5)',
            letterSpacing: '0.12em',
            marginBottom: 4,
          }}>
            {'// ENTER WORLD'}
          </div>
          <div style={{
            fontFamily: 'var(--font-pixel), VT323, monospace',
            fontSize: 24,
            color: '#e8e8f0',
            letterSpacing: '0.08em',
            marginBottom: 20,
          }}>
            SIGN IN
          </div>

          <LoginForm />
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: 16,
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 14,
          color: 'rgba(255,255,255,0.15)',
          letterSpacing: '0.06em',
        }}>
          {'task & billing tracker for freelancers'}
        </div>
      </div>
    </div>
  );
}
