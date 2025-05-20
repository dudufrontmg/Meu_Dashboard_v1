import React from 'react';
import { Clock } from 'lucide-react';
import clsx from 'clsx';
import { formatHours, formatPercentage } from '../utils/format';
import { CauseMetrics } from '../types';

interface CauseMetricsDisplayProps {
  metrics: CauseMetrics;
}

export const CauseMetricsDisplay: React.FC<CauseMetricsDisplayProps> = ({ metrics }) => {
  const MetricCard = ({ title, value, format, color }: { 
    title: string; 
    value: number | string; 
    format?: 'hours' | 'percentage';
    color: string;
  }) => (
    <div className={clsx("bg-white rounded-lg shadow p-4", `border-l-4 ${color}`)}>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <p className="text-2xl font-bold mt-2">
        {format === 'hours' ? formatHours(Number(value)) :
         format === 'percentage' ? formatPercentage(Number(value)) :
         value}
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <MetricCard
        title="Etapa Selecionada"
        value={metrics.etapaSelecionada || 'Nenhuma etapa selecionada'}
        color="border-purple-500"
      />
      <MetricCard
        title="Variação"
        value={metrics.variacao}
        format="percentage"
        color="border-blue-500"
      />
      <MetricCard
        title="Diferença de Horas"
        value={metrics.diferencaHoras}
        format="hours"
        color="border-orange-500"
      />
    </div>
  );
};