import { useMemo } from 'react';
import { cn } from '~/lib/utils';

interface PriceChartProps {
  data: { timestamp: number; price: number }[];
  color?: 'green' | 'red';
  height?: number;
  className?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ 
  data, 
  color = 'green', 
  height = 60,
  className 
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { path: '', areaPath: '', minPrice: 0, maxPrice: 0, change: 0 };
    
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;
    
    const width = 200;
    const padding = 4;
    const chartHeight = height - padding * 2;
    
    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * width,
      y: padding + chartHeight - ((d.price - minPrice) / range) * chartHeight,
    }));
    
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${path} L ${width} ${height - padding} L 0 ${height - padding} Z`;
    
    const change = data.length > 1 ? ((data[data.length - 1].price - data[0].price) / data[0].price) * 100 : 0;
    
    return { path, areaPath, minPrice, maxPrice, change };
  }, [data, height]);

  const strokeColor = color === 'green' ? 'var(--green)' : 'var(--red)';

  const formatPrice = (price: number) => {
    if (price >= 1000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return '$' + price.toFixed(2);
  };

  return (
    <div className={cn('price-chart', className)}>
      <svg viewBox={`0 0 200 ${height}`} className="price-chart-svg">
        <defs>
          <linearGradient id={`areaGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <path
          d={chartData.areaPath}
          fill={`url(#areaGradient-${color})`}
        />
        
        <path
          d={chartData.path}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      <div className="price-chart-info">
        <span className="price-chart-min">{formatPrice(chartData.minPrice)}</span>
        <span className="price-chart-change" style={{ color: strokeColor }}>
          {chartData.change >= 0 ? '+' : ''}{chartData.change.toFixed(2)}%
        </span>
        <span className="price-chart-max">{formatPrice(chartData.maxPrice)}</span>
      </div>
    </div>
  );
};
