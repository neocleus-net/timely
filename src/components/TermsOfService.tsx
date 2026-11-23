import type { Theme } from '../hooks/useTheme';
import { BrandLogo } from './BrandLogo';
import { Footer } from './Footer';

interface TermsOfServiceProps {
  theme: Theme;
  onToggleTheme: () => void;
  onBack: () => void;
  onOpenPrivacy: () => void;
}

export function TermsOfService({
  theme,
  onToggleTheme,
  onBack,
  onOpenPrivacy,
}: TermsOfServiceProps) {
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
            <h1>Terms of Service</h1>
            <p className="legal-updated">
              Effective Date: November 23, 2026 ·{' '}
              <a href="https://timely.neocleus.net">timely.neocleus.net</a>
            </p>
          </div>

          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Timely (
              <a href="https://timely.neocleus.net">timely.neocleus.net</a>), operated by{' '}
              <a href="https://neocleus.net" target="_blank" rel="noopener noreferrer">
                Neocleus
              </a>
              , you agree to be bound by these Terms of Service. If you do not agree, please do not
              use the service.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of Service</h2>
            <p>
              Timely is a lightweight web application for tracking time across projects and tasks,
              viewing daily/weekly/monthly summaries, estimating earnings from user-configured
              rates, and exporting time logs to CSV.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Account &amp; Acceptable Use</h2>
            <ul>
              <li>
                Access requires signing in with a valid Google account via Firebase Authentication.
              </li>
              <li>
                You are responsible for maintaining the security of your Google account and for all
                activity recorded under it.
              </li>
              <li>
                You agree not to misuse the service, attempt unauthorized access to other
                users&rsquo; data, or disrupt the underlying Firebase infrastructure.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Your Data &amp; Ownership</h2>
            <p>
              You retain full ownership of all projects, tasks, notes, and time entries you create
              in Timely. Our handling of your account and data is governed by our{' '}
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenPrivacy();
                }}
              >
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Disclaimer of Warranties</h2>
            <p>
              Timely is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis
              without warranties of any kind. Earnings figures and time calculations are provided
              for personal convenience and should be independently verified before invoicing or tax
              reporting.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Neocleus shall not be liable for any indirect,
              incidental, or consequential damages, including loss of data or revenue, arising from
              your use of Timely. We recommend exporting backups regularly via CSV.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Changes &amp; Contact</h2>
            <p>
              We may update these Terms of Service from time to time by posting the revised version
              on this page. For questions, contact Neocleus at{' '}
              <a href="mailto:rajivnayanc@neocleus.net">rajivnayanc@neocleus.net</a>.
            </p>
          </section>
        </article>
      </main>

      <Footer onOpenPrivacy={onOpenPrivacy} />
    </div>
  );
}
