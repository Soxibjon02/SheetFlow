import React, { useMemo } from 'react';
import { DashboardWidget } from '../../core/types/dashboard';
import { SheetData } from '../../core/types/sheet';
import { calculate } from '../../core/calculations/engine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, BarChart3, LineChart as LineIcon, PieChart as PieIcon, Hash } from 'lucide-react';

interface WidgetRendererProps {
  widget: DashboardWidget;
  sheetData: SheetData;
  onRemove?: (widgetId: string) => void;
}

const PALETTE = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#14b8a6', // teal
];

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  sheetData,
  onRemove,
}) => {
  // Execute calculation for widget
  const calcResult = useMemo(() => {
    try {
      return calculate(sheetData.rows, widget.calculation);
    } catch (err: any) {
      return {
        function: widget.calculation.function,
        value: 'Calculation error',
        formattedValue: 'Error',
        rowCountEvaluated: 0,
      };
    }
  }, [sheetData.rows, widget.calculation]);

  const chartData = useMemo(() => {
    if (Array.isArray(calcResult.value)) {
      return calcResult.value.map((item: any) => ({
        name: item.group || 'Item',
        value: typeof item.value === 'number' ? item.value : 0,
        count: item.count || 0,
      }));
    }
    return [];
  }, [calcResult.value]);

  const sizeClass = {
    sm: 'col-span-12 md:col-span-4',
    md: 'col-span-12 md:col-span-6',
    lg: 'col-span-12 md:col-span-8',
    full: 'col-span-12',
  }[widget.size || 'md'];

  // Custom Adaptive Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{label}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold">
            {new Intl.NumberFormat('en-US').format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`${sizeClass} rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-md p-5 flex flex-col justify-between shadow-lg hover:border-slate-300 dark:hover:border-slate-700/80 transition-all`}
    >
      {/* Widget Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800/60 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>{widget.title}</span>
          </h3>
          {widget.subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{widget.subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
            {widget.calculation.function}
          </span>
          {onRemove && (
            <button
              onClick={() => onRemove(widget.id)}
              className="text-slate-400 hover:text-rose-500 text-xs px-1 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Widget Body */}
      <div className="flex-1 flex flex-col justify-center min-h-[160px]">
        {/* KPI CARD */}
        {widget.type === 'kpi' && (
          <div className="py-4 flex flex-col items-center justify-center text-center space-y-2">
            <div
              className="text-4xl md:text-5xl font-extrabold tracking-tight"
              style={{ color: widget.customOptions?.color || '#10b981' }}
            >
              {calcResult.formattedValue}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>
                Based on {calcResult.rowCountEvaluated || sheetData.rows.length} records
              </span>
            </div>
          </div>
        )}


        {/* BAR CHART */}
        {widget.type === 'bar' && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                {widget.customOptions?.showGrid && (
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                )}
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  fill={widget.customOptions?.color || '#6366f1'}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* LINE CHART */}
        {widget.type === 'line' && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                {widget.customOptions?.showGrid && (
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                )}
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={widget.customOptions?.color || '#10b981'}
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AREA CHART */}
        {widget.type === 'area' && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id={`grad_${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill={`url(#grad_${widget.id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* DONUT / PIE CHART */}
        {(widget.type === 'donut' || widget.type === 'pie') && (
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={widget.type === 'donut' ? 55 : 0}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TABLE VIEW */}
        {widget.type === 'table' && (
          <div className="overflow-x-auto max-h-60 scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-100 dark:bg-slate-950/80 sticky top-0 text-slate-700 dark:text-slate-300">
                <tr>
                  {sheetData.metadata.columns.slice(0, 5).map((col) => (
                    <th key={col.id} className="py-2 px-3 font-semibold border-b border-slate-200 dark:border-slate-800">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/40">
                {sheetData.rows.slice(0, 8).map((r, i) => (
                  <tr key={i} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-300">
                    {sheetData.metadata.columns.slice(0, 5).map((col) => (
                      <td key={col.id} className="py-2 px-3 truncate max-w-[150px]">
                        {String(r[col.name] || '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};
