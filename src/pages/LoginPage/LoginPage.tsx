import { LoginForm } from './LoginForm';
import { useLoginPage } from './LoginPage.logic';

export function LoginPage() {
  const { form, onSubmit } = useLoginPage();

  return (
    <>
      <style>{`
        @keyframes ring-pulse {
          0%   { transform: scale(1);    opacity: 0.5; }
          70%  { transform: scale(1.55); opacity: 0;   }
          100% { transform: scale(1.55); opacity: 0;   }
        }
        @keyframes ring-pulse-slow {
          0%   { transform: scale(1);    opacity: 0.3; }
          70%  { transform: scale(1.85); opacity: 0;   }
          100% { transform: scale(1.85); opacity: 0;   }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .login-ring-1 {
          animation: ring-pulse 2.8s ease-out infinite;
        }
        .login-ring-2 {
          animation: ring-pulse-slow 2.8s ease-out infinite 0.6s;
        }
        .login-fade-1 { animation: fade-up 0.5s ease both 0.1s; }
        .login-fade-2 { animation: fade-up 0.5s ease both 0.25s; }
        .login-fade-3 { animation: fade-up 0.5s ease both 0.4s; }
        .login-fade-4 { animation: fade-up 0.5s ease both 0.55s; }
      `}</style>

      <div
        className="w-[400px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/80"
        style={{ background: 'linear-gradient(160deg, #0c1a0e 0%, #080e09 50%, #050808 100%)' }}
      >
        {/* ── Logo section ───────────────────────────────── */}
        <div className="flex flex-col items-center px-8 pt-10 pb-6">

          {/* Rings + logo */}
          <div className="login-fade-1 relative flex items-center justify-center mb-7">
            {/* Animated pulse rings */}
            <span className="login-ring-1 absolute inset-0 rounded-full border border-primary/50" />
            <span className="login-ring-2 absolute inset-0 rounded-full border border-primary/30" />
            {/* Static ring */}
            <span className="absolute inset-[-6px] rounded-full border border-primary/20" />

            {/* Logo circle */}
            <div
              className="relative z-10 h-24 w-24 rounded-full p-[3px]"
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.4) 0%, rgba(21,128,61,0.15) 100%)' }}
            >
              <div className="h-full w-full rounded-full bg-black/70 flex items-center justify-center overflow-hidden p-2"
                style={{ boxShadow: '0 0 24px 4px rgba(34,197,94,0.15) inset' }}
              >
                <img
                  src="/cattleyaresortlogo.png"
                  alt="Cattleya Resort"
                  className="h-full w-full object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Resort name */}
          <div className="login-fade-2 flex flex-col items-center gap-0.5 mb-5">
            <h1
              className="text-3xl font-black uppercase text-white"
              style={{ letterSpacing: '0.22em', textShadow: '0 0 30px rgba(34,197,94,0.25)' }}
            >
              Cattleya
            </h1>
            <p
              className="text-xs font-semibold uppercase text-primary"
              style={{ letterSpacing: '0.45em' }}
            >
              Resort
            </p>
          </div>

          {/* Divider */}
          <div className="login-fade-3 flex items-center gap-3 w-full">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.12))' }} />
            <span className="text-[10px] font-medium uppercase text-white/30" style={{ letterSpacing: '0.2em' }}>
              Management System
            </span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.12))' }} />
          </div>
        </div>

        {/* ── Form section ───────────────────────────────── */}
        <div className="login-fade-4 px-8 pb-9">
          <LoginForm form={form} onSubmit={onSubmit} />
        </div>
      </div>
    </>
  );
}
