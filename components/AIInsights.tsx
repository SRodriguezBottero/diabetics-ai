import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

export default function AIInsights() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/insights?locale=${locale}`)
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
        setError(t('insights.error'));
        setLoading(false);
      });
  }, [locale, t]);

  return (
    <section className="bg-emerald-50 shadow-md rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-2">{t('insights.title')}</h2>
      <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
        ⚠️ {t('ai.disclaimer')}
      </div>
      {loading ? (
        <p className="text-gray-500">{t('insights.analyzing')}</p>
      ) : error ? (
        <p className="text-red-700" role="alert">{error}</p>
      ) : limitReached ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-900 text-sm">{insight}</p>
          <Link
            href="/pricing"
            className="inline-block mt-2 text-sm font-medium text-emerald-800 hover:text-emerald-900 underline"
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