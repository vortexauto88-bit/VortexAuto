/**
 * Stylized SVG representation of a Kampas Ganda (auto-clutch spider)
 * and Kampas Rem (brake shoe). Used as product illustrations while
 * real product photos are not yet wired up.
 */
export function ClutchSpider({ className = '', tint = '#7dd3fc' }: { className?: string; tint?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className}>
      <defs>
        <radialGradient id="cs-metal" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="55%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#1f2937" />
        </radialGradient>
        <linearGradient id="cs-friction" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d4b896" />
          <stop offset="100%" stopColor="#8b6b3d" />
        </linearGradient>
        <radialGradient id="cs-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={tint} stopOpacity="0.25" />
          <stop offset="100%" stopColor={tint} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Glow */}
      <circle cx="100" cy="100" r="95" fill="url(#cs-glow)" />
      {/* Three clutch shoes (pie segments) */}
      {[0, 120, 240].map((rot) => (
        <g key={rot} transform={`rotate(${rot} 100 100)`}>
          <path
            d="M100,100 L100,12 A88,88 0 0,1 176,56 Z"
            fill="url(#cs-friction)"
            stroke="#2a1b0c"
            strokeWidth="0.8"
            opacity="0.95"
          />
          <path
            d="M100,100 L100,20 A80,80 0 0,1 169,60 Z"
            fill="url(#cs-metal)"
            opacity="0.35"
          />
        </g>
      ))}
      {/* Center hub */}
      <circle cx="100" cy="100" r="26" fill="url(#cs-metal)" />
      <circle cx="100" cy="100" r="26" fill="none" stroke={tint} strokeOpacity="0.5" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="10" fill="#0b1220" />
      {/* Spline teeth */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const x1 = 100 + Math.cos(a) * 10;
        const y1 = 100 + Math.sin(a) * 10;
        const x2 = 100 + Math.cos(a) * 14;
        const y2 = 100 + Math.sin(a) * 14;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9ca3af" strokeWidth="0.8" />;
      })}
      {/* Mounting bolts */}
      {[45, 135, 225, 315].map((a) => {
        const x = 100 + Math.cos((a * Math.PI) / 180) * 60;
        const y = 100 + Math.sin((a * Math.PI) / 180) * 60;
        return <circle key={a} cx={x} cy={y} r="3.5" fill="#111827" stroke="#9ca3af" strokeWidth="0.4" />;
      })}
      {/* Edge ring */}
      <circle cx="100" cy="100" r="88" fill="none" stroke="#374151" strokeWidth="1" />
      <circle cx="100" cy="100" r="92" fill="none" stroke={tint} strokeOpacity="0.25" strokeWidth="0.6" />
    </svg>
  );
}

export function BrakeShoe({ className = '', tint = '#7dd3fc' }: { className?: string; tint?: string }) {
  return (
    <svg viewBox="0 0 220 160" className={className}>
      <defs>
        <linearGradient id="bs-metal" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="bs-friction" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b7a47a" />
          <stop offset="100%" stopColor="#7a6239" />
        </linearGradient>
        <radialGradient id="bs-glow" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor={tint} stopOpacity="0.18" />
          <stop offset="100%" stopColor={tint} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="220" height="160" fill="url(#bs-glow)" />
      {/* Backing plate (arc) */}
      <path
        d="M20,120 Q110,10 200,120 L180,130 Q110,40 40,130 Z"
        fill="url(#bs-metal)"
        stroke="#1f2937"
        strokeWidth="1"
      />
      {/* Friction material */}
      <path
        d="M40,130 Q110,40 180,130 L175,138 Q110,54 45,138 Z"
        fill="url(#bs-friction)"
        stroke="#3b2b14"
        strokeWidth="0.6"
      />
      {/* Rivets */}
      {[55, 90, 130, 165].map((x) => (
        <circle key={x} cx={x} cy={50 + (x === 110 ? -5 : Math.abs(x - 110) * 0.3)} r="2" fill="#1f2937" />
      ))}
      {/* Mount hole */}
      <circle cx="30" cy="122" r="5" fill="#0b1220" stroke="#9ca3af" strokeWidth="0.6" />
      <circle cx="190" cy="122" r="5" fill="#0b1220" stroke="#9ca3af" strokeWidth="0.6" />
      {/* Edge glow */}
      <path
        d="M20,120 Q110,10 200,120"
        fill="none"
        stroke={tint}
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />
    </svg>
  );
}
