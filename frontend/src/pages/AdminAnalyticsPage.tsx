import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function AdminAnalyticsPage() {
  type Series = { labels: string[]; data: number[] };
  type Insights = {
    series?: { usersDaily: Series; vendorsDaily: Series; productsDaily: Series; ordersDaily: Series; activitiesDaily: Series };
  };

  const { data: insights, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-insights-page'],
    queryFn: async () => {
      const res = await api.get('/admin/insights');
      return res.data as Insights;
    }
  });

  function Sparkline({ data, color = '#2563eb' }: { data: number[]; color?: string }) {
    const w = 480, h = 120, p = 8;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = Math.max(max - min, 1);
    const step = data.length > 1 ? (w - p * 2) / (data.length - 1) : 0;
    const points = data.map((v, i) => {
      const x = p + i * step;
      const y = h - p - ((v - min) / range) * (h - p * 2);
      return `${x},${y}`;
    }).join(' ');
    const last = data[data.length - 1] ?? 0;
    const first = data[0] ?? 0;
    const trendUp = last >= first;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline fill="none" stroke={color} strokeWidth={2} points={points} />
        <circle cx={p} cy={h - p - ((first - min) / range) * (h - p * 2)} r={3} fill={color} />
        <circle cx={p + (data.length - 1) * step} cy={h - p - ((last - min) / range) * (h - p * 2)} r={4} fill={trendUp ? '#16a34a' : '#dc2626'} />
      </svg>
    );
  }
  function hasNonZero(arr: number[] | undefined): boolean {
    if (!arr || arr.length === 0) return false;
    return arr.some((v) => Number(v) > 0);
  }

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Analytics</h1>
          <p>Evolution quotidienne des indicateurs (14 derniers jours)</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => refetch()} disabled={isLoading}>{isLoading ? 'Chargement…' : 'Actualiser'}</button>
        </div>
      </div>

      {isError ? <div className="error" role="alert">{(error as any)?.message || 'Erreur de chargement des données'}</div> : null}

      <div className="dashboard-section" style={{ marginTop: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="chart-card">
            <h3>Utilisateurs / jour</h3>
            {isLoading ? <div>Chargement…</div> : !insights?.series || !hasNonZero(insights.series.usersDaily.data) ? <div>Aucune donnée</div> : <Sparkline data={insights.series.usersDaily.data} color="#2563eb" />}
          </div>
          <div className="chart-card">
            <h3>Vendeurs / jour</h3>
            {isLoading ? <div>Chargement…</div> : !insights?.series || !hasNonZero(insights.series.vendorsDaily.data) ? <div>Aucune donnée</div> : <Sparkline data={insights.series.vendorsDaily.data} color="#16a34a" />}
          </div>
          <div className="chart-card" style={{ gridColumn: '1/-1' }}>
            <h3>Produits / jour</h3>
            {isLoading ? <div>Chargement…</div> : !insights?.series || !hasNonZero(insights.series.productsDaily.data) ? <div>Aucune donnée</div> : <Sparkline data={insights.series.productsDaily.data} color="#7c3aed" />}
          </div>
          <div className="chart-card">
            <h3>Commandes / jour</h3>
            {isLoading ? <div>Chargement…</div> : !insights?.series || !hasNonZero(insights.series.ordersDaily.data) ? <div>Aucune donnée</div> : <Sparkline data={insights.series.ordersDaily.data} color="#f59e0b" />}
          </div>
          <div className="chart-card">
            <h3>Activités / jour</h3>
            {isLoading ? <div>Chargement…</div> : !insights?.series || !hasNonZero(insights.series.activitiesDaily.data) ? <div>Aucune donnée</div> : <Sparkline data={insights.series.activitiesDaily.data} color="#dc2626" />}
          </div>
        </div>
      </div>
    </div>
  );
}
