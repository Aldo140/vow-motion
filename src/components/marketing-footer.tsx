import { Brand } from "./ui";

/** One footer for every public page, so no page is a dead end. */
export default function MarketingFooter({
  line = "Made for the moments that bring us together.",
}: {
  line?: string;
}) {
  return (
    <footer className="marketing-footer">
      <Brand />
      <span>{line}</span>
      <nav aria-label="Footer">
        <a href="/planners">For planners</a>
        <a href="/experience">The film</a>
        <a href="/contact">Contact</a>
        <a href="/privacy">Privacy</a>
      </nav>
      <span>© {new Date().getFullYear()} Vow Motion</span>
    </footer>
  );
}
