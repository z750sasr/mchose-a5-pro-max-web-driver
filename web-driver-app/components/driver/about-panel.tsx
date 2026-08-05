export function AboutPanel() {
  return (
    <section className="tab-panel custom-about-panel" aria-label="About me">
      <iframe
        className="custom-about-frame"
        src="about-me.html"
        title="Custom About me content"
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </section>
  );
}
