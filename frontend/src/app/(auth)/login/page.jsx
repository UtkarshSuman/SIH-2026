import { AuthCard } from "@/components/auth/auth-card";

export default async function LoginPage({ searchParams }) {
  const { mode } = await searchParams;

  const initialMode = mode === "register" ? "register" : "login";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071b12] px-4 py-6 text-white">
      {/* ================= BACKGROUND ================= */}
      <div
        className="
          absolute
          inset-0
          bg-cover
          bg-center
          bg-no-repeat
        "
        style={{
          backgroundImage: "url('/background-image.png')",
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#061b12]/55" />

      {/* Blur */}
      <div className="absolute inset-0 backdrop-blur-[3px]" />

      {/* Green atmospheric glow */}
      <div
        className="
          pointer-events-none
          absolute
          left-[10%]
          top-[20%]
          h-[450px]
          w-[450px]
          rounded-full
          bg-[#aaf27d]/10
          blur-[130px]
        "
      />

      {/* ================= HEADER ================= */}
      <header
        className="
          relative
          z-20
          flex
          items-center
          justify-between
          px-2
          sm:px-6
          lg:px-12
        "
      >
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-3 transition hover:opacity-90"
        >
          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-[#aaf27d]/40
              bg-[#143b27]/70
              backdrop-blur-xl
            "
          >
            <span className="text-xl text-[#aaf27d]">◈</span>
          </div>

          <div>
            <div className="text-lg font-bold tracking-tight sm:text-xl">
              Rescue Arc
            </div>

            <div className="text-[10px] text-white/55 sm:text-xs">
              Safer Communities, Stronger Tomorrow
            </div>
          </div>
        </a>

        {/* Back Home */}
        <a
          href="/"
          className="
            flex
            items-center
            gap-2
            rounded-full
            border
            border-white/20
            bg-[#102c1d]/55
            px-4
            py-2.5
            text-xs
            font-semibold
            text-white/90
            backdrop-blur-xl
            transition
            hover:border-[#aaf27d]/50
            hover:bg-[#163b25]/70
            hover:text-[#aaf27d]
            sm:px-5
            sm:text-sm
          "
        >
          <span className="text-base">←</span>
          Back to Home
        </a>
      </header>

      {/* ================= MAIN ================= */}
      <section
        className="
          relative
          z-10
          mx-auto
          flex
          min-h-[calc(100vh-120px)]
          max-w-[1180px]
          items-center
          justify-center
          gap-16
          py-10
          lg:justify-between
        "
      >
        {/* ================= LEFT CONTENT ================= */}
        <div className="hidden max-w-[390px] lg:block">
          <div
            className="
              mb-5
              flex
              items-center
              gap-2
              text-[10px]
              font-bold
              uppercase
              tracking-[0.2em]
              text-[#b9f59c]
            "
          >
            <span className="h-1.5 w-8 rounded-full bg-[#aaf27d]" />
            Real-Time
            <span className="text-white/30">•</span>
            AI-Powered
            <span className="text-white/30">•</span>
            People-Centric
          </div>

          <h1
            className="
              text-5xl
              font-bold
              leading-[1.05]
              tracking-[-0.04em]
              text-white
              xl:text-6xl
            "
          >
            From Risk to <span className="text-[#aaf27d]">Resilience</span>
          </h1>

          <p
            className="
              mt-6
              max-w-[330px]
              text-base
              leading-7
              text-white/65
            "
          >
            Together for safer communities and a more resilient tomorrow.
          </p>

          <div
            className="
              mt-8
              h-px
              w-20
              bg-gradient-to-r
              from-[#aaf27d]
              to-transparent
            "
          />
        </div>

        {/* ================= AUTH CARD ================= */}
        <div className="w-full max-w-[500px]">
          <AuthCard initialMode={initialMode} />
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer
        className="
          pointer-events-none
          absolute
          bottom-5
          left-0
          right-0
          z-20
          flex
          items-center
          justify-between
          px-6
          text-[10px]
          text-white/55
          sm:px-10
          sm:text-xs
          lg:px-12
        "
      >
        <span>© 2024 Rescue Arc. All rights reserved.</span>

        <span className="hidden sm:block">
          People&nbsp;&nbsp;•&nbsp;&nbsp; Technology&nbsp;&nbsp;•&nbsp;&nbsp;
          Safer Tomorrow
        </span>
      </footer>
    </main>
  );
}
