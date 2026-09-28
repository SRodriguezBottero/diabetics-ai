import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AIInsights() {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/insights')
      .then(r => r.json())
      .then(data => {
        if (data.limitReached) {
          setLimitReached(true);
          setInsight(data.insight || '');
        } else {
          setInsight(data.insight || '');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudo obtener el análisis de la IA.');
        setLoading(false);
      });
  }, []);

  return (
    <section className="bg-emerald-50 shadow-md rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-2">🔎 AI Insights</h2>
      {loading ? (
        <p className="text-gray-500">Analizando tus datos...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : limitReached ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">{insight}</p>
          <Link
            href="/pricing"
            className="inline-block mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-800"
          >
            Actualizar a Premium →
          </Link>
        </div>
      ) : (
        <div className="text-gray-700 whitespace-pre-line max-h-60 overflow-y-auto pr-2">
          {insight}
        </div>
      )}
    </section>
  );
} 