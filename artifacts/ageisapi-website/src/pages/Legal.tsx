const SECTIONS = [
  {
    title: "Terms of Service",
    body: [
      "AegisAPI is licensed, not sold. One physical PC, one license. The license is bound to that PC's hardware. Extra Windows logins on the same PC are not extra seats. The key cannot move to another machine. Remote desktop / terminal server is not a v1 SKU.",
      "The free trial is 20 API calls or 7 days, whichever comes first, per PC, shared across Windows logins on that PC. When the trial or a paid license ends, Send may be blocked. Vault unlock is not destroyed.",
      "Licenses may not be shared, resold, or used on more than one physical PC.",
    ],
  },
  {
    title: "Privacy Policy",
    body: [
      "AegisAPI does not collect, transmit, or store the contents of your vault. Vault data is encrypted and remains on your local machine at all times.",
      "Buying and redeeming a license happens on this website. When you redeem, you submit your Machine ID so we can issue a key bound to that PC (account and payment data are already part of checkout). After that key is on the PC, the installed app verifies it locally and does not call our license servers.",
      "We do not run analytics, crash reporting, or behavioral tracking inside the application.",
    ],
  },
  {
    title: "License Agreement",
    body: [
      "Call Package licenses grant a fixed number of licensed calls, valid for 12 months from purchase, bound to the one physical PC on which the license was activated. Any calls remaining at expiration can be carried forward for another 12 months by paying a maintenance renewal fee.",
      "Self-serve Yearly licenses grant unlimited usage for 12 months, still one physical PC. Enterprise is not a self-serve multi-machine SKU on this site; contact sales@aegisapi.net.",
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
