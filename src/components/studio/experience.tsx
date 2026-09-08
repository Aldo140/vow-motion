"use client";
import { useEffect, useRef, useState } from "react";
import { PageHeading, PreviewButton, type PanelProps } from "./shared";
import { Field } from "../ui";
import type { Wedding } from "@/lib/types";
import { worlds } from "@/lib/worlds";
import {
  withDesign,
  placements,
  designEqual,
  type Placement,
} from "@/lib/wedding-design";
import WeddingPhoto from "../wedding-photo";
import { useDesignDraft } from "./use-design-draft";
import { DesignPhotos } from "./design-photos";
import { OPENINGS } from "./opening-choices";
export { OPENINGS } from "./opening-choices";
type Props = PanelProps & {
  onSaved?: () => Promise<void>;
  onPreviewChange?: (value: Partial<Wedding>) => void;
};
export function ExperienceManager(props: Props) {
  return <DesignEditor key={props.data.wedding.id} {...props} />;
}
function DesignEditor(props: Props) {
  const { data } = props;
  const readOnly = data.role === "viewer";
  const model = useDesignDraft(data.wedding.id, data.user.email, readOnly);
  const [tab, setTab] = useState("Design");
  const editorRoot = useRef<HTMLDivElement>(null);
  const tabScroll = useRef<Record<string, number>>({});
  const goToTab = (next: string) => {
    if (next === tab) return;
    tabScroll.current[tab] = window.scrollY;
    setTab(next);
    requestAnimationFrame(() =>
      window.scrollTo(
        0,
        tabScroll.current[next] ??
          (editorRoot.current
            ? window.scrollY +
              editorRoot.current.getBoundingClientRect().top -
              20
            : 0),
      ),
    );
  };
  const [uploading, setUploading] = useState(false);
  const [viewport, setViewport] = useState("phone");
  const [reviewed, setReviewed] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<Placement>();
  const frame = useRef<HTMLIFrameElement>(null);
  const sideFrame = useRef<HTMLIFrameElement>(null);
  const frameMount = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(390);
  const design = model.draft;
  const previewWedding = design
    ? withDesign(data.wedding, design)
    : data.wedding;
  const serialized = JSON.stringify(design);
  useEffect(() => {
    if (tab !== "Preview" || !frameMount.current) return;
    const observer = new ResizeObserver((entries) =>
      setPreviewWidth(entries[0].contentRect.width),
    );
    observer.observe(frameMount.current);
    return () => observer.disconnect();
  }, [tab]);
  useEffect(() => {
    if (design) props.onPreviewChange?.(withDesign(data.wedding, design));
  }, [serialized, data.wedding, props.onPreviewChange]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setReviewed(false);
  }, [serialized]);
  const sendPreview = () => {
    for (const target of [frame.current, sideFrame.current])
      target?.contentWindow?.postMessage(
        { type: "vow-design-preview", design },
        window.location.origin,
      );
  };
  useEffect(() => {
    sendPreview();
  }, [serialized, tab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        ![
          frame.current?.contentWindow,
          sideFrame.current?.contentWindow,
        ].includes(event.source as Window)
      )
        return;
      if (event.data?.type === "vow-preview-ready") {
        sendPreview();
        return;
      }
      if (
        event.data?.type !== "vow-select-photo" ||
        !(event.data.placement in placements)
      )
        return;
      setSelectedPlacement(event.data.placement);
      goToTab("Photos");
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [serialized]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!design || !model.state)
    return (
      <section>
        <h1>Your experience</h1>
        <p role="status">{model.error || "Opening your saved design…"}</p>
        {model.error && (
          <button onClick={() => window.location.reload()}>Try again</button>
        )}
      </section>
    );
  const update = (next: typeof design) => {
    if (!readOnly) model.setDraft(next);
  };
  const liveDifferent = !designEqual(design, model.state.published);
  const publish = async () => {
    if (await model.publish()) {
      props.notify(
        data.wedding.status === "draft"
          ? "Design applied. Complete wedding setup when you are ready to invite guests."
          : "Your live invitation is up to date.",
      );
      await props.refresh();
      await props.onSaved?.();
    }
  };
  return (
    <div ref={editorRoot} className="design-editor">
      <PageHeading
        title="Make it feel like you."
        description={`Your experience for ${data.wedding.names}. Start with a finished design. Personalize only what you want.`}
      >
        <PreviewButton {...props} />
      </PageHeading>
      <nav className="design-navigation" aria-label="Experience editor">
        {["Design", "Photos", "Personal details", "Preview"].map((name) => (
          <button
            key={name}
            aria-pressed={tab === name}
            onClick={() => goToTab(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <div className="design-save-bar" role="status">
        <p>
          {readOnly
            ? "You have view-only access."
            : uploading
              ? "Photos still uploading. You can keep editing."
              : model.saving
                ? "Saving your changes…"
                : model.error
                  ? model.error
                  : model.dirty
                    ? "Changes are on this device. Saving online shortly."
                    : liveDifferent
                      ? "Draft saved. Guests still see the current version."
                      : "Your invitation is up to date."}
        </p>
        {model.error && (
          <button className="button outline small" onClick={model.retry}>
            Retry saving
          </button>
        )}
        {!readOnly && (
          <button
            className="button primary"
            disabled={
              model.saving || uploading || !!model.conflict || !!model.error
            }
            onClick={() => {
              goToTab("Preview");
              setReviewed(true);
            }}
          >
            Review your design
          </button>
        )}
      </div>
      {model.localWarning && <p role="status">{model.localWarning}</p>}
      {model.conflict && (
        <section className="pilot-panel" role="alert">
          <h2>This wedding was updated elsewhere.</h2>
          <p>
            Both versions are safe. Conflicting choices:{" "}
            {model.conflict.fields?.join(", ") ||
              "another editor saved while you were publishing"}
            .
          </p>
          <div className="design-frame-previews">
            {[
              { name: "Your draft", value: design },
              { name: "Saved elsewhere", value: model.conflict.state.draft },
            ].map((version) => (
              <section key={version.name}>
                <h3>{version.name}</h3>
                <p>
                  {worlds.find((w) => w.id === version.value.world)?.name} ·{" "}
                  {version.value.opening === "seal"
                    ? "Sealed envelope"
                    : "Invitation suite"}
                </p>
                <p>
                  {version.value.identity.monogram || "Your initials"} ·{" "}
                  {version.value.identity.typography} typography
                </p>
                <p>{version.value.story}</p>
                {(Object.keys(placements) as Placement[]).map((placement) => (
                  <figure key={placement}>
                    <WeddingPhoto
                      wedding={withDesign(data.wedding, version.value)}
                      placement={placement}
                      alt={placements[placement].name}
                    />
                    <figcaption>{placements[placement].name}</figcaption>
                  </figure>
                ))}
              </section>
            ))}
          </div>
          <button
            className="button outline"
            onClick={() => model.resolve(false)}
          >
            Use the saved version
          </button>
          <button
            className="button primary"
            onClick={() => model.resolve(true)}
          >
            Keep my changes in the draft
          </button>
        </section>
      )}
      <div className={tab === "Preview" ? "" : "design-workbench"}>
        <div>
          <div hidden={tab !== "Design"}>
            <fieldset
              disabled={readOnly}
              style={{ border: 0, padding: 0, minWidth: 0 }}
            >
              <div className="world-choice-grid">
                {worlds.map((world) => (
                  <button
                    key={world.id}
                    className={`world-choice world-${world.id} ${design.world === world.id ? "selected" : ""}`}
                    aria-pressed={design.world === world.id}
                    onClick={() => update({ ...design, world: world.id })}
                  >
                    <div>
                      <img src={world.image} alt={world.name + " design"} />
                      <h2>{world.name}</h2>
                    </div>
                    <h3>{world.name}</h3>
                    <p>{world.description}</p>
                    <span className="swatches">
                      {world.palette.map((color) => (
                        <i key={color} style={{ background: color }} />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
              <section className="opening-choice">
                <h2>How your invitation arrives.</h2>
                <div className="opening-choice-grid">
                  {OPENINGS.map((choice) => (
                    <button
                      key={choice.id}
                      className={`opening-option ${design.opening === choice.id ? "selected" : ""}`}
                      aria-pressed={design.opening === choice.id}
                      onClick={() => update({ ...design, opening: choice.id })}
                    >
                      <span className="opening-preview" aria-hidden="true">
                        {choice.preview}
                      </span>
                      <h3>{choice.name}</h3>
                      <p>{choice.description}</p>
                    </button>
                  ))}
                </div>
              </section>
            </fieldset>
            <div className="design-save-bar">
              <p>
                Your design is already complete. Add a personal photo or keep
                this look.
              </p>
              <button
                className="button outline"
                onClick={() => goToTab("Photos")}
              >
                Add your photos
              </button>
              <button
                className="button outline"
                onClick={() => goToTab("Preview")}
              >
                Keep this look
              </button>
            </div>
          </div>
          <div hidden={tab !== "Photos"}>
            <DesignPhotos
              selectedPlacement={selectedPlacement}
              wedding={previewWedding}
              design={design}
              update={update}
              assets={model.state.assets}
              setAssets={(assets) =>
                model.setState((state) =>
                  state ? { ...state, assets } : state,
                )
              }
              disabled={readOnly || data.user.is_demo}
              onUploading={setUploading}
            />
            {data.user.is_demo && (
              <p>
                Create your wedding to upload personal photos. This sample keeps
                its original artwork.
              </p>
            )}
          </div>
          <div hidden={tab !== "Personal details"}>
            <fieldset
              disabled={readOnly}
              className="pilot-panel"
              style={{ minWidth: 0 }}
            >
              <h2>The details that make it yours.</h2>
              <div className="form-grid">
                <Field
                  label="Couple monogram"
                  hint="Leave blank to use your initials."
                >
                  <input
                    maxLength={8}
                    value={design.identity.monogram}
                    onChange={(e) =>
                      update({
                        ...design,
                        identity: {
                          ...design.identity,
                          monogram: e.target.value,
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Typography">
                  <select
                    value={design.identity.typography}
                    onChange={(e) =>
                      update({
                        ...design,
                        identity: {
                          ...design.identity,
                          typography: e.target
                            .value as typeof design.identity.typography,
                        },
                      })
                    }
                  >
                    <option value="world">Original typography</option>
                    <option value="editorial">Editorial serif</option>
                    <option value="classic">Classic serif</option>
                    <option value="modern">Modern sans serif</option>
                  </select>
                </Field>
                <Field label="Accent colour">
                  <select
                    value={design.identity.accent}
                    onChange={(e) =>
                      update({
                        ...design,
                        identity: {
                          ...design.identity,
                          accent: e.target
                            .value as typeof design.identity.accent,
                        },
                      })
                    }
                  >
                    <option value="world">Original accent</option>
                    <option value="olive">Olive</option>
                    <option value="blue">Blue</option>
                    <option value="wine">Wine</option>
                  </select>
                </Field>
                <Field label="Planner attribution">
                  <input
                    maxLength={100}
                    value={design.identity.plannerName}
                    onChange={(e) =>
                      update({
                        ...design,
                        identity: {
                          ...design.identity,
                          plannerName: e.target.value,
                        },
                      })
                    }
                  />
                </Field>
                <label>
                  <input
                    type="checkbox"
                    checked={design.identity.showPlanner}
                    onChange={(e) =>
                      update({
                        ...design,
                        identity: {
                          ...design.identity,
                          showPlanner: e.target.checked,
                        },
                      })
                    }
                  />{" "}
                  Show planner attribution
                </label>
              </div>
              <Field label="Your story">
                <textarea
                  rows={6}
                  maxLength={10000}
                  value={design.story}
                  onChange={(e) => update({ ...design, story: e.target.value })}
                />
              </Field>
            </fieldset>
          </div>
          <div hidden={tab !== "Preview"}>
            <h2>See it through their eyes.</h2>
            <p>
              This is your design with sample guest details. Use Guest preview
              to check a particular household’s events.
            </p>
            <div className="design-navigation">
              <button
                aria-pressed={viewport === "phone"}
                onClick={() => setViewport("phone")}
              >
                Phone
              </button>
              <button
                aria-pressed={viewport === "desktop"}
                onClick={() => setViewport("desktop")}
              >
                Desktop
              </button>
            </div>
            {tab === "Preview" && (
              <div
                ref={frameMount}
                style={{
                  overflow: "hidden",
                  height:
                    850 *
                      Math.min(
                        1,
                        previewWidth / (viewport === "phone" ? 390 : 1440),
                      ) +
                    4,
                }}
              >
                <iframe
                  ref={frame}
                  title="Your draft invitation"
                  className="design-preview-window"
                  style={{
                    width: viewport === "phone" ? 390 : 1440,
                    maxWidth: "none",
                    height: 850,
                    transformOrigin: "top left",
                    transform: `scale(${Math.min(1, previewWidth / (viewport === "phone" ? 390 : 1440))})`,
                  }}
                  src={`/design-preview?wedding=${encodeURIComponent(data.wedding.id)}`}
                  onLoad={sendPreview}
                />
              </div>
            )}
            {!readOnly && (
              <div className="design-save-bar">
                <p>
                  {data.wedding.status === "draft"
                    ? "Apply this design to your wedding. Your invitation stays private until you finish setup and publish."
                    : "Guests keep their existing links. This updates only the design and sends no invitations."}
                </p>
                <button
                  className="button primary"
                  disabled={
                    model.saving ||
                    uploading ||
                    !!model.conflict ||
                    !!model.error
                  }
                  onClick={() => {
                    if (!reviewed) setReviewed(true);
                    else void publish();
                  }}
                >
                  {reviewed
                    ? data.wedding.status === "draft"
                      ? "Apply design and continue"
                      : "Update live invitation"
                    : "Ready to use this design"}
                </button>
              </div>
            )}
          </div>
        </div>
        {tab !== "Preview" && (
          <aside className="design-side-preview">
            <p>YOUR INVITATION, TAKING SHAPE</p>
            <iframe
              ref={sideFrame}
              title="Live draft design"
              src={`/design-preview?wedding=${encodeURIComponent(data.wedding.id)}`}
              onLoad={sendPreview}
            />
            <small>
              Open the invitation to explore. Change photo takes you straight to
              that placement.
            </small>
            <button
              className="button outline small"
              onClick={() => goToTab("Preview")}
            >
              Open larger preview
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}
