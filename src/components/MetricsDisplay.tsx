import React from 'react';
import { Clock } from 'lucide-react';
import clsx from 'clsx';
import { formatHours } from '../utils/format';

interface MetricsDisplayProps {
  metrics: {
    horasVendidas: number;
    horasPlanejadas: number;
    horasConsumidas: number;
    horasImprodutivas: number;
    saldoHoras: number;
  };
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics }) => {
  const MetricCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <div className={clsx("bg-white rounded-lg shadow p-4", `border-l-4 ${color}`)}>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <p className="text-2xl font-bold mt-2">{formatHours(value)}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      <MetricCard
        title="Horas Vendidas"
        value={metrics.horasVendidas}
        color="border-green-500"
      />
      <MetricCard
        title="Horas Planejadas"
        value={metrics.horasPlanejadas}
        color="border-orange-500"
      />
      <MetricCard
        title="Horas Consumidas"
        value={metrics.horasConsumidas}
        color="border-blue-500"
      />
      <MetricCard
        title="Horas Improdutivas"
        value={metrics.horasImprodutivas}
        color="border-red-500"
      />
      <MetricCard
        title="Saldo de Horas"
        value={metrics.saldoHoras}
        color="border-gray-500"
      />
    </div>
  );
};