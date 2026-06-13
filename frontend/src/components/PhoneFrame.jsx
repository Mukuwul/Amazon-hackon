export default function PhoneFrame({ children }) {
  return (
    <div className="stage-bg stage-grain min-h-[100dvh] w-full flex items-center justify-center gap-16 p-4 sm:p-8">
      {/* desktop-only brand rail — context that this is a layer inside Amazon */}
      <aside className="hidden lg:flex flex-col max-w-sm text-white/90">
        <div className="flex items-center gap-2 mb-7">
          <Leaf className="w-7 h-7 text-sl-green-soft" />
          <span className="font-display font-700 text-xl tracking-tight">Second Life</span>
        </div>
        <h1 className="font-display font-700 text-[2.6rem] leading-[1.05] tracking-tight">
          Every product finds its next&nbsp;best owner.
        </h1>
        <p className="mt-5 text-white/55 text-[15px] leading-relaxed">
          An intelligent layer inside the Amazon returns flow. AI delta-grades each item against its
          own day-0 photos, then routes it to the highest-rupee second life — before it ever reaches
          a warehouse.
        </p>
        <div className="mt-8 flex items-center gap-2 text-white/40 text-xs">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sl-green-soft animate-pulse" />
          Live demo · connected to the deployed grading engine
        </div>
      </aside>

      <div className="phone shrink-0">
        <div className="phone-screen">{children}</div>
      </div>
    </div>
  );
}

function Leaf({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 19c0-7 5-13 14-14 0 9-5 15-14 14Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 15c2.5-2.5 5-4 8-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
