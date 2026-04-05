type Props = {
  signedIn: boolean;
  onSignInClick: () => void;
  onCreateClick: () => void;
  onLogoClick: () => void;
};

export function SiteHeader({ signedIn, onSignInClick, onCreateClick, onLogoClick }: Props) {
  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <button type="button" className="brand" onClick={onLogoClick} aria-label="MyBookTimeZon home">
          <span className="brand__mark" aria-hidden>
            MB
          </span>
          <span>MyBookTimeZon</span>
        </button>
        <nav className="nav-actions" aria-label="Main">
          <a href="#for-business">For your business</a>
          <a href="#for-customers">For customers</a>
          <a href="#how-it-works">How it works</a>
          {signedIn ? (
            <a href="#account" className="btn btn--primary btn--small" style={{ textAlign: "center" }}>
              My account
            </a>
          ) : (
            <>
              <button type="button" className="btn btn--ghost btn--small" onClick={onSignInClick}>
                Sign in
              </button>
              <button type="button" className="btn btn--primary btn--small" onClick={onCreateClick}>
                Create free account
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
