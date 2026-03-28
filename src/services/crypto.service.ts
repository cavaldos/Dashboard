export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
}

export interface FearGreedData {
  value: number;
  value_classification: string;
  timestamp: number;
  time_until_update: string;
}

export interface FearGreedHistory {
  value: number;
  value_classification: string;
  timestamp: number;
}

export interface Liquidation {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  price: number;
  size: number;
  value: number;
  time: number;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface LiquidationStats {
  totalLong: number;
  totalShort: number;
  totalValue: number;
  largestLong: number;
  largestShort: number;
  timestamp: number;
}

export interface GlobalData {
  btc_dominance: number;
  eth_dominance: number;
  total_market_cap: number;
  total_volume: number;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const ALTERNATIVE_ME_API = 'https://api.alternative.me/fng';

export const CryptoService = {
  async getTopCoins(limit = 10): Promise<Coin[]> {
    try {
      const response = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
      );
      if (!response.ok) throw new Error('Failed to fetch top coins');
      return response.json();
    } catch (error) {
      console.error('Error fetching top coins:', error);
      return [];
    }
  },

  async getFearGreedIndex(): Promise<FearGreedData | null> {
    try {
      const response = await fetch(ALTERNATIVE_ME_API);
      if (!response.ok) throw new Error('Failed to fetch fear & greed index');
      const data = await response.json();
      return data.data[0] || null;
    } catch (error) {
      console.error('Error fetching fear & greed index:', error);
      return null;
    }
  },

  async getFearGreedHistory(days = 7): Promise<FearGreedHistory[]> {
    try {
      const response = await fetch(`${ALTERNATIVE_ME_API}/?limit=${days}`);
      if (!response.ok) throw new Error('Failed to fetch fear & greed history');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching fear & greed history:', error);
      return getMockFearGreedHistory(days);
    }
  },

  async getRecentLiquidations(limit = 20): Promise<Liquidation[]> {
    try {
      const response = await fetch(
        'https://api.coinglass.io/api/v1/futures/liquidation?symbol=ALL&type=0&limit=' + limit,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch liquidations');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching liquidations:', error);
      return getMockLiquidations();
    }
  },

  async getPriceHistory(coinId: string, days = 7): Promise<PricePoint[]> {
    try {
      const response = await fetch(
        `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      if (!response.ok) throw new Error('Failed to fetch price history');
      const data = await response.json();
      return data.prices || [];
    } catch (error) {
      console.error('Error fetching price history:', error);
      return getMockPriceHistory(coinId, days);
    }
  },

  async getGlobalData(): Promise<GlobalData | null> {
    try {
      const response = await fetch(`${COINGECKO_API}/global`);
      if (!response.ok) throw new Error('Failed to fetch global data');
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error fetching global data:', error);
      return null;
    }
  },

  async getLiquidationStats(): Promise<LiquidationStats> {
    try {
      const response = await fetch(
        'https://api.coinglass.io/api/v1/futures/liquidationStats?timeType=1',
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch liquidation stats');
      const data = await response.json();
      if (data.data) {
        return {
          totalLong: data.data.totalLong || 0,
          totalShort: data.data.totalShort || 0,
          totalValue: data.data.total || 0,
          largestLong: data.data.largestLong || 0,
          largestShort: data.data.largestShort || 0,
          timestamp: Date.now(),
        };
      }
      return getMockLiquidationStats();
    } catch (error) {
      console.error('Error fetching liquidation stats:', error);
      return getMockLiquidationStats();
    }
  },
};

function getMockLiquidations(): Liquidation[] {
  const now = Date.now();
  return [
    { id: '1', symbol: 'BTC', side: 'long', price: 67420, size: 2.5, value: 168550, time: now - 120000 },
    { id: '2', symbol: 'ETH', side: 'short', price: 3080, size: 15, value: 46200, time: now - 180000 },
    { id: '3', symbol: 'SOL', side: 'long', price: 142.5, size: 500, value: 71250, time: now - 240000 },
    { id: '4', symbol: 'BNB', side: 'short', price: 585, size: 80, value: 46800, time: now - 300000 },
    { id: '5', symbol: 'XRP', side: 'long', price: 0.52, size: 50000, value: 26000, time: now - 360000 },
    { id: '6', symbol: 'BTC', side: 'short', price: 67200, size: 1.8, value: 120960, time: now - 420000 },
    { id: '7', symbol: 'ETH', side: 'long', price: 3050, size: 20, value: 61000, time: now - 480000 },
    { id: '8', symbol: 'SOL', side: 'short', price: 140.2, size: 800, value: 112160, time: now - 540000 },
    { id: '9', symbol: 'DOGE', side: 'long', price: 0.082, size: 200000, value: 16400, time: now - 600000 },
    { id: '10', symbol: 'AVAX', side: 'short', price: 35.5, size: 600, value: 21300, time: now - 660000 },
  ];
}

function getMockFearGreedHistory(days: number): FearGreedHistory[] {
  const history: FearGreedHistory[] = [];
  const now = Math.floor(Date.now() / 1000);
  for (let i = days - 1; i >= 0; i--) {
    history.push({
      value: Math.floor(Math.random() * 60) + 20,
      value_classification: 'Fear',
      timestamp: now - i * 86400,
    });
  }
  return history;
}

function getMockPriceHistory(coinId: string, days: number): PricePoint[] {
  const history: PricePoint[] = [];
  const now = Date.now();
  const basePrice = coinId === 'bitcoin' ? 67000 : coinId === 'ethereum' ? 3050 : 140;
  
  for (let i = days * 24; i >= 0; i--) {
    const variation = (Math.random() - 0.5) * basePrice * 0.05;
    history.push({
      timestamp: now - i * 3600000,
      price: basePrice + variation,
    });
  }
  return history;
}

function getMockLiquidationStats(): LiquidationStats {
  return {
    totalLong: Math.floor(Math.random() * 50000000) + 10000000,
    totalShort: Math.floor(Math.random() * 50000000) + 10000000,
    totalValue: Math.floor(Math.random() * 100000000) + 20000000,
    largestLong: Math.floor(Math.random() * 500000) + 100000,
    largestShort: Math.floor(Math.random() * 500000) + 100000,
    timestamp: Date.now(),
  };
}

export default CryptoService;
