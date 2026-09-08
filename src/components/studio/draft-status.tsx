export function DraftStatus({
  status,
  discard,
}: {
  status: string;
  discard: () => void;
}) {
  return (
    <div className="draft-status">
      <small role="status">{status}</small>
      <button type="button" className="text-link" onClick={discard}>
        Discard local draft
      </button>
    </div>
  );
}
