import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-px-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-1.5">
            <div style={{ width:10,height:10,flexShrink:0,background:'#7c3aed',
              boxShadow:'0 0 10px #7c3aed,3px 0 0 #a855f7,0 3px 0 #a855f7' }} />
            <span className="font-pixel text-[38px] text-px-purple tracking-[0.14em]"
                  style={{ textShadow:'0 0 16px rgba(168,85,247,0.5)' }}>
              TASKFORGE
            </span>
          </div>
          <div className="font-pixel text-[15px] text-px-purple/35 tracking-[0.1em]">
            {'// RPG EDITION v1.0'}
          </div>
        </div>

        {/* Panel */}
        <div className="bg-px-card border-2 border-px-border shadow-hard-lg p-7">
          <div className="font-pixel text-[12px] text-px-purple/45 tracking-[0.12em] mb-1">{'// ENTER WORLD'}</div>
          <div className="font-pixel text-[24px] text-[#e8e8f0] tracking-[0.08em] mb-5">SIGN IN</div>
          <LoginForm />
        </div>

        <div className="text-center mt-4 font-pixel text-[13px] text-white/15 tracking-[0.04em]">
          task &amp; billing tracker for freelancers
        </div>
      </div>
    </div>
  );
}
