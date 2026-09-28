import { useState, useEffect } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

export default function ShareWithDoctor() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
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

  const fetchReadings = async () => {
    const res = await fetch('/api/readings');
    return res.ok ? await res.json() : [];
  };

  const fetchInsight = async () => {
    const res = await fetch(`/api/insights?locale=${locale}`);
    return res.ok ? (await res.json()).insight : '';
  };

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
      doc.text(t('share.pdfTitle'), 14, 18);
      doc.setFontSize(12);
      const dateLocale = locale === 'en' ? 'en-US' : 'es-ES';
      doc.text(`${t('share.pdfReportDate')} ${new Date().toLocaleString(dateLocale)}`, 14, 28);
      doc.text(t('share.pdfSummary'), 14, 38);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(insight || t('share.pdfNoSummary'), 180);
      doc.text(summaryLines, 14, 46);
      let y = 46 + summaryLines.length * 6 + 10;
      doc.setFont('helvetica', 'bold');
      doc.text(t('share.pdfReadings'), 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(t('share.pdfDateHeader'), 14, y);
      doc.text('mg/dL', 80, y);
      y += 6;
      readings.slice(-15).reverse().forEach((r: { value: number; timestamp: string }) => {
        doc.text(new Date(r.timestamp).toLocaleString(dateLocale), 14, y);
        doc.text(`${r.value}`, 80, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      doc.save('glucose-report.pdf');
    } catch {
      setError(t('share.pdfError'));
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
        {loading ? t('share.generating') : t('share.button')}
      </button>
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </section>
  );
} 