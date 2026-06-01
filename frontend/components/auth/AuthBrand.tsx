export function AuthBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <span
        className="mb-3 grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold text-white"
        style={{
          background: "linear-gradient(135deg, rgb(var(--accent)) 0%, rgba(var(--accent),0.7) 100%)",
          boxShadow: "0 6px 20px rgba(var(--accent),0.35)",
        }}
      >
        N
      </span>
      <div className="text-lg font-semibold">NeuroSpine Institute</div>
      <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
        {subtitle ?? "Voice Assistant Dashboard"}
      </div>
    </div>
  );
}
