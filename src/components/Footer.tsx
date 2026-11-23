interface FooterProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export function Footer({ onOpenPrivacy, onOpenTerms }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand-block">
          <a
            href="https://neocleus.net"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-brand"
          >
            NEOCLEUS
          </a>
          <p className="footer-tagline">
            We focus on building neat, lightweight digital products including online utilities and
            spelling puzzles.
          </p>
        </div>

        <div className="footer-meta-block">
          <div className="footer-contact">
            <a
              href="/privacy"
              onClick={(e) => {
                if (onOpenPrivacy) {
                  e.preventDefault();
                  onOpenPrivacy();
                }
              }}
            >
              Privacy Policy
            </a>
            {' · '}
            <a
              href="/terms"
              onClick={(e) => {
                if (onOpenTerms) {
                  e.preventDefault();
                  onOpenTerms();
                }
              }}
            >
              Terms of Service
            </a>
            {' · '}
            Contact Us:{' '}
            <a href="mailto:rajivnayanc@neocleus.net">rajivnayanc@neocleus.net</a>
          </div>
          <div className="footer-copy">© 2026 Neocleus. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
