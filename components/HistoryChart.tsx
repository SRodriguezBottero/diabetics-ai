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
  // Anomaly: <70 (low) or >180 (high)
  return readings.map(r => r.value < 70 || r.value > 180);
}

export default function HistoryChart({ userId }: { userId: string }) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<boolean[]>([]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/readings?userId=${userId}`)
      .then(r => r.json())
      .then((readings: Reading[]) => {
        const anomalyArr = detectAnomalies(readings);
        setAnomalies(anomalyArr);
        setData({
          labels: readings.map((r) => r.timestamp),
          datasets: [
            {
              label: 'Glucosa (mg/dL)',
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
  }, [userId]);

  if (loading) return <div className="text-center text-gray-500">Cargando gráfico...</div>;
  if (!data || !data.labels.length) return <div className="text-center text-gray-500">Aún no hay datos suficientes para mostrar el gráfico.</div>;

  return (
    <section className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Histórico de glucosa</h2>
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
              title: { display: true, text: 'Fecha' },
            },
            y: {
              title: { display: true, text: 'mg/dL' },
              beginAtZero: true,
            },
          },
        }}
      />
      {/* Alert for anomalies */}
      {anomalies.some(Boolean) && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
          <strong>¡Alerta!</strong> Se detectaron valores inusuales (&lt;70 o &gt;180 mg/dL) en tus mediciones recientes. Consulta a tu médico si no esperabas estos resultados.
        </div>
      )}
    </section>
  );
}
