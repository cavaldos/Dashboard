import type { CSSProperties } from 'react';

import { cn } from '~/lib/utils';
import '~/style/sentiment-gauge-chart.css';

export type SentimentGaugeTone = 'fear' | 'warning' | 'neutral' | 'greed';

type SentimentGaugeChartProps = {
  value: number;
  label: string;
  tone?: SentimentGaugeTone;
  className?: string;
};

const clampValue = (value: number) => {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
};

export const SentimentGaugeChart = ({ value, label, tone = 'fear', className }: SentimentGaugeChartProps) => {
  const normalized = clampValue(value);
  const cssVars = {
    '--sentiment-progress': `${normalized}%`,
  } as CSSProperties;

  return (
    <article className={cn('sentiment-gauge', `is-${tone}`, className)} style={cssVars}>
      <div className="sentiment-gauge-face">
        <div className="sentiment-gauge-arc" aria-hidden="true" />

        <p className="sentiment-gauge-value" aria-label={`Gauge value ${Math.round(normalized)} out of 100`}>
          {Math.round(normalized)}
        </p>

        <div className="sentiment-gauge-track" aria-hidden="true">
          <span className="sentiment-gauge-end is-min" />
          <span className="sentiment-gauge-end is-max" />
          <span className="sentiment-gauge-progress" />
          <span className="sentiment-gauge-marker" />
        </div>

        <div className="sentiment-gauge-scale" aria-hidden="true">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      <p className="sentiment-gauge-label">{label}</p>
    </article>
  );
};
