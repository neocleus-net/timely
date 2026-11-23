import type { Theme } from '../hooks/useTheme';
import { BrandLogo } from './BrandLogo';
import { Footer } from './Footer';

interface PrivacyPolicyProps {
  theme: Theme;
  onToggleTheme: () => void;
  onBack: () => void;
  onOpenTerms: () => void;
}

export function PrivacyPolicy({
  theme,
  onToggleTheme,
  onBack,
  onOpenTerms,
}: PrivacyPolicyProps) {
  return (
    <div className="auth-page">
      <header className="topbar">
        <div className="topbar-left">
          <a
            href="/"
            className="brand-link"
            onClick={(e) => {
              e.preventDefault();
              onBack();
            }}
          >
            <BrandLogo size={26} />
            <span className="brand">Timely</span>
          </a>
        </div>

        <div className="topbar-right">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onBack}>
            ← Back to App
          </button>
        </div>
      </header>

      <main className="legal-shell">
        <article className="panel-card legal-card">
          <div className="legal-header">
            <h1>Privacy Policy</h1>
            <p className="legal-updated">
              Effective Date: November 23, 2026 ·{' '}
              <a href="https://timely.neocleus.net">timely.neocleus.net</a>
            </p>
          </div>

          <section className="legal-section">
            <h2>1. Overview</h2>
            <p>
              Timely (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;), a product by{' '}
              <a href="https://neocleus.net" target="_blank" rel="noopener noreferrer">
                Neocleus
              </a>
              , is a minimal time tracking web application. We respect your privacy and collect
              only the minimum data required to authenticate you and store your time tracking
              records.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <ul>
              <li>
                <strong>Google Account Information:</strong> When you sign in with Google via
                Firebase Authentication, we receive your unique user ID, email address, display
                name, and profile photo URL solely to identify your account and display your
                session in the app.
              </li>
              <li>
                <strong>Time Tracking Data:</strong> Projects, tasks, optional billing rates
                (USD/INR), time entries, timestamps, and session notes that you explicitly create
                inside Timely.
              </li>
              <li>
                <strong>Local Preferences:</strong> Your Light/Dark theme preference is stored
                locally in your browser&rsquo;s <code>localStorage</code>.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How Your Data Is Stored &amp; Protected</h2>
            <p>
              Your time tracking data is stored in Google Cloud Firestore under your private user
              namespace (<code>users/&lt;your-uid&gt;</code>) and protected by strict Firestore
              Security Rules so that only your authenticated Google account can read or modify your
              records. All traffic between your browser and Firebase is encrypted over HTTPS.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Data Sharing &amp; Third Parties</h2>
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal information or time
              tracking records. We do not use third-party advertising networks. Your data is
              processed solely by Google Firebase (Authentication, Cloud Firestore, and Firebase
              Hosting) to operate the service.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Data Export &amp; Deletion</h2>
            <p>
              You can export your time entries at any time using the built-in{' '}
              <strong>Export CSV</strong> feature, and you can delete individual time entries
              directly in the app. To request complete deletion of your account and all stored
              data, email us at{' '}
              <a href="mailto:rajivnayanc@neocleus.net">rajivnayanc@neocleus.net</a> from your
              registered Google email address.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any updates will be posted on
              this page with a revised effective date.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact Neocleus at{' '}
              <a href="mailto:rajivnayanc@neocleus.net">rajivnayanc@neocleus.net</a>.
            </p>
          </section>
        </article>
      </main>

      <Footer onOpenTerms={onOpenTerms} />
    </div>
  );
}
