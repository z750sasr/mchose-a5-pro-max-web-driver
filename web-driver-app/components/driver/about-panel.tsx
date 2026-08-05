type AboutContent = {
  handle: string;
  initials: string;
  role: string;
  introduction: string;
  projectNote: string;
  links: ReadonlyArray<{ label: string; href: string }>;
};

export function AboutPanel({ content }: { content: AboutContent }) {
  return (
    <section className="tab-panel" aria-label="About the project author">
      <div className="section-heading">
        <div><span className="eyebrow">ABOUT ME / PROJECT AUTHOR</span><h2>Built for hardware that still deserves support.</h2></div>
        <p className="section-note">Edit this section in <code>lib/about-content.ts</code>.</p>
      </div>
      <div className="about-layout">
        <article className="about-profile">
          <div className="about-monogram" aria-hidden="true">{content.initials}</div>
          <div className="about-profile-copy">
            <span className="eyebrow">CREATOR</span>
            <h3>{content.handle}</h3>
            <strong>{content.role}</strong>
            <p>{content.introduction}</p>
          </div>
        </article>
        <article className="about-project">
          <span className="eyebrow">WHY THIS EXISTS</span>
          <h3>Open compatibility work.</h3>
          <p>{content.projectNote}</p>
          <div className="about-links">
            {content.links.map((link) => <a href={link.href} target="_blank" rel="noreferrer" key={link.href}>{link.label}<span>↗</span></a>)}
          </div>
        </article>
        <article className="about-principles">
          <span className="eyebrow">PROJECT PRINCIPLES</span>
          <div><strong>Local first</strong><p>Settings travel between this browser and the selected HID device.</p></div>
          <div><strong>Documented</strong><p>Hardware identities and command boundaries are recorded alongside the source.</p></div>
          <div><strong>Recovery aware</strong><p>Firmware flashing remains in the vendor updater, where recovery support exists.</p></div>
        </article>
      </div>
    </section>
  );
}
