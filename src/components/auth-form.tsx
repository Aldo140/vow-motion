"use client";
import Link from "next/link";
import { TimezoneField } from "./timezone-field";
import { useState } from "react";
import { Brand, Arrow, Field, Submit, Notice, DemoButton, api } from "./ui";
import { worlds } from "@/lib/worlds";
export default function AuthForm({
  register = false,
  setup = false,
  notice = "",
}: {
  register?: boolean;
  setup?: boolean;
  notice?: string;
}) {
  const [step, setStep] = useState(setup ? 1 : 0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [world, setWorld] = useState("riviera");
  return (
    <main id="main" className="auth-layout">
      <div className="auth-art">
        <img
          src="/images/riviera.webp"
          alt="The shore of Lake Como in afternoon light"
        />
        <Brand light />
        <div>
          <span>YOUR STORY STARTS HERE</span>
          <h2>
            Make room
            <br />
            for <em>your people.</em>
          </h2>
        </div>
      </div>
      <div className="auth-content">
        <Link href="/" className="back-link">
          ← Back to Vow Motion
        </Link>
        <div className="auth-inner">
          <p className="eyebrow">
            {register ? "A BEAUTIFUL BEGINNING" : "YOUR WEDDING STUDIO"}
          </p>
          <h1>
            {step === 1
              ? "Tell us about your day."
              : register
                ? "Let’s make it yours."
                : "Welcome back."}
          </h1>
          <p>
            {step === 1
              ? "A few details, and your own world begins."
              : register
                ? "Your wedding, your people, one beautiful place."
                : "Your people. Your plans. Right where you left them."}
          </p>
          {notice && <Notice>{notice}</Notice>}
          {error && <Notice error>{error}</Notice>}
          {!register && !setup && (
            <p>
              <Link href="/recover" className="text-link">
                Forgot your password?
              </Link>
            </p>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const form = new FormData(e.currentTarget);
              try {
                if (step === 1) {
                  const result = await api("/api/weddings", "POST", {
                    names: form.get("names"),
                    date: form.get("date"),
                    location: form.get("location"),
                    timezone: form.get("timezone"),
                    world,
                  });
                  localStorage.setItem("vow-wedding", result.id);
                  window.location.href = "/studio";
                } else {
                  await api(
                    "/api/auth/" + (register ? "register" : "login"),
                    "POST",
                    Object.fromEntries(form),
                  );
                  if (register) setStep(1);
                  else window.location.href = "/studio";
                }
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {step === 0 ? (
              <>
                {register && (
                  <Field label="Your name">
                    <input
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Elena"
                    />
                  </Field>
                )}
                <Field label="Email address">
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </Field>
                <Field
                  label="Password"
                  hint={register ? "At least 10 characters." : ""}
                >
                  <input
                    name="password"
                    type="password"
                    minLength={10}
                    required
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                  />
                </Field>
                <Submit pending={busy}>
                  {register ? "Create your account" : "Sign in"}
                  <Arrow />
                </Submit>
              </>
            ) : (
              <>
                <Field label="Your names">
                  <input name="names" required placeholder="Elena & Matteo" />
                </Field>
                <div className="form-grid">
                  <Field label="Wedding date">
                    <input
                      name="date"
                      type="date"
                      required
                      min={new Date().toISOString().slice(0, 10)}
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      name="location"
                      required
                      placeholder="Lake Como, Italy"
                    />
                  </Field>
                </div>
                <TimezoneField label="Wedding timezone" />
                <fieldset className="world-pick">
                  <legend>Choose your design world</legend>
                  {worlds.map((w) => (
                    <label
                      key={w.id}
                      className={world === w.id ? "selected" : ""}
                    >
                      <input
                        type="radio"
                        name="world"
                        value={w.id}
                        checked={world === w.id}
                        onChange={() => setWorld(w.id)}
                      />
                      <img src={w.image} alt="" />
                      <span>{w.name}</span>
                    </label>
                  ))}
                </fieldset>
                <Submit pending={busy}>
                  Create your wedding
                  <Arrow />
                </Submit>
              </>
            )}
          </form>
          {step === 0 && (
            <>
              <p className="auth-switch">
                {register ? "Already have a Studio?" : "New to Vow Motion?"}{" "}
                <a href={register ? "/login" : "/start"}>
                  {register ? "Sign in" : "Begin your story"}
                </a>
              </p>
              <div className="or-line">or take a look around</div>
              <DemoButton className="button outline full">
                Try a private demo
              </DemoButton>
            </>
          )}
        </div>
        <small>
          Your guest details stay private.{" "}
          <a href="/privacy">Read our privacy information</a>
        </small>
      </div>
    </main>
  );
}
