import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-outfit text-koda-charcoal overflow-x-hidden">

      {/* ===== NAVIGATION ===== */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-koda-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/koda/koda.png" alt="Koda" width={40} height={40} className="object-contain" />
            <span className="font-bold text-xl tracking-tight">Koda</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-koda-charcoal/60">
            <a href="#features" className="hover:text-koda-bear transition-colors">Features</a>
            <a href="#design" className="hover:text-koda-bear transition-colors">Design</a>
            <a href="#proof" className="hover:text-koda-bear transition-colors">Use Cases</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-koda-charcoal/60 hover:text-koda-charcoal transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/signup" className="bg-koda-bear text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition-all shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== 1. HERO SECTION ===== */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-28 md:pt-32 md:pb-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              Stop fighting your calendar.{" "}
              <span className="text-koda-bear">Start negotiating</span> your week.
            </h1>
            <p className="text-lg md:text-xl text-koda-charcoal/60 leading-relaxed max-w-lg">
              Life doesn't happen in checkboxes. Koda is the assistant that understands your "low-energy" Tuesdays, your sudden meetings, and those 3 AM bursts of genius.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="bg-koda-bear text-white font-bold px-8 py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-sm text-center">
                Sync Your First Week
              </Link>
              <a href="#features" className="border border-koda-border text-koda-charcoal font-bold px-8 py-4 rounded-xl hover:bg-koda-charcoal/5 transition-all text-center">
                Meet the Bear
              </a>
            </div>
          </div>

          {/* Visual: Koda + Floating Weekly Grid */}
          <div className="relative flex justify-center items-center">
            {/* Ambient glow */}
            <div className="absolute w-80 h-80 bg-koda-bear/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col items-center">
              <Image src="/koda/koda.png" alt="Koda Mascot" width={280} height={280} priority className="object-contain drop-shadow-lg" />

              {/* Floating Weekly Grid Card */}
              <div className="absolute -right-4 top-4 md:-right-16 md:top-8 border-card p-4 shadow-lg w-52 animate-float">
                <p className="text-[10px] font-bold uppercase tracking-widest text-koda-bear mb-3">Weekly Grid</p>
                <div className="space-y-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
                    <div key={day} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-koda-charcoal/40 w-7">{day}</span>
                      <div className={`h-2 rounded-full transition-all ${
                        i === 3 ? "w-8 bg-koda-bear/30" : i === 4 ? "w-16 bg-koda-bear" : `bg-koda-charcoal/10`
                      }`} style={{ width: i === 3 ? undefined : i === 4 ? undefined : `${(i + 2) * 12}px` }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* "Trace" Animation: Task card moving */}
              <div className="absolute -left-8 bottom-16 md:-left-20 md:bottom-24 border-card p-3 shadow-md w-44 animate-trace">
                <p className="text-[10px] font-bold text-koda-charcoal/40 mb-1">Rescheduled</p>
                <p className="text-xs font-bold text-koda-charcoal">Deploy API v2</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[9px] line-through text-status-skipped">Thu 2PM</span>
                  <span className="text-[9px] text-koda-charcoal/30">→</span>
                  <span className="text-[9px] font-bold text-status-done">Fri 10AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. STRUGGLE SECTION ===== */}
      <section className="bg-koda-surface py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              We know your days aren't <span className="text-koda-bear">linear</span>.
            </h2>
            <p className="text-lg text-koda-charcoal/60 leading-relaxed">
              You planned the perfect Monday, but the server went down. You planned a deep-work Wednesday, but your brain stayed in bed. Most apps call that a "failure."
            </p>
            <p className="text-xl font-bold text-koda-bear mt-4">Koda calls that "Tuesday."</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="border-card p-8 relative overflow-hidden group hover:border-koda-bear/30 transition-all">
              <div className="absolute -top-2 -right-2 text-6xl opacity-5 font-black text-koda-bear select-none">01</div>
              <div className="w-10 h-10 rounded-xl bg-status-skipped/10 flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-status-skipped" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
              </div>
              <h3 className="font-bold text-lg mb-2">The "Server Down" Monday</h3>
              <p className="text-sm text-koda-charcoal/60 leading-relaxed">
                Your meticulously planned sprint gets torpedoed by an outage. Traditional apps don't care. Koda reschedules your blocks around the chaos.
              </p>
            </div>

            {/* Card 2 */}
            <div className="border-card p-8 relative overflow-hidden group hover:border-koda-bear/30 transition-all">
              <div className="absolute -top-2 -right-2 text-6xl opacity-5 font-black text-koda-bear select-none">02</div>
              <div className="w-10 h-10 rounded-xl bg-status-deferred/10 flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-status-deferred" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>
              </div>
              <h3 className="font-bold text-lg mb-2">The "Brain in Bed" Wednesday</h3>
              <p className="text-sm text-koda-charcoal/60 leading-relaxed">
                Some days you just don't have it. Koda lets you defer guilt-free and surgically relocates the work to when your energy returns.
              </p>
            </div>

            {/* Card 3 */}
            <div className="border-card p-8 relative overflow-hidden group hover:border-koda-bear/30 transition-all">
              <div className="absolute -top-2 -right-2 text-6xl opacity-5 font-black text-koda-bear select-none">03</div>
              <div className="w-10 h-10 rounded-xl bg-mood-hyped/10 flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-mood-hyped" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
              <h3 className="font-bold text-lg mb-2">The "3 AM Genius" Burst</h3>
              <p className="text-sm text-koda-charcoal/60 leading-relaxed">
                Inspiration doesn't follow a 9-to-5. Koda adapts to your actual rhythm, not the one you pretend you have.
              </p>
            </div>
          </div>

          <p className="text-center mt-12 text-koda-charcoal/40 italic text-sm">It's not a todo list. It's a conversation.</p>
        </div>
      </section>

      {/* ===== 3. FEATURES: THE ADAPTIVE OPERATOR ===== */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Left: Feature Copy */}
            <div className="space-y-8">
              <p className="text-xs font-bold uppercase tracking-widest text-koda-bear">The Adaptive Operator</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                The assistant that{" "}
                <span className="relative">
                  <span className="relative z-10">"Leaves a Trace."</span>
                  <span className="absolute bottom-0 left-0 w-full h-2 bg-koda-bear/20 -z-0" />
                </span>
              </h2>
              <p className="text-lg text-koda-charcoal/60 leading-relaxed">
                When you skip a task, Koda doesn't just nag you. He surgically reschedules it into a gap that actually fits your rhythm. He blocks out your "Deep Work" windows and respects your recurring life blocks—like gym sessions or university classes.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-koda-bear/10 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-5 h-5 text-koda-bear" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Energy-Aware Scheduling</h4>
                    <p className="text-sm text-koda-charcoal/60">Prioritizes deep work when you're sharpest, light tasks when you're winding down.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-koda-bear/10 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-5 h-5 text-koda-bear" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Contextual Negotiation</h4>
                    <p className="text-sm text-koda-charcoal/60">Chat with Koda to scope goals into realistic milestones—not arbitrary deadlines.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Koda Thinking + Interaction Preview */}
            <div className="relative flex justify-center">
              <div className="absolute w-72 h-72 bg-koda-bear/5 rounded-full blur-3xl" />
              <div className="relative z-10 space-y-4 w-full max-w-sm">
                {/* Simulated Negotiation UI */}
                <div className="border-card p-5 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <Image src="/koda/koda_thinking.png" alt="Koda Thinking" width={40} height={40} className="object-contain" />
                    <div>
                      <p className="font-bold text-sm">Koda is recalculating...</p>
                      <p className="text-[10px] text-koda-charcoal/40">Adjusting your Friday</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="koda-bubble text-xs">I moved "Deploy API" to Friday 10 AM. Your Thursday was overloaded and you're sharpest in the morning.</div>
                  </div>
                </div>

                {/* Mini Task Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-card p-3 border-l-4 border-l-koda-bear">
                    <p className="text-[10px] font-bold text-koda-charcoal/40 uppercase">Deep</p>
                    <p className="text-xs font-bold mt-1">API Refactor</p>
                    <span className="status-badge bg-status-done/10 border-status-done/20 text-status-done mt-2 inline-block">Done</span>
                  </div>
                  <div className="border-card p-3 border-l-4 border-l-status-deferred">
                    <p className="text-[10px] font-bold text-koda-charcoal/40 uppercase">Medium</p>
                    <p className="text-xs font-bold mt-1">Write Tests</p>
                    <span className="status-badge bg-status-deferred/10 border-status-deferred/20 text-status-deferred mt-2 inline-block">Deferred</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. DESIGN: STUDIO WHITE ===== */}
      <section id="design" className="bg-koda-surface py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-koda-bear mb-4">Studio White Aesthetic</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Designed for Focus.</h2>
            <p className="text-lg text-koda-charcoal/60 leading-relaxed">
              No neon distractions. No heavy shadows. Just a warm, bone-white workspace designed to lower your cortisol and help you think.
            </p>
          </div>

          {/* Palette Showcase */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
            {[
              { name: "Bear Brown", color: "bg-koda-bear", hex: "#D29B5D" },
              { name: "Charcoal", color: "bg-koda-charcoal", hex: "#1A1A1A" },
              { name: "Olive Done", color: "bg-status-done", hex: "#708238" },
              { name: "Terracotta", color: "bg-status-skipped", hex: "#B35D4D" },
              { name: "Slate Blue", color: "bg-status-deferred", hex: "#5F7A8C" },
            ].map((swatch) => (
              <div key={swatch.name} className="border-card p-4 text-center group hover:shadow-md transition-all">
                <div className={`w-full h-16 rounded-lg ${swatch.color} mb-3`} />
                <p className="text-xs font-bold">{swatch.name}</p>
                <p className="text-[10px] text-koda-charcoal/40 font-mono">{swatch.hex}</p>
              </div>
            ))}
          </div>

          {/* Component Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TaskCard Preview */}
            <div className="border-card p-5 border-l-4 border-l-koda-bear hover:shadow-md transition-all">
              <p className="text-[10px] uppercase tracking-wider text-koda-charcoal/40 mb-1">Attendance App</p>
              <h4 className="text-sm font-bold text-koda-charcoal mb-3">Build login screen with biometrics</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-koda-charcoal/60 uppercase tracking-wider">Deep • 3h</span>
                <span className="status-badge bg-status-done/10 border-status-done/20 text-status-done">Done</span>
              </div>
            </div>

            <div className="border-card p-5 border-l-4 border-l-blue-400 hover:shadow-md transition-all">
              <p className="text-[10px] uppercase tracking-wider text-koda-charcoal/40 mb-1">CRM Platform</p>
              <h4 className="text-sm font-bold text-koda-charcoal mb-3">Design lead pipeline dashboard</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-koda-charcoal/60 uppercase tracking-wider">Medium • 2h</span>
                <span className="status-badge bg-status-deferred/10 border-status-deferred/20 text-status-deferred">Deferred</span>
              </div>
            </div>

            <div className="border-card p-5 border-l-4 border-l-green-400/50 hover:shadow-md transition-all">
              <p className="text-[10px] uppercase tracking-wider text-koda-charcoal/40 mb-1">Personal</p>
              <h4 className="text-sm font-bold text-koda-charcoal mb-3">Reply to university group chat</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-koda-charcoal/60 uppercase tracking-wider">Light • 0.5h</span>
                <span className="status-badge bg-status-skipped/10 border-status-skipped/20 text-status-skipped">Skipped</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5. SOCIAL PROOF ===== */}
      <section id="proof" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Status Badge Cluster */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "UAS Prep", status: "Done", style: "bg-status-done/10 border-status-done/20 text-status-done" },
                { label: "Deploy v2.1", status: "Done", style: "bg-status-done/10 border-status-done/20 text-status-done" },
                { label: "Client Meeting", status: "Deferred", style: "bg-status-deferred/10 border-status-deferred/20 text-status-deferred" },
                { label: "Code Review", status: "Done", style: "bg-status-done/10 border-status-done/20 text-status-done" },
                { label: "Gym", status: "Skipped", style: "bg-status-skipped/10 border-status-skipped/20 text-status-skipped" },
                { label: "DB Migration", status: "Done", style: "bg-status-done/10 border-status-done/20 text-status-done" },
                { label: "Sprint Planning", status: "Deferred", style: "bg-status-deferred/10 border-status-deferred/20 text-status-deferred" },
                { label: "Write Docs", status: "Skipped", style: "bg-status-skipped/10 border-status-skipped/20 text-status-skipped" },
                { label: "Ship Feature", status: "Done", style: "bg-status-done/10 border-status-done/20 text-status-done" },
              ].map((badge, i) => (
                <div key={i} className={`px-4 py-2 rounded-xl border text-xs font-bold ${badge.style}`}>
                  {badge.label} <span className="opacity-60">• {badge.status}</span>
                </div>
              ))}
            </div>

            {/* Copy */}
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-widest text-koda-bear">The Koda Pulse</p>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                From UAS Prep to Production Deploys.
              </h2>
              <p className="text-lg text-koda-charcoal/60 leading-relaxed">
                Whether you're managing a 200-student university test or building an industrial CRM, Koda adapts to the scale of your stress. He doesn't judge your 3-task Tuesday or your 12-task Friday. He just makes it work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 6. FOOTER CTA ===== */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FDFBF9 100%)" }}>
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="flex flex-col items-center text-center">
            <Image src="/koda/koda_happy.png" alt="Koda Happy" width={160} height={160} className="object-contain mb-8 drop-shadow-md" />
            <h2 className="text-3xl md:text-5xl font-bold mb-4 max-w-lg">
              Don't let your week <span className="text-koda-bear">run you</span>.
            </h2>
            <p className="text-lg text-koda-charcoal/60 mb-10 max-w-md">
              Start your first session with Koda. It takes less than 2 minutes.
            </p>
            <Link href="/signup" className="bg-koda-bear text-white font-bold px-10 py-5 rounded-xl text-lg hover:bg-opacity-90 transition-all shadow-sm">
              Sync Your First Week
            </Link>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="border-t border-koda-border py-6">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-koda-charcoal/40">
            <div className="flex items-center gap-2">
              <Image src="/koda/koda.png" alt="Koda" width={20} height={20} className="object-contain opacity-40" />
              <span>Koda Studio</span>
            </div>
            <span className="font-mono tracking-widest uppercase">v1.0.0-prototype</span>
          </div>
        </div>
      </section>

      {/* ===== ANIMATIONS ===== */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes trace {
          0%, 100% { transform: translate(0px, 0px); opacity: 0.9; }
          25% { transform: translate(4px, -8px); opacity: 1; }
          50% { transform: translate(8px, -4px); opacity: 0.95; }
          75% { transform: translate(4px, 4px); opacity: 0.9; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-trace {
          animation: trace 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
