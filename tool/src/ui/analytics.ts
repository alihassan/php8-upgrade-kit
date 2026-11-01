// Google Analytics 4, loaded only when VITE_GA_ID is set at build time.
// Events carry counts and choices only. Never code, file names or package names.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const id = import.meta.env.VITE_GA_ID as string | undefined;

export function initAnalytics(): void {
  if (!id || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

export function track(event: string, params: Record<string, string | number | boolean> = {}): void {
  try {
    window.gtag?.('event', event, { tool: 'php8-check', ...params });
  } catch {
    /* analytics must never break the tool */
  }
}
