import Link from "next/link";

import { requireRecruiterContext } from "@/lib/auth/session";

export default async function WhatsAppPage() {
  await requireRecruiterContext();

  const configured =
    Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID) &&
    Boolean(process.env.WHATSAPP_ACCESS_TOKEN) &&
    Boolean(process.env.WHATSAPP_VERIFY_TOKEN);

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      <div className="flex items-start justify-between gap-sm flex-wrap">
        <div>
          <h2 className="font-h1 text-h1 text-primary">WhatsApp Hub</h2>
          <p className="font-body-base text-body-base text-text-secondary mt-2xs">
            Integration status and webhook endpoints.
          </p>
        </div>
        <Link
          className="inline-flex border border-outline-variant text-primary font-label text-label px-md py-xs rounded hover:bg-surface-container-low transition-colors"
          href="/jobs"
        >
          Back to jobs
        </Link>
      </div>

      <div className="mt-md grid grid-cols-1 lg:grid-cols-2 gap-md">
        <section className="bg-surface rounded-lg border border-outline-variant shadow-sm p-md hover:shadow-md transition-shadow">
          <h3 className="font-h2 text-h2 text-primary">Configuration</h3>
          <div className="mt-sm flex items-center gap-sm">
            <span
              className={[
                "px-2xs py-3xs rounded font-label text-label border",
                configured
                  ? "bg-semantic-success/10 text-semantic-success border-semantic-success/30"
                  : "bg-semantic-warning/10 text-semantic-warning border-semantic-warning/30",
              ].join(" ")}
            >
              {configured ? "Configured" : "Not configured"}
            </span>
            <span className="font-caption text-caption text-text-secondary">
              Set `WHATSAPP_*` env vars in Vercel.
            </span>
          </div>
          <div className="mt-sm bg-surface-container-low border border-outline-variant rounded-lg p-sm font-caption text-caption text-text-secondary">
            Requires `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, and `WHATSAPP_VERIFY_TOKEN`.
          </div>
        </section>

        <section className="bg-surface rounded-lg border border-outline-variant shadow-sm p-md hover:shadow-md transition-shadow">
          <h3 className="font-h2 text-h2 text-primary">Webhook</h3>
          <p className="font-body-base text-body-base text-text-secondary mt-2xs">
            Meta calls these endpoints.
          </p>

          <div className="mt-sm space-y-2xs font-body-base text-body-base">
            <div className="flex items-center justify-between gap-sm bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs">
              <span className="text-text-secondary">Verify (GET)</span>
              <span className="font-tabular text-caption text-text-primary">/api/webhooks/whatsapp</span>
            </div>
            <div className="flex items-center justify-between gap-sm bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs">
              <span className="text-text-secondary">Messages (POST)</span>
              <span className="font-tabular text-caption text-text-primary">/api/webhooks/whatsapp</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

