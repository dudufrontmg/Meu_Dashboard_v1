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
import { CauseChartData, CauseTableData } from '../types';

interface CauseChartProps {
  data: CauseChartData[];
  tableData: CauseTableData[];
}

const DashedLineLabel = (props: any) => {
  const { x, y, value, chartTop = 30 } = props;
  const labelY = y - 20;

  return (
    <g>
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={labelY}
        stroke="#8b5cf6"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <circle
        cx={x}
        cy={y}
        r={4}
        fill="#8b5cf6"
      />
      <text
        x={x}
        y={labelY - 5}
        textAnchor="middle"
        fill="#8b5cf6"
        fontSize={14}
        fontWeight="500"
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
      fontSize={14}
      fontWeight="500"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      {Math.round(value)}h
    </text>
  );
};

const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const words = payload.value.split(' ');
  const maxWordsPerLine = 4;
  const lines: string[] = [];
  
  for (let i = 0; i < words.length; i += maxWordsPerLine) {
    lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
  }

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={index * 14}
          dy={10}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={12}
          fontWeight="400"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border rounded shadow-sm">
      <p className="text-sm font-medium text-gray-600 max-w-[200px] break-words">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Variação' ? formatPercentage(entry.value) : `${Math.round(entry.value)}h`}
        </p>
      ))}
    </div>
  );
};

const CauseTable: React.FC<{ data: CauseTableData[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full">
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-b border-gray-200 last:border-0">
              <td className="px-6 py-4 text-base font-medium text-gray-900 w-1/4">
                Causa {item.id}
              </td>
              <td className="px-6 py-4 text-base text-gray-700 w-3/4">
                {item.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const CauseChart: React.FC<CauseChartProps> = ({ data, tableData }) => {
  const chartConfig = useMemo(() => {
    if (!data?.length) {
      return {
        barDomain: [0, 100],
        variationDomain: [-25, 100],
        margin: { top: 30, right: 30, left: 30, bottom: 30 }
      };
    }

    const maxBarValue = Math.max(...data.map(d => d.horas || 0));
    const maxDomain = Math.ceil(maxBarValue * 1.2);

    const maxVariacao = Math.max(...data.map(d => d.variacao || 0));
    
    const variationDomain = [
      -25, // Minimum fixed at -25%
      Math.ceil(Math.max(100, maxVariacao * 1.2)) // Maximum with 20% margin
    ];

    return {
      barDomain: [0, maxDomain],
      variationDomain,
      margin: { top: 30, right: 30, left: 30, bottom: 30 }
    };
  }, [data]);

  // Sort data by hours in descending order
  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => (b.horas || 0) - (a.horas || 0));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-base font-medium text-gray-700 mb-6">Análise e Classificação das Causas</h3>
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          Selecione uma etapa para visualizar os dados
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-base font-medium text-gray-700 mb-6">Análise e Classificação das Causas</h3>
        <ResponsiveContainer width="100%" height={600}>
          <ComposedChart
            data={sortedData}
            margin={chartConfig.margin}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis 
              dataKey="name" 
              height={60}
              tick={<CustomXAxisTick />}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={0}
            />
            <YAxis 
              yAxisId="left"
              domain={chartConfig.barDomain}
              tick={{ 
                fontSize: 12, 
                fill: '#6b7280',
                fontWeight: '400',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${Math.round(value)}h`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={chartConfig.variationDomain}
              tick={{ 
                fontSize: 12,
                fill: '#8b5cf6',
                fontWeight: '400',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              tickFormatter={(value) => `${value}%`}
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
              iconSize={10}
              wrapperStyle={{ 
                fontSize: '14px',
                fontWeight: '400',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                marginTop: '-10px'
              }}
            />
            <Bar 
              yAxisId="left" 
              dataKey="horas" 
              fill="#22c55e"
              name="Horas"
              barSize={40}
            >
              <LabelList content={<CustomLabel />} position="top" />
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="variacao"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Variação"
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            >
              <LabelList 
                content={DashedLineLabel}
                position="top"
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <CauseTable data={tableData} />
    </div>
  );
};