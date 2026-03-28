import { cn } from '~/lib/utils';

interface FearGreedChartProps {
  value: number;
  label: string;
  className?: string;
}

export const FearGreedChart: React.FC<FearGreedChartProps> = ({ value, label, className }) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const rotation = (clampedValue / 100) * 180 - 90;

  const getColor = (val: number) => {
    if (val <= 25) return 'var(--red)';
    if (val <= 45) return '#ff8844';
    if (val <= 55) return 'var(--yellow)';
    if (val <= 75) return 'var(--accent)';
    return 'var(--green)';
  };

  const color = getColor(clampedValue);

  return (
    <div className={cn('fear-greed-chart', className)}>
      <svg viewBox="0 0 200 120" className="fear-greed-svg">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--red)" />
            <stop offset="25%" stopColor="#ff8844" />
            <stop offset="45%" stopColor="var(--yellow)" />
            <stop offset="55%" stopColor="var(--yellow)" />
            <stop offset="75%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--green)" />
          </linearGradient>
        </defs>
        
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(clampedValue / 100) * 251.2} 251.2`}
        />
        
        <g transform={`translate(100, 100) rotate(${rotation})`}>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-60"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="0" cy="0" r="6" fill={color} />
        </g>
        
        <text x="100" y="95" textAnchor="middle" className="fear-greed-value">
          {clampedValue}
        </text>
        
        <text x="20" y="115" textAnchor="start" className="fear-greed-label">
          0
        </text>
        <text x="180" y="115" textAnchor="end" className="fear-greed-label">
          100
        </text>
      </svg>
      
      <div className="fear-greed-label-text" style={{ color }}>
        {label}
      </div>
    </div>
  );
};
