export default function ContactSection() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="px-5 py-20 text-center">
        <p className="text-sm font-bold uppercase tracking-[3px] text-emerald-700">
          Get In Touch
        </p>

        <h1 className="mt-4 text-5xl font-extrabold text-slate-950">
          Connect With Rescue Arc
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-slate-600">
          Have a question, want to collaborate, or need more information about
          the platform? Send us a message.
        </p>
      </section>

      {/* Contact Area */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 lg:grid-cols-2">
        {/* Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="text-2xl font-bold text-slate-900">Rescue Arc</h2>

          <p className="mt-4 leading-7 text-slate-600">
            A geospatial hazard intelligence platform designed to support hazard
            identification, population assessment, and safer relocation
            planning.
          </p>

          <div className="mt-8 space-y-4 text-sm text-slate-600">
            <p>
              <strong className="text-slate-900">Emergency:</strong> NDMA
              Helpline 1078
            </p>

            <p>
              <strong className="text-slate-900">Platform:</strong> Rescue Arc
            </p>

            <p>
              <strong className="text-slate-900">Purpose:</strong> Hazard Red
              Zone Identification & Relocation Intelligence
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="rounded-2xl border border-slate-200 bg-white p-8">
          <div>
            <label className="text-sm font-semibold text-slate-700">Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-slate-700">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-slate-700">
              Message
            </label>

            <textarea
              rows="5"
              placeholder="Write your message..."
              className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            Send Message
          </button>
        </form>
      </section>
    </main>
  );
}