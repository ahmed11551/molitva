import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import './ProgressChart.css';

interface ProgressDataPoint {
  date: string;
  completed: number;
  total: number;
}

interface ProgressChartProps {
  data: ProgressDataPoint[];
  periodStart: string;
  periodEnd: string;
}

export default function ProgressChart({ data, periodStart, periodEnd }: ProgressChartProps) {
  // Если данных мало, создаём интерполяцию
  const chartData = data.length > 0 ? data : generateMockData(periodStart, periodEnd);

  return (
    <div className="progress-chart">
      <h3 className="chart-title">График прогресса</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#2e7d32" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            fontSize={12}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}.${date.getMonth() + 1}`;
            }}
          />
          <YAxis stroke="#666" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'completed') {
                return [`${value.toLocaleString()} намазов`, 'Восполнено'];
              }
              return [value, name];
            }}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString('ru-RU');
            }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#2e7d32"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCompleted)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Генерирует моковые данные для демонстрации, если реальных данных нет
function generateMockData(start: string, end: string): ProgressDataPoint[] {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const data: ProgressDataPoint[] = [];
  const total = 1000; // Примерное значение
  let completed = 0;
  
  // Генерируем данные за последние 30 дней или за весь период (если меньше 30 дней)
  const dataPoints = Math.min(days, 30);
  const dailyRate = total / days;
  
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor((days / dataPoints) * i));
    completed += dailyRate * (days / dataPoints);
    
    data.push({
      date: date.toISOString(),
      completed: Math.round(completed),
      total: total,
    });
  }
  
  return data;
}

