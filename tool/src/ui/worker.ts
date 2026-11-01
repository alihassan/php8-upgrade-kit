import { analyze } from '../engine/analyze';
import type { SourceFile, Target } from '../engine/types';

self.onmessage = (e: MessageEvent<{ id: number; files: SourceFile[]; target: Target }>) => {
  const { id, files, target } = e.data;
  const started = performance.now();
  try {
    const result = analyze(files, target);
    self.postMessage({ id, result, ms: Math.round(performance.now() - started) });
  } catch (err) {
    self.postMessage({ id, error: (err as Error).message });
  }
};
