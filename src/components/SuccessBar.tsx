import { barColor } from '../utils/scoreTheme';

interface SuccessBarProps { ok: number; fail: number }

export default function SuccessBar({ ok, fail }: SuccessBarProps) {
  const total = ok + fail;
  const ratio = total > 0 ? ok / total : 0;
  return (
    <div className="w-20 h-1.5 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: 'var(--border)' }}>
      <div
        className={`h-full rounded-full ${barColor(ratio)}`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
