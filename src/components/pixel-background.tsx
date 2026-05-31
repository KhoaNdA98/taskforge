function getDeterministicShadows(count: number, seed: number, colors: string[]) {
  const shadows: string[] = [];
  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-random number generator
    const xSeed = (seed + i * 12345) % 10000;
    const ySeed = (seed + i * 54321 + 99) % 10000;
    const colorIdx = (seed + i * 7) % colors.length;
    
    const x = (xSeed / 100).toFixed(2);
    const y = (ySeed / 100).toFixed(2);
    const color = colors[colorIdx];
    
    shadows.push(`${x}vw ${y}vh ${color}`);
    // Duplicate at +100vh for seamless looping translation
    shadows.push(`${x}vw ${(parseFloat(y) + 100).toFixed(2)}vh ${color}`);
  }
  return shadows.join(', ');
}

const colors = ['#ffde59', '#ff914d']; // Gold Accent & Arcade Orange
const layer1Shadows = getDeterministicShadows(60, 123, colors);
const layer2Shadows = getDeterministicShadows(30, 456, colors);

export function PixelBackground() {
  return (
    <div 
      className="fixed inset-0 w-full h-full bg-[#1e1e1e] overflow-hidden -z-10"
      aria-hidden="true"
    >
      {/* Layer 1 (Small particles, 4px) - 20s animation */}
      <div
        className="animate-pixel-slow"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '4px',
          height: '4px',
          boxShadow: layer1Shadows,
          willChange: 'transform',
        }}
      />
      
      {/* Layer 2 (Large particles, 6px) - 12s animation */}
      <div
        className="animate-pixel-fast"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '6px',
          height: '6px',
          boxShadow: layer2Shadows,
          willChange: 'transform',
        }}
      />
    </div>
  );
}
