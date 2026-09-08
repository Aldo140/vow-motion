import { Arrow } from "./ui";

export default function PlannerAtelier() {
  return (
    <section
      className="planner-atelier"
      id="planners"
      tabIndex={-1}
      aria-labelledby="atelier-title"
    >
      <div className="atelier-section-label">
        <span>VOW MOTION / FOR PLANNERS</span>
        <span>A little order. A lot of possibility.</span>
      </div>
      <div className="planner-atelier-layout">
        <div className="planner-atelier-copy">
          <p className="planner-atelier-eyebrow">
            You make it feel effortless.
          </p>
          <h2 id="atelier-title">
            We make room
            <br />
            for <em>your vision.</em>
          </h2>
          <p>
            From the first invitation to the last reply, give every couple an
            experience that feels considered. Keep the people and plans behind
            it together in your Studio.
          </p>
          <a href="/planners" className="atelier-planner-link">
            Step inside the planner Studio <Arrow diagonal size={20} />
          </a>
          <span className="atelier-planner-footnote">
            Explore with a sample wedding.
          </span>
        </div>
        <div
          className="planner-dossier"
          role="img"
          aria-label="An illustrative wedding design dossier with a venue photograph, personal invitation and coordinated paper palette"
        >
          <div className="dossier-folder">
            <span>THE WEDDING OF</span>
            <b>Amélie &amp; Julien</b>
            <small>PROVENCE, FRANCE / MAISON</small>
            <i>01</i>
          </div>
          <figure className="dossier-venue depth-drift">
            <img src="/images/hero-maison.webp" alt="" loading="lazy" />
            <figcaption>Provence, France.</figcaption>
          </figure>
          <div className="dossier-invitation depth-drift">
            <span className="dossier-crest">
              A <i>&amp;</i> J
            </span>
            <small>THE PLEASURE OF YOUR COMPANY</small>
            <strong>
              Amélie
              <br />
              <i>&amp;</i>
              <br />
              Julien
            </strong>
            <span>19 JUIN 2027</span>
          </div>
          <div className="dossier-palette">
            <span>THE FINISHING TOUCHES</span>
            <div>
              <i />
              <i />
              <i />
            </div>
            <small>Paper. Colour. A point of view.</small>
          </div>
          <img
            className="dossier-silk"
            src="/images/invitation-silk.webp"
            alt=""
            loading="lazy"
          />
          <span className="dossier-caption">
            A sample wedding, beautifully in hand.
          </span>
        </div>
      </div>
      <div className="atelier-bottom-line">
        <span>THE ART IS YOURS.</span>
        <p>
          The invitations, the households, the details.
          <br />
          <em>All with a place to belong.</em>
        </p>
        <span>THE DETAILS HAVE A HOME.</span>
      </div>
    </section>
  );
}
