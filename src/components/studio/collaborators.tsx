"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import { LockSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";

export function CollaboratorsManager({ data, mutate, notify }: PanelProps) {
  const [add, setAdd] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <PageHeading
        title="Good things take a team."
        description="Share your Studio with your partner, planner, or someone you trust."
      >
        <button className="button primary" onClick={() => setAdd(true)}>
          <PlusIcon size={17} />
          Add collaborator
        </button>
      </PageHeading>
      {!data.user.email_verified && !data.user.is_demo && (
        <Notice>
          To access weddings shared with your email,{" "}
          <a href="/verify">verify your email address</a>.
        </Notice>
      )}
      <div className="collaborator-list">
        <div className="collaborator">
          <span className="avatar">{data.user.name[0]}</span>
          <div>
            <b>{data.user.name}</b>
            <small>{data.user.email}</small>
          </div>
          <span className="status attending">{data.role}</span>
        </div>
        {data.collaborators.map((c) => (
          <div className="collaborator" key={c.id}>
            <span className="avatar">{c.email[0].toUpperCase()}</span>
            <div>
              <b>{c.email}</b>
              <small>Access after signing in with this email</small>
            </div>
            <span className="status">{c.role}</span>
            <button
              className="icon-button"
              aria-label={"Remove access for " + c.email}
              onClick={async () => {
                try {
                  await mutate("collaborators/" + c.id, undefined, "DELETE");
                  notify("Access removed.");
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              <TrashIcon size={17} />
            </button>
          </div>
        ))}
      </div>
      <div className="permission-notes">
        <LockSimpleIcon size={26} />
        <div>
          <h2>Just the right level of access.</h2>
          <p>
            <b>Partner</b> can manage the wedding, privacy, and team.{" "}
            <b>Planner</b> manages the guest experience and logistics.{" "}
            <b>Viewer</b> can read and export, but cannot make changes.
          </p>
          <p>
            Adding an email grants access; it does not send an invitation. Share
            the sign-in link with your collaborator.
          </p>
        </div>
      </div>
      {add && (
        <Modal
          title="Bring someone into your Studio"
          onClose={() => setAdd(false)}
        >
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await mutate(
                  "collaborators",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                setAdd(false);
                notify("Collaborator access added.");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Field label="Email address">
              <input type="email" name="email" required />
            </Field>
            <Field label="Role">
              <select name="role">
                <option value="partner">Partner</option>
                <option value="planner">Planner</option>
                <option value="viewer">Viewer</option>
              </select>
            </Field>
            <Submit>
              Add collaborator
              <Arrow />
            </Submit>
          </form>
        </Modal>
      )}
    </>
  );
}
