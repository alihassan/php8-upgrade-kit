// "Send this report to Ali": an opt-in form that posts the report to the
// endpoint set at build time (VITE_REPORT_ENDPOINT). Without it, the button
// never shows, so forks of this repo don't send anything anywhere.
import { sharePayload } from '../engine/report/report';
import type { ComposerReport } from '../engine/composer/check';
import type { AnalysisResult } from '../engine/types';
import { track } from './analytics';

export const REPORT_ENDPOINT = (import.meta.env.VITE_REPORT_ENDPOINT as string | undefined) || '';

export function initSend(current: () => { result: AnalysisResult | null; composer: ComposerReport | null }): () => void {
  const dialog = document.getElementById('send-dialog') as HTMLDialogElement;
  const form = document.getElementById('send-form') as HTMLFormElement;
  const statusEl = document.getElementById('send-status')!;
  const submit = document.getElementById('send-submit') as HTMLButtonElement;
  let sent = false;

  document.getElementById('send-cancel')!.addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { result, composer } = current();
    if (!result || sent) return;
    const data = new FormData(form);
    const includeCode = data.get('includeCode') === 'on';
    submit.disabled = true;
    statusEl.textContent = 'Sending...';
    try {
      const res = await fetch(REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sharePayload(result, composer, includeCode),
          note: String(data.get('note') ?? ''),
          email: String(data.get('email') ?? ''),
          website: String(data.get('website') ?? ''),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || `the server answered ${res.status}`);
      sent = true;
      statusEl.textContent = data.get('email') ? 'Sent. Thank you. Ali will reply by email.' : 'Sent. Thank you.';
      submit.textContent = 'Sent';
      track('php8_report_sent', { target: result.target, includes_code: includeCode, has_email: !!data.get('email') });
    } catch (err) {
      statusEl.textContent = `Couldn't send it: ${(err as Error).message}. Your report is still here; you can download it instead.`;
      submit.disabled = false;
    }
  });

  return () => {
    sent = false;
    form.reset();
    submit.disabled = false;
    submit.textContent = 'Send report';
    statusEl.textContent = '';
    dialog.showModal();
    track('php8_report_open');
  };
}
