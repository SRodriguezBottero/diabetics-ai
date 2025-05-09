import { useState } from 'react';

function toCSV(rows: { value: number; timestamp: string }[]): string {
  const header = 'Fecha,Glucosa (mg/dL)';
  const body = rows.map(r => `${r.timestamp},${r.value}`).join('\n');
  return `${header}\n${body}`;
}

export default function ExportData({ userId }: { userId: string }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/readings?userId=${userId}`);
      if (!res.ok) throw new Error('No se pudo obtener los datos');
      const data: { value: number; timestamp: string }[] = await res.json();
      if (!data.length) throw new Error('No hay datos para exportar');
      const csv = toCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'glucosa.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
      else setError('Error desconocido');
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
        {downloading ? 'Exportando...' : 'Exportar datos (CSV)'}
      </button>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </section>
  );
} 