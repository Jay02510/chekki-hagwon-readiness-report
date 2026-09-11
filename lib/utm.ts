const KEY = "hagwon-readiness-utm";

export type Utm = { source?: string; medium?: string; campaign?: string };

// First-touch attribution: capture once per browser, on whichever page a
// visitor actually lands on, and never overwrite it — a later page view
// with no UTM params (or a different campaign) shouldn't erase how they
// originally arrived.
export function captureUtm(): void {
  if (localStorage.getItem(KEY)) return;
  const params = new URLSearchParams(window.location.search);
  const utm: Utm = {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
  };
  if (utm.source || utm.medium || utm.campaign) {
    localStorage.setItem(KEY, JSON.stringify(utm));
  }
}

export function getUtm(): Utm {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}
