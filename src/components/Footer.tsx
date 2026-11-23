export function Footer() {
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
            Contact Us:{' '}
            <a href="mailto:rajivnayanc@neocleus.net">rajivnayanc@neocleus.net</a>
          </div>
          <div className="footer-copy">© 2026 Neocleus. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
