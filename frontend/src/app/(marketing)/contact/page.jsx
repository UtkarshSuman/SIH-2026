import Navbar from "@/components/marketing/Navbar";

const contactOptions = [
  {
    number: "01",
    title: "General Enquiries",
    description:
      "Have a question about Rescue Arc, the platform or our vision? Send us a message and our team will get back to you.",
    label: "GENERAL",
  },
  {
    number: "02",
    title: "Partnerships",
    description:
      "Interested in collaborating with Rescue Arc or bringing disaster intelligence to your organization or community?",
    label: "PARTNERSHIPS",
  },
  {
    number: "03",
    title: "Technical Support",
    description:
      "Having an issue with the platform? Tell us what happened and provide as much detail as possible.",
    label: "SUPPORT",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#061b10] text-white">
      <Navbar />

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden pt-[72px]">
        {/* Ambient glow */}
        <div
          className="
            pointer-events-none
            absolute
            left-[-180px]
            top-[-180px]
            h-[600px]
            w-[600px]
            rounded-full
            bg-[#4c9b58]/10
            blur-[130px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            right-[-150px]
            top-[80px]
            h-[500px]
            w-[500px]
            rounded-full
            bg-[#aaf27d]/[0.035]
            blur-[120px]
          "
        />

        {/* Subtle grid */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-[0.035]
            [background-image:linear-gradient(rgba(170,242,125,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(170,242,125,0.8)_1px,transparent_1px)]
            [background-size:80px_80px]
          "
        />

        <div
          className="
            relative
            mx-auto
            max-w-[1250px]
            px-6
            pb-20
            pt-24
            lg:px-10
            lg:pb-28
            lg:pt-32
          "
        >
          <div className="grid gap-16 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            {/* Left */}
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-[#aaf27d]" />

                <span
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.3em]
                    text-[#aaf27d]
                  "
                >
                  Contact Rescue Arc
                </span>
              </div>

              <h1
                className="
                  mt-7
                  max-w-[850px]
                  text-5xl
                  font-bold
                  leading-[0.98]
                  tracking-[-0.05em]
                  sm:text-6xl
                  lg:text-[78px]
                "
              >
                Let's build a
                <br />
                <span className="text-[#aaf27d]">safer future.</span>
              </h1>

              <p
                className="
                  mt-8
                  max-w-[650px]
                  text-sm
                  leading-7
                  text-white/40
                  sm:text-base
                "
              >
                Whether you want to learn more about Rescue Arc, explore a
                partnership or get help with the platform, we'd love to hear
                from you.
              </p>
            </div>

            {/* Right status panel */}
            <div
              className="
                rounded-3xl
                border
                border-white/[0.08]
                bg-white/[0.025]
                p-7
                sm:p-8
              "
            >
              <div className="flex items-center gap-3">
                <span
                  className="
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-[#aaf27d]
                    shadow-[0_0_15px_rgba(170,242,125,0.7)]
                  "
                />

                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#aaf27d]">
                  Response Ready
                </span>
              </div>

              <p className="mt-6 text-lg font-semibold leading-8 text-white/75">
                Have something to discuss?
              </p>

              <p className="mt-3 text-sm leading-7 text-white/30">
                Fill out the form below and send your message directly to the
                Rescue Arc team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTACT CONTENT
      ====================================================== */}
      <section className="border-y border-white/[0.08] bg-[#071f12]">
        <div
          className="
            mx-auto
            grid
            max-w-[1250px]
            gap-12
            px-6
            py-20
            lg:grid-cols-[0.7fr_1.3fr]
            lg:px-10
            lg:py-28
          "
        >
          {/* Contact options */}
          <div>
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.3em]
                text-[#aaf27d]
              "
            >
              Get In Touch
            </p>

            <h2
              className="
                mt-5
                text-3xl
                font-bold
                tracking-[-0.04em]
                sm:text-4xl
              "
            >
              How can we
              <br />
              <span className="text-white/35">help?</span>
            </h2>

            <div className="mt-10 space-y-3">
              {contactOptions.map((item) => (
                <div
                  key={item.number}
                  className="
                    group
                    rounded-2xl
                    border
                    border-white/[0.07]
                    bg-white/[0.02]
                    p-5
                    transition-all
                    duration-300
                    hover:border-[#aaf27d]/20
                    hover:bg-white/[0.035]
                  "
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-white/20">
                      {item.number}
                    </span>

                    <span className="text-[8px] font-bold tracking-[0.2em] text-[#aaf27d]/60">
                      {item.label}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-white/85">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-white/30">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div
            className="
              rounded-3xl
              border
              border-white/[0.08]
              bg-[#061b10]
              p-6
              sm:p-8
            "
          >
            <div className="mb-8">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#aaf27d]">
                Send a Message
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em]">
                Tell us what's on your mind.
              </h2>
            </div>

            <form className="space-y-5">
              {/* Name + Email */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-white/[0.08]
                      bg-white/[0.025]
                      px-4
                      py-3.5
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-white/20
                      transition
                      focus:border-[#aaf27d]/40
                      focus:bg-white/[0.04]
                    "
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-white/[0.08]
                      bg-white/[0.025]
                      px-4
                      py-3.5
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-white/20
                      transition
                      focus:border-[#aaf27d]/40
                      focus:bg-white/[0.04]
                    "
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35"
                >
                  Subject
                </label>

                <select
                  id="subject"
                  name="subject"
                  defaultValue=""
                  className="
                    w-full
                    rounded-xl
                    border
                    border-white/[0.08]
                    bg-white/[0.025]
                    px-4
                    py-3.5
                    text-sm
                    text-white/70
                    outline-none
                    transition
                    focus:border-[#aaf27d]/40
                  "
                >
                  <option value="" disabled className="bg-[#061b10]">
                    Select a topic
                  </option>

                  <option value="general" className="bg-[#061b10]">
                    General Enquiry
                  </option>

                  <option value="partnership" className="bg-[#061b10]">
                    Partnership
                  </option>

                  <option value="support" className="bg-[#061b10]">
                    Technical Support
                  </option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35"
                >
                  Message
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  placeholder="Write your message..."
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-white/[0.08]
                    bg-white/[0.025]
                    px-4
                    py-3.5
                    text-sm
                    leading-6
                    text-white
                    outline-none
                    placeholder:text-white/20
                    transition
                    focus:border-[#aaf27d]/40
                    focus:bg-white/[0.04]
                  "
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="
                  w-full
                  rounded-xl
                  bg-[#aaf27d]
                  px-6
                  py-3.5
                  text-xs
                  font-bold
                  text-[#102918]
                  transition-all
                  duration-300
                  hover:bg-[#baf58f]
                  hover:-translate-y-[1px]
                "
              >
                Send Message
              </button>

              <p className="text-center text-[10px] leading-5 text-white/20">
                We'll use your information only to respond to your enquiry.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section>
        <div
          className="
            mx-auto
            max-w-[1000px]
            px-6
            py-24
            text-center
            lg:py-28
          "
        >
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.3em]
              text-[#aaf27d]
            "
          >
            Rescue Arc
          </p>

          <h2
            className="
              mt-5
              text-4xl
              font-bold
              tracking-[-0.04em]
              sm:text-6xl
            "
          >
            Better information.
            <br />
            <span className="text-white/35">Better preparedness.</span>
          </h2>
        </div>
      </section>
    </main>
  );
}
