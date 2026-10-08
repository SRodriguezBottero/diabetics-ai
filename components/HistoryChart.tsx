import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  TimeScale,
  ScriptableContext,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale);

type Reading = { value: number; timestamp: string };

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    fill: boolean;
    borderColor: string;
    backgroundColor: string;
    tension: number;
    pointRadius: number;
    pointBackgroundColor?: (ctx: ScriptableContext<'line'>) => string;
  }[];
};

function detectAnomalies(readings: Reading[]) {
  return readings.map(r => r.value < 70 || r.value > 180);
}

export default function HistoryChart() {
  const { t } = useTranslation('common');
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<boolean[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/readings')
      .then(r => r.json())
      .then((readings: Reading[]) => {
        if (!Array.isArray(readings)) {
          setLoading(false);
          return;
        }
        const anomalyArr = detectAnomalies(readings);
        setAnomalies(anomalyArr);
        setData({
          labels: readings.map((r) => r.timestamp),
          datasets: [
            {
              label: t('history.glucoseLabel'),
              data: readings.map((r) => r.value),
              fill: false,
              borderColor: '#6366f1',
              backgroundColor: '#6366f1',
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: (ctx: ScriptableContext<'line'>) => {
                const idx = ctx.dataIndex;
                return anomalyArr[idx] ? '#ef4444' : '#6366f1';
              },
            },
          ],
        });
        setLoading(false);
      });
  }, [t]);

  if (loading) return <div className="text-center text-gray-500 py-8">{t('history.loading')}</div>;
  if (!data || !data.labels.length) return <div className="text-center text-gray-500 py-8">{t('history.noData')}</div>;

  return (
    <div className="space-y-4">
      <Line
        data={data}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false },
          },
          scales: {
            x: {
              type: 'category',
              title: { display: true, text: t('history.dateAxis') },
            },
            y: {
              title: { display: true, text: 'mg/dL' },
              beginAtZero: true,
            },
          },
        }}
      />
      {anomalies.some(Boolean) && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl">
          <strong>{t('history.alert')}</strong> {t('history.alertMessage')}
        </div>
      )}
    </div>
  );
}
