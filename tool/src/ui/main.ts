import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/geist-mono';
import './styles.css';
import type { EditorView } from 'codemirror';
import { createEditor, goToLine, setCode } from './editor';
import { initAnalytics, track } from './analytics';
import { addFile, addZip, emptyCollected, MAX_FILES, type Collected } from '../engine/files';
import { checkComposer, type ComposerReport } from '../engine/composer/check';
import { copySummary, effort, EFFORT, groupFindings, SEVERITY_LABEL, summaryLine, supportLabel, toJson, toMarkdown } from '../engine/report/report';
import { TARGETS, type AnalysisResult, type Finding, type Target } from '../engine/types';

initAnalytics();

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const PASTED = 'pasted.php';
const state = {
  target: '8.3' as Target,
  files: [] as { path: string; code: string }[],
  composerJson: undefined as string | undefined,
  composerLock: undefined as string | undefined,
  current: PASTED,
  source: 'paste' as 'paste' | 'files' | 'zip' | 'sample',
  result: null as AnalysisResult | null,
  composer: null as ComposerReport | null,
  composerKey: '',
  runId: 0,
  pasteTracked: false,
};

// ---------------------------------------------------------------- theme
document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) =>
  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode */
    }
  }),
);

document.querySelectorAll<HTMLAnchorElement>('a[data-out]').forEach((a) =>
  a.addEventListener('click', () => track('php8_outbound', { link: a.dataset.out! })),
);

// ---------------------------------------------------------------- target selector
const targets = $('targets');
targets.innerHTML = TARGETS.map((t) => `<button type="button" role="radio" data-target="${t}" aria-checked="${t === state.target}">PHP ${t}</button>`).join('');
targets.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-target]');
  if (!b || b.dataset.target === state.target) return;
  state.target = b.dataset.target as Target;
  targets.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  track('php8_target', { target: state.target });
  run('target');
});

// ---------------------------------------------------------------- editor
let editing = false;
let debounce: ReturnType<typeof setTimeout> | undefined;
const view: EditorView = createEditor($('editor'), (code) => {
  if (editing) return;
  const f = state.files.find((x) => x.path === state.current);
  if (f) f.code = code;
  else state.files.push({ path: PASTED, code });
  clearTimeout(debounce);
  debounce = setTimeout(() => run('edit'), 500);
});

function show(path: string, line?: number) {
  const f = state.files.find((x) => x.path === path);
  if (!f) return;
  state.current = path;
  editing = true;
  if (view.state.doc.toString() !== f.code) setCode(view, f.code);
  editing = false;
  const sel = $<HTMLSelectElement>('file-select');
  sel.value = path;
  if (line) goToLine(view, line);
}

function renderFileSelect() {
  const sel = $<HTMLSelectElement>('file-select');
  sel.hidden = state.files.length < 2;
  sel.innerHTML = state.files.map((f) => `<option value="${esc(f.path)}">${esc(f.path)}</option>`).join('');
  sel.value = state.current;
}
$<HTMLSelectElement>('file-select').addEventListener('change', (e) => show((e.target as HTMLSelectElement).value));

function load(c: Collected, source: typeof state.source) {
  state.files = c.php;
  state.composerJson = c.composerJson;
  state.composerLock = c.composerLock;
  state.source = source;
  state.current = c.php[0]?.path ?? PASTED;
  if (!c.php.length) state.files = [];
  renderFileSelect();
  editing = true;
  setCode(view, c.php[0]?.code ?? '');
  editing = false;
  const bits = [`${c.php.length} PHP file${c.php.length === 1 ? '' : 's'}`];
  if (c.composerJson) bits.push('composer.json');
  if (c.composerLock) bits.push('composer.lock');
  let msg = `Loaded ${bits.join(', ')}.`;
  if (c.skipped) msg += ` Skipped ${c.skipped} files in vendor/ or node_modules/.`;
  if (c.truncated) msg += ` Stopped at ${MAX_FILES} PHP files; the rest were not scanned.`;
  status(msg);
  run(source);
}

function status(msg: string) {
  $('status').textContent = msg;
}

// ---------------------------------------------------------------- input: files, zip, drop, sample
async function collect(list: FileList | File[]): Promise<Collected> {
  const c = emptyCollected();
  for (const file of Array.from(list)) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    if (/\.zip$/i.test(file.name)) addZip(c, new Uint8Array(await file.arrayBuffer()));
    else addFile(c, path, await file.text());
  }
  return c;
}

$<HTMLInputElement>('file-input').addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  const isZip = Array.from(input.files).some((f) => /\.zip$/i.test(f.name));
  try {
    load(await collect(input.files), isZip ? 'zip' : 'files');
  } catch (err) {
    status(`Could not read that file: ${(err as Error).message}`);
  }
  input.value = '';
});

const drop = $('drop');
['dragenter', 'dragover'].forEach((ev) =>
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add('dragging');
  }),
);
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('dragging')));
drop.addEventListener('drop', async (e) => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (!files?.length) return;
  const isZip = Array.from(files).some((f) => /\.zip$/i.test(f.name));
  try {
    load(await collect(files), isZip ? 'zip' : 'files');
  } catch (err) {
    status(`Could not read that file: ${(err as Error).message}`);
  }
});

$('sample').addEventListener('click', async () => {
  status('Loading the example app...');
  const sample = (await import('../sample/legacy-app.json')).default as {
    files: { path: string; code: string }[];
    composerJson?: string;
    composerLock?: string;
  };
  const c = emptyCollected();
  for (const f of sample.files) addFile(c, f.path, f.code);
  if (sample.composerJson) addFile(c, 'composer.json', sample.composerJson);
  if (sample.composerLock) addFile(c, 'composer.lock', sample.composerLock);
  track('php8_sample_load');
  load(c, 'sample');
});

$('clear').addEventListener('click', () => {
  load(emptyCollected(), 'paste');
  status('');
});

// ---------------------------------------------------------------- analysis
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
const pending = new Map<number, (r: { result?: AnalysisResult; error?: string; ms?: number }) => void>();
worker.onmessage = (e) => {
  pending.get(e.data.id)?.(e.data);
  pending.delete(e.data.id);
};

/** Pasted snippets often skip the opening tag. Add it on the same line so line numbers stay right. */
function withOpenTag(code: string) {
  return /<\?(php|=)?/i.test(code) ? code : `<?php ${code}`;
}

async function run(trigger: 'edit' | 'target' | typeof state.source) {
  const files = state.files.filter((f) => f.code.trim()).map((f) => ({ path: f.path, code: f.path === PASTED ? withOpenTag(f.code) : f.code }));
  const hasComposer = !!(state.composerJson || state.composerLock);
  if (!files.length && !hasComposer) {
    state.result = null;
    renderReport();
    return;
  }
  const id = ++state.runId;
  $('report').classList.add('busy');
  const res = await new Promise<{ result?: AnalysisResult; error?: string; ms?: number }>((resolve) => {
    pending.set(id, resolve);
    worker.postMessage({ id, files, target: state.target });
  });
  if (id !== state.runId) return; // a newer run started
  $('report').classList.remove('busy');
  if (res.error || !res.result) {
    status(`Something went wrong while scanning: ${res.error}`);
    return;
  }
  state.result = res.result;
  renderReport();
  // After loading a project, open the file with the first (most severe) problem instead of whatever sorted first.
  if (trigger === 'sample' || trigger === 'files' || trigger === 'zip') {
    const first = groupFindings(res.result.findings)[0]?.files[0]?.findings[0];
    if (first) show(first.file, first.line);
  }

  const shouldTrack = trigger !== 'edit' || !state.pasteTracked;
  if (trigger === 'edit') state.pasteTracked = true;
  if (shouldTrack) {
    const c = res.result.counts;
    track('php8_scan', {
      source: trigger === 'edit' ? 'paste' : trigger === 'target' ? state.source : trigger,
      target: state.target,
      files: res.result.files,
      fatal: c.fatal,
      deprecated: c.deprecated,
      behavior_change: c['behavior-change'],
      effort: effort(c).band,
      rules_hit: new Set(res.result.findings.map((f) => f.ruleId)).size,
      ms: res.ms ?? 0,
    });
  }

  if (hasComposer) runComposer(id);
  else state.composer = null;
}

async function runComposer(id: number) {
  const key = `${state.target}:${state.composerJson?.length}:${state.composerLock?.length}`;
  if (key === state.composerKey && state.composer) return renderReport();
  state.composer = null;
  state.composerKey = key;
  renderReport(true);
  const report = await checkComposer({ composerJson: state.composerJson, composerLock: state.composerLock, target: state.target });
  if (id !== state.runId) return;
  state.composer = report;
  renderReport();
  track('php8_composer', {
    target: state.target,
    packages: report.packages.length,
    blocked: report.packages.filter((p) => p.supports === 'no').length,
    unknown: report.packages.filter((p) => p.supports === 'unknown').length,
  });
}

// ---------------------------------------------------------------- report
function renderReport(composerLoading = false) {
  const el = $('report');
  const r = state.result;
  if (!r) {
    el.innerHTML = `<div class="empty"><p>Your report shows up here.</p><p class="muted">Not sure where to start? Press <strong>Load a legacy example</strong> to scan a small 2017-style PHP app.</p></div>`;
    return;
  }
  const e = effort(r.counts);
  const groups = groupFindings(r.findings);
  el.innerHTML = `
    <div class="summary">
      <p class="summary-line">${esc(summaryLine(r))}</p>
      <div class="summary-row">
        <span class="chip chip-fatal">${r.counts.fatal} fatal</span>
        <span class="chip chip-deprecated">${r.counts.deprecated} deprecated</span>
        <span class="chip chip-behavior">${r.counts['behavior-change']} behavior change${r.counts['behavior-change'] === 1 ? '' : 's'}</span>
        <span class="effort" tabindex="0" aria-describedby="effort-tip">Effort: <strong>${e.band}</strong>
          <span class="tip" role="tooltip" id="effort-tip">${esc(EFFORT.formula)} This scan: ${e.points} points.</span>
        </span>
      </div>
      <p class="muted small">${r.files} file${r.files === 1 ? '' : 's'} scanned. Findings marked <span class="tag">heuristic</span> are best guesses: check them.</p>
      <div class="actions">
        <button type="button" class="btn" data-action="copy">Copy summary</button>
        <button type="button" class="btn" data-action="md">Download .md</button>
        <button type="button" class="btn" data-action="json">Download .json</button>
      </div>
    </div>
    ${renderComposer(composerLoading)}
    ${groups.length ? groups.map((g) => `
      <section class="group">
        <h2 class="group-title sev-${g.severity}">${SEVERITY_LABEL[g.severity]} <span>${g.files.reduce((s, f) => s + f.findings.length, 0)}</span></h2>
        ${g.files.map((f) => `
          <div class="file-group">
            <h3 class="file-name">${esc(f.file)}</h3>
            ${f.findings.map(renderFinding).join('')}
          </div>`).join('')}
      </section>`).join('') : `<p class="all-clear">No issues found for PHP ${r.target}. That's a good sign, but a scan can't see everything. Run your tests or click through the site on PHP ${r.target} too.</p>`}
    ${r.parseProblems.length ? `<section class="group"><h2 class="group-title">Could not fully read</h2><ul class="parse">${r.parseProblems.map((p) => `<li><button type="button" class="loc" data-file="${esc(p.file)}" data-line="${p.line}">${esc(p.file)}:${p.line}</button> ${esc(p.message)}</li>`).join('')}</ul></section>` : ''}
  `;
}

function renderFinding(f: Finding): string {
  return `
    <article class="finding">
      <div class="finding-head">
        <h4>${esc(f.title)}</h4>
        <button type="button" class="loc" data-file="${esc(f.file)}" data-line="${f.line}" title="Show in editor">line ${f.line}</button>
        ${f.heuristic ? '<span class="tag" title="Found by a best-guess rule. Check it by hand.">heuristic</span>' : ''}
        <span class="tag">PHP ${f.phpVersion}</span>
      </div>
      <pre class="code-line"><code>${esc(f.code || '(empty line)')}</code></pre>
      ${f.note ? `<p class="note">${esc(f.note)}</p>` : ''}
      <details>
        <summary>Why it breaks and how to fix it</summary>
        <p>${esc(f.explanation)}</p>
        <div class="ba">
          <div><span class="ba-label">Before</span><pre><code>${esc(f.before)}</code></pre></div>
          <div><span class="ba-label">After</span><pre><code>${esc(f.after)}</code></pre></div>
        </div>
        <a href="${esc(f.docUrl)}" target="_blank" rel="noopener">Read the PHP documentation</a>
      </details>
    </article>`;
}

function renderComposer(loading: boolean): string {
  if (!state.composerJson && !state.composerLock) return '';
  const c = state.composer;
  if (!c || loading) return `<section class="group"><h2 class="group-title">Composer packages</h2><p class="muted">Looking up packages on packagist.org...</p></section>`;
  const root = c.rootPhp
    ? `<p>composer.json asks for <code>php: ${esc(c.rootPhp)}</code>, which ${c.rootAllowsTarget ? 'allows' : '<strong>does not allow</strong>'} PHP ${c.target}.</p>`
    : '';
  const rows = c.packages
    .map((p) => `
      <tr class="support-${p.supports}">
        <td><a href="https://packagist.org/packages/${esc(p.name)}" target="_blank" rel="noopener">${esc(p.name)}</a>${p.dev ? ' <span class="tag">dev</span>' : ''}${p.abandoned ? ` <span class="tag tag-bad" title="${typeof p.abandoned === 'string' ? `Replacement: ${esc(p.abandoned)}` : 'No replacement named'}">abandoned</span>` : ''}</td>
        <td>${esc(p.judged ?? p.current)}</td>
        <td>${p.phpConstraint ? `<code>${esc(p.phpConstraint)}</code>` : '<span class="muted">none</span>'}</td>
        <td>${supportLabel(p.supports).replace(/\*\*(.*)\*\*/, '<strong>$1</strong>')}${p.error ? ` <span class="muted small" title="${esc(p.error)}">(lookup failed)</span>` : ''}</td>
        <td>${p.supports === 'yes' || p.supports === 'no-limit' ? '<span class="muted">already fine</span>' : esc(p.lowestSupporting ?? (p.abandoned && typeof p.abandoned === 'string' ? `none; switch to ${p.abandoned}` : 'none found'))}</td>
      </tr>`)
    .join('');
  return `
    <section class="group">
      <h2 class="group-title">Composer packages</h2>
      ${root}
      ${c.packages.length ? `<div class="table-wrap"><table>
        <thead><tr><th>Package</th><th>Version</th><th>Needs PHP</th><th>OK on ${c.target}?</th><th>Lowest version that is</th></tr></thead>
        <tbody>${rows}</tbody></table></div>` : '<p class="muted">No packages listed.</p>'}
      <p class="muted small">"Unknown" means the lookup failed or the version wasn't on Packagist. The checker never guesses.</p>
    </section>`;
}

$('report').addEventListener('click', async (e) => {
  const t = e.target as HTMLElement;
  const loc = t.closest<HTMLButtonElement>('.loc');
  if (loc) {
    show(loc.dataset.file!, Number(loc.dataset.line));
    $('editor').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  const action = t.closest<HTMLButtonElement>('[data-action]')?.dataset.action;
  if (!action || !state.result) return;
  if (action === 'copy') {
    const text = copySummary(state.result, state.composer);
    try {
      await navigator.clipboard.writeText(text);
      status('Summary copied. Paste it into your job post or message.');
    } catch {
      status(text);
    }
    track('php8_copy_summary', { target: state.target });
  } else {
    const md = action === 'md';
    const body = md ? toMarkdown(state.result, state.composer) : toJson(state.result, state.composer);
    const url = URL.createObjectURL(new Blob([body], { type: md ? 'text/markdown' : 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `php${state.target}-upgrade-report.${md ? 'md' : 'json'}` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track('php8_export', { format: action, target: state.target });
  }
});
