import { useState } from 'react';
import jsPDF from 'jspdf';

async function fetchReadings(userId: string) {
  const res = await fetch(`/api/readings?userId=${userId}`);
  return res.ok ? await res.json() : [];
}

async function fetchInsight(userId: string) {
  const res = await fetch(`/api/insights?userId=${userId}`);
  return res.ok ? (await res.json()).insight : '';
}

export default function ShareWithDoctor({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    setError(null);
    try {
      const [readings, insight] = await Promise.all([
        fetchReadings(userId),
        fetchInsight(userId),
      ]);
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Reporte de Glucosa - Diabetics-AI', 14, 18);
      doc.setFontSize(12);
      doc.text(`Fecha de reporte: ${new Date().toLocaleString('es-ES')}`, 14, 28);
      doc.text('Resumen AI:', 14, 38);
      doc.setFont('helvetica', 'normal');
      // Split AI summary into lines and print
      const summaryLines = doc.splitTextToSize(insight || 'Sin resumen disponible.', 180);
      doc.text(summaryLines, 14, 46);
      // Calculate Y position after summary
      let y = 46 + summaryLines.length * 6 + 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Últimas mediciones:', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Fecha y hora', 14, y);
      doc.text('mg/dL', 80, y);
      y += 6;
      readings.slice(-15).reverse().forEach((r: { value: number; timestamp: string }) => {
        doc.text(new Date(r.timestamp).toLocaleString('es-ES'), 14, y);
        doc.text(`${r.value}`, 80, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      doc.save('reporte-glucosa.pdf');
    } catch (e) {
      setError('No se pudo generar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white shadow rounded-lg p-4 mb-4 flex items-center gap-4">
      <button
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-semibold"
        onClick={handleShare}
        disabled={loading}
      >
        {loading ? 'Generando PDF...' : 'Compartir con Doctor'}
      </button>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </section>
  );
} 