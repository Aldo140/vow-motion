"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <span>LET’S TRY THAT AGAIN</span>
      <h1>A small pause in the plans.</h1>
      <p>We couldn’t load this page. Your saved details are still here.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
