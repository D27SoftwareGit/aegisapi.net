const SECTIONS = [
  {
    title: "Terms of Service",
    body: [
      "AegisAPI is licensed, not sold. Your license grants you the right to install and run AegisAPI on one machine at a time per active license, subject to the plan you purchased.",
      "Free trials provide full feature access for the trial period. At the end of the trial, continued use requires an active license.",
      "Licenses are bound to the machine they are activated on and may not be shared, resold, or used concurrently across multiple machines.",
    ],
  },
  {
    title: "Privacy Policy",
    body: [
      "AegisAPI does not collect, transmit, or store the contents of your vault. Vault data is encrypted and remains on your local machine at all times.",
      "License validation is fully air-gapped: your license key is verified entirely on your own machine, with no license data ever transmitted to or checked against our servers.",
      "We do not run analytics, crash reporting, or behavioral tracking inside the application.",
    ],
  },
  {
    title: "License Agreement",
    body: [
      "Call Package licenses grant a fixed number of licensed calls, valid for 12 months from purchase, and are bound to the machine on which the license was activated. Any calls remaining at expiration can be carried forward for another 12 months by paying a maintenance renewal fee.",
      "Yearly and Enterprise licenses grant unlimited usage for the duration of the active subscription term, bound to the number of machines specified in the plan.",
      "D27 Software L.L.C. reserves the right to revoke licenses obtained through fraud or in violation of these terms.",
    ],
  },
];

export default function Legal() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Legal
      </h1>
      <p className="mt-5 text-muted-foreground">
        The essentials, in plain language. For questions, contact{" "}
        <a href="mailto:legal@aegisapi.net" className="text-primary hover:underline">
          legal@aegisapi.net
        </a>
        .
      </p>

      <div className="mt-14 space-y-14">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
            <div className="mt-4 space-y-3">
              {section.body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-16 text-xs text-muted-foreground">
        AegisAPI is a product of D27 Software L.L.C. This page is provided for
        informational purposes and does not constitute legal advice.
      </p>
    </div>
  );
}
