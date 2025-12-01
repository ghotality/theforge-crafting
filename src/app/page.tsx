import Link from 'next/link';

// Simple Icons components (SVG)
const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const ForkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3v12" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);


export default function Home() {
  return (
    <div className="min-h-screen text-zinc-100 selection:bg-orange-500/30 relative overflow-hidden">
      {/* Background Image Container */}
      <div className="fixed inset-0 -z-20">
         <img 
            src="/gamethumb.png"
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.4 }}
         />
      </div>
      
      {/* Overlays */}
      <div className="fixed inset-0 -z-10 bg-zinc-950/80" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50" />

      {/* Orange Glow Effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full opacity-30 -z-10" />

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center relative z-10">
        
        {/* Main Heading */}
        <h1 className="text-6xl md:text-8xl tracking-tighter mb-6 max-w-4xl mx-auto drop-shadow-2xl uppercase" style={{ fontFamily: 'var(--font-archivo-black), sans-serif' }}>
          <span className="bg-gradient-to-b from-white via-gray-200 to-gray-700 bg-clip-text text-transparent">
            The Forge
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-zinc-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-lg font-medium">
          Optimize your builds with our advanced calculator. <br />
          Discover ore traits, calculate odds, and forge the ultimate gear.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-16">
          <Link 
            href="/calculator"
            className="px-8 py-4 bg-orange-500 text-black font-bold rounded-sm hover:bg-orange-400 hover:scale-105 transition-all duration-200 shadow-[0_0_30px_-5px_rgba(249,115,22,0.5)]"
          >
            Start Crafting
          </Link>
        </div>

        {/* Credits Container - Vertical Layout */}
        <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
          
          {/* Developer */}
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <DiscordIcon className="w-5 h-5 text-zinc-400" />
             </div>
             <div className="text-left">
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-0.5">Developed by</div>
                <div className="text-zinc-200 font-semibold">
                   lrdd
                </div>
             </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Repo & Star */}
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <GithubIcon className="w-5 h-5 text-zinc-400" />
             </div>
             <div className="text-left">
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-0.5">Support the Project</div>
                <a href="https://github.com/ghotality/theforge-calculator" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-200 font-semibold hover:text-yellow-400 transition-colors">
                   <StarIcon className="w-4 h-4 text-yellow-500" /> Star on GitHub
                </a>
             </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Forked From */}
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <ForkIcon className="w-5 h-5 text-zinc-400" />
             </div>
             <div className="text-left">
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-0.5">Forked from</div>
                <a href="https://github.com/KamrynH-CS/theforge-calculator" target="_blank" rel="noopener noreferrer" className="text-zinc-200 font-semibold hover:text-blue-400 transition-colors text-sm">
                   KamrynH-CS/theforge-calculator
                </a>
                <div className="text-xs text-zinc-600 mt-0.5">by otakusonline</div>
             </div>
          </div>

        </div>

      </main>
    </div>
  );
}
