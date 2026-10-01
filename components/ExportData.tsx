import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ExportData() {
  const { t } = useTranslation('common');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toCSV = (rows: { value: number; timestamp: string }[]): string => {
    const header = t('export.csvHeader');
    const body = rows.map(r => `${r.timestamp},${r.value}`).join('\n');
    return `${header}\n${body}`;
  };

  const handleExport = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch('/api/readings');
      if (!res.ok) throw new Error(t('export.fetchError'));
      const data: { value: number; timestamp: string }[] = await res.json();
      if (!data.length) throw new Error(t('export.noData'));
      const csv = toCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'glucose.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
      else setError(t('export.unknownError'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="bg-white shadow rounded-lg p-4 mb-4 flex items-center gap-4">
      <button
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-semibold"
        onClick={handleExport}
        disabled={downloading}
      >
        {downloading ? t('export.exporting') : t('export.button')}
      </button>
      {error && <span className="text-red-700 text-sm" role="alert">{error}</span>}
    </section>
  );
} 