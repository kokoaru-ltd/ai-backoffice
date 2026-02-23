import { TrendingUp, TrendingDown } from 'lucide-react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts'
import type { SparklinePoint } from '../types'

interface StatCardProps {
  label: string
  value: string
  trend?: {
    value: string
    positive: boolean
  }
  subtitle?: string
  sparklineData?: SparklinePoint[]
  sparklineColor?: string
  accentColor?: string
  children?: React.ReactNode
}

export function StatCard({
  label,
  value,
  trend,
  subtitle,
  sparklineData,
  sparklineColor = '#2563eb',
  accentColor,
  children,
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between relative overflow-hidden${accentColor ? ' border-l-4' : ''}`}
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            {trend.positive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-sm font-semibold ${
                trend.positive ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {trend.positive ? '+' : ''}
              {trend.value}
            </span>
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>
        )}
      </div>

      {/* インラインスパークライン */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3 h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`sparkGrad-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparklineColor}
                strokeWidth={1.5}
                fill={`url(#sparkGrad-${label})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* カスタムコンテンツ（ミニバーチャートなど） */}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
