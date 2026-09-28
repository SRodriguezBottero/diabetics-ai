import { useState, useEffect } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';

async function fetchReadings() {
  const res = await fetch('/api/readings');
  return res.ok ? await res.json() : [];
}

async function fetchInsight() {
  const res = await fetch('/api/insights');
  return res.ok ? (await res.json()).insight : '';
}

export default function ShareWithDoctor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch('/api/subscription');
        if (res.ok) {
          const data = await res.json();
          setIsPremium(data.isPremium);
        }
      } catch (e) {
        console.error('Error checking subscription:', e);
      }
    };
    checkSubscription();
  }, []);

  const handleShare = async () => {
    if (!isPremium) return;
    
    setLoading(true);
    setError(null);
    try {
      const [readings, insight] = await Promise.all([
        fetchReadings(),
        fetchInsight(),
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
    } catch {
      setError('No se pudo generar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  if (isPremium === null) {
    return (
      <section className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </section>
    );
  }

  if (!isPremium) {
    return (
      <section className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Compartir con Doctor</h3>
            <p className="text-sm text-gray-500 mt-1">
              Genera un reporte PDF profesional para tu médico
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
              ⭐ Premium
            </span>
            <Link
              href="/pricing"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-semibold text-sm"
            >
              Actualizar
            </Link>
          </div>
        </div>
      </section>
    );
  }

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