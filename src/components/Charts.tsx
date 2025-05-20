import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { formatHours, formatPercentage } from '../utils/format';

interface ChartsProps {
  atividadeData: any[];
}

const DashedLineLabel = (props: any) => {
  const { x, y, value, chartTop = 80 } = props;
  const labelY = y - ((y - chartTop) * 0.5);

  return (
    <g>
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={labelY}
        stroke="#8b5cf6"
        strokeWidth={0.5}
        strokeDasharray="2 2"
      />
      <circle
        cx={x}
        cy={y}
        r={3}
        fill="#8b5cf6"
      />
      <text
        x={x}
        y={labelY - 5}
        textAnchor="middle"
        fill="#8b5cf6"
        fontSize={10}
        fontWeight="300"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {formatPercentage(value)}
      </text>
    </g>
  );
};

const CustomLabel = (props: any) => {
  const { x, y, value, width } = props;
  const offset = 12;
  return (
    <text
      x={x + width / 2}
      y={y - offset}
      textAnchor="middle"
      fill="#666666"
      fontSize={10}
      fontWeight="300"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      {formatHours(value)}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border rounded shadow-sm">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Variação PlanXCons' ? formatPercentage(entry.value) : formatHours(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const Charts: React.FC<ChartsProps> = ({ atividadeData }) => {
  const chartConfig = useMemo(() => {
    if (!atividadeData?.length) {
      return {
        barDomain: [0, 100],
        variationDomain: [0, 100],
        margin: { top: 80, right: 30, left: 20, bottom: 20 }
      };
    }

    // Encontrar o maior valor entre todas as barras
    const maxBarValue = Math.max(...atividadeData.flatMap(d => [
      d.Vendido || 0,
      d.Planejado || 0,
      d.Consumido || 0,
      d.Improdutivo || 0
    ]));

    // Calcular o domínio com 20% de margem acima do valor máximo
    const maxDomain = Math.ceil(maxBarValue * 1.2);

    // Calcular o domínio da variação
    const maxVariacao = Math.max(...atividadeData.map(d => d['Variação PlanXCons'] || 0));
    const minVariacao = Math.min(...atividadeData.map(d => d['Variação PlanXCons'] || 0));
    
    const variationDomain = [
      Math.floor(Math.min(0, minVariacao - 10) / 10) * 10,
      Math.ceil(Math.max(150, maxVariacao + 20) / 10) * 10
    ];

    return {
      barDomain: [0, maxDomain],
      variationDomain,
      margin: { top: 80, right: 30, left: 20, bottom: 20 }
    };
  }, [atividadeData]);

  if (!atividadeData?.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-6">Análise das Horas</h3>
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          Selecione um projeto para visualizar os dados
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-6">Análise das Horas</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={atividadeData}
          margin={chartConfig.margin}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis 
            dataKey="name" 
            tick={{ 
              fontSize: 11, 
              fill: '#6b7280',
              fontWeight: '300',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            dy={8}
          />
          <YAxis 
            yAxisId="left"
            domain={chartConfig.barDomain}
            tick={{ 
              fontSize: 10, 
              fill: '#6b7280',
              fontWeight: '300',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={formatHours}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={chartConfig.variationDomain}
            tick={{ display: 'none' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(229, 231, 235, 0.2)' }}
          />
          <Legend 
            verticalAlign="top"
            height={36}
            iconSize={8}
            wrapperStyle={{ 
              fontSize: '11px',
              fontWeight: '300',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              marginTop: '-30px'
            }}
          />
          <Bar 
            yAxisId="left" 
            dataKey="Vendido" 
            fill="#22c55e"
            name="Vendido"
            barSize={30}
          >
            <LabelList content={<CustomLabel />} position="top" />
          </Bar>
          <Bar 
            yAxisId="left" 
            dataKey="Planejado" 
            fill="#f97316"
            name="Planejado"
            barSize={30}
          >
            <LabelList content={<CustomLabel />} position="top" />
          </Bar>
          <Bar 
            yAxisId="left" 
            dataKey="Consumido" 
            fill="#3b82f6"
            name="Consumido"
            barSize={30}
          >
            <LabelList content={<CustomLabel />} position="top" />
          </Bar>
          <Bar 
            yAxisId="left" 
            dataKey="Improdutivo" 
            fill="#ef4444"
            name="Improdutivo"
            barSize={30}
          >
            <LabelList content={<CustomLabel />} position="top" />
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Variação PlanXCons"
            stroke="#8b5cf6"
            strokeWidth={0.5}
            name="Variação PlanXCons"
            dot={false}
          >
            <LabelList 
              content={DashedLineLabel}
              position="top"
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};