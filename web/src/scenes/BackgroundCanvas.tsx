/**
 * Minimal ambient background. No 3D canvas, no autonomous rotation.
 * Just a layered CSS/SVG gradient with subtle cyan wash.
 */
export function BackgroundCanvas() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Base black */}
      <div className="absolute inset-0 bg-black" />

      {/* Soft radial glow from center-bottom */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(900px 600px at 50% 100%, rgba(125,211,252,0.10), transparent 60%), radial-gradient(1400px 900px at 20% -10%, rgba(59,130,246,0.06), transparent 50%)',
        }}
      />

      {/* Horizon hairline */}
      <div className="absolute left-0 right-0 top-[62vh] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
