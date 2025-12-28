export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="relative">
        {/* Outer glowing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-brand-primary/30 animate-pulse" />

        {/* Spinning neon ring */}
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-brand-primary animate-spin"
             style={{
               boxShadow: '0 0 20px rgba(168, 85, 247, 0.5), inset 0 0 20px rgba(168, 85, 247, 0.1)',
               animationDuration: '1s'
             }}
        />

        {/* Inner glow dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-brand-primary animate-pulse"
               style={{ boxShadow: '0 0 15px rgba(168, 85, 247, 0.8), 0 0 30px rgba(168, 85, 247, 0.4)' }}
          />
        </div>
      </div>
    </div>
  );
}
