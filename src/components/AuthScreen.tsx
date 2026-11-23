import { USE_EMULATORS } from '../lib/firebase';
import type { Theme } from '../hooks/useTheme';
import { BrandLogo } from './BrandLogo';
import { Footer } from './Footer';

interface AuthScreenProps {
  signingIn: boolean;
  error: string | null;
  theme: Theme;
  onToggleTheme: () => void;
  onSignIn: () => Promise<void>;
}

export function AuthScreen({
  signingIn,
  error,
  theme,
  onToggleTheme,
  onSignIn,
}: AuthScreenProps) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
        <div className="auth-badge-row">
          {USE_EMULATORS && <span className="env-pill env-local">Local Emulators</span>}
          <button
            type="button"
            className="btn btn-ghost btn-xs theme-toggle-push"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </div>

        <div className="auth-hero">
          <BrandLogo size={44} />
          <div>
            <h1 className="auth-title">Timely</h1>
            <p className="auth-subtitle">
              Track multiple projects, concurrent tasks &amp; real-time earnings.
            </p>
          </div>
        </div>

        <div className="auth-feature-pills">
          <span className="feature-pill">✦ Concurrent Timers</span>
          <span className="feature-pill">✦ Live USD &amp; INR</span>
          <span className="feature-pill">✦ Daily · Weekly · Monthly</span>
        </div>

        <button
          type="button"
          className="btn btn-google"
          onClick={onSignIn}
          disabled={signingIn}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="google-icon"
          >
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
            />
            <path
              fill="#34A853"
              d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"
            />
            <path
              fill="#EA4335"
              d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          <span>{signingIn ? 'Signing in…' : 'Continue with Google'}</span>
        </button>

        {error && <p className="error-banner">{error}</p>}

        {USE_EMULATORS && (
          <p className="auth-hint">
            Running against local Firebase Auth Emulator (<code>127.0.0.1:9099</code>).
            Clicking above opens the local Google account picker.
          </p>
        )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
