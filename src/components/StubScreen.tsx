export function StubScreen({ name }: { name: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 px-screen text-center">
      <p className="font-display text-2xl uppercase tracking-wide text-ink">
        {name}
      </p>
      <p className="text-sm text-ink-dim">{name} — coming in Phase 1</p>
    </div>
  );
}
