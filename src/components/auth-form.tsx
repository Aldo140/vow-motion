"use client";
import Link from "next/link";
import { useState } from "react";
import { Brand, Arrow, Field, Submit, Notice, DemoButton, api } from "./ui";
import { WeddingBeginning } from "./wedding-beginning";
import { trackMomentum } from "@/lib/momentum-telemetry-client";
export default function AuthForm({
  register = false,
  setup = false,
  notice = "",
}: {
  register?: boolean;
  setup?: boolean;
  notice?: string;
}) {
  const [begin, setBegin] = useState(setup),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (begin) return <WeddingBeginning />;
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
          <h1>{register ? "Let’s make it yours." : "Welcome back."}</h1>
          <p>
            {register
              ? "Your wedding, your people, one beautiful place."
              : "Your people. Your plans. Right where you left them."}
          </p>
          {notice && <Notice>{notice}</Notice>}
          {error && <Notice error>{error}</Notice>}
          {!register && (
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
                await api(
                  "/api/auth/" + (register ? "register" : "login"),
                  "POST",
                  Object.fromEntries(form),
                );
                if (register) {
                  trackMomentum("onboarding_step_completed", {
                    screen: "onboarding",
                    step: "account",
                  });
                  setBegin(true);
                } else window.location.href = "/admin";
              } catch (cause) {
                setError((cause as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
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
                autoComplete={register ? "new-password" : "current-password"}
              />
            </Field>
            <Submit pending={busy}>
              {register ? "Create your account" : "Sign in"}
              <Arrow />
            </Submit>
          </form>
          <p className="auth-switch">
            {register ? "Already have a Studio?" : "New to Vow Motion?"}{" "}
            <Link href={register ? "/login" : "/start"}>
              {register ? "Sign in" : "Begin your story"}
            </Link>
          </p>
          <div className="or-line">or take a look around</div>
          <DemoButton className="button outline full">
            Try a private demo
          </DemoButton>
        </div>
        <small>
          Your guest details stay private.{" "}
          <Link href="/privacy">Read our privacy information</Link>
        </small>
      </div>
    </main>
  );
}
