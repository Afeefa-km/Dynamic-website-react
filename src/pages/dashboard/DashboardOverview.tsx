import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Ban,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  PackageCheck,
  Receipt,
  ShoppingBag,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/Spinner'
import { type OrderStatus } from '../../constants/enums'
import { formatMoney } from '../../lib/format'
import { orderApi } from '../../lib/services'
import type { DashboardUnderperformer, OrderDashboard } from '../../types/api'
import { useDashboard } from './DashboardLayout'

type Period = 'week' | 'month' | 'year' | 'custom'

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Weekly',
  month: 'Monthly',
  year: 'Yearly',
  custom: 'Custom range',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: '#eab308',
  Confirmed: '#3b82f6',
  Shipped: '#6366f1',
  Delivered: '#0f6b4a',
  Cancelled: '#ef4444',
}

const REVENUE_COLOR = '#2563eb'
const PROFIT_COLOR = '#059669'

function isoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dateFromIso(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(value: string) {
  return dateFromIso(value).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatDateRange(from: string, to: string) {
  return `${formatDate(from)} – ${formatDate(to)}`
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function rangeFor(period: Exclude<Period, 'custom'>) {
  const to = new Date()
  const from = new Date()
  if (period === 'week') from.setDate(from.getDate() - 6)
  if (period === 'month') from.setDate(from.getDate() - 29)
  if (period === 'year') from.setFullYear(from.getFullYear() - 1)
  return { from: isoDate(from), to: isoDate(to) }
}

function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

function formatAxisDate(iso: string, grain: OrderDashboard['grain']) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  if (grain === 'Month') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
  if (grain === 'Week') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
}

export default function DashboardOverview() {
  const { store } = useDashboard()
  const [period, setPeriod] = useState<Period>('month')
  const initial = rangeFor('month')
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(initial.from)
  const [draftTo, setDraftTo] = useState(initial.to)
  const [activeDateField, setActiveDateField] = useState<'from' | 'to'>('from')
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(dateFromIso(initial.from)))

  const applyPeriod = (next: Period) => {
    setPeriod(next)
    setIsPeriodMenuOpen(false)
    if (next === 'custom') {
      setDraftFrom(from)
      setDraftTo(to)
      setActiveDateField('from')
      setCalendarMonth(startOfMonth(dateFromIso(from)))
      setIsDatePickerOpen(true)
      return
    }
    const range = rangeFor(next)
    setFrom(range.from)
    setTo(range.to)
    setIsDatePickerOpen(false)
  }

  const selectDate = (date: Date) => {
    const value = isoDate(date)
    if (value > isoDate(new Date())) return

    if (activeDateField === 'from') {
      setDraftFrom(value)
      setDraftTo('')
      setActiveDateField('to')
      return
    }

    if (!draftFrom || value < draftFrom) {
      setDraftFrom(value)
      setDraftTo('')
      return
    }
    setDraftTo(value)
  }

  const applyCustomRange = () => {
    if (!draftFrom || !draftTo || draftFrom > draftTo) return
    setFrom(draftFrom)
    setTo(draftTo)
    setPeriod('custom')
    setIsDatePickerOpen(false)
  }

  const query = useQuery({
    queryKey: ['orders-dashboard', from, to],
    queryFn: () => orderApi.dashboard(from, to),
    enabled: !!from && !!to && from <= to,
  })

  const data = query.data

  const statusPie = useMemo(
    () => (data?.byStatus ?? []).map((s) => ({ name: s.status, value: s.count, revenue: s.revenue })),
    [data],
  )

  const series = useMemo(
    () =>
      (data?.series ?? []).map((p) => ({
        ...p,
        label: formatAxisDate(p.periodStart, data?.grain ?? 'Day'),
      })),
    [data],
  )

  const calendarDays = useMemo(() => {
    const firstDay = calendarMonth.getDay()
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
    return Array.from({ length: firstDay + daysInMonth }, (_, index) =>
      index < firstDay ? null : new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - firstDay + 1),
    )
  }, [calendarMonth])

  if (query.isPending) return <PageLoader label="Loading dashboard…" />

  if (query.isError || !data) {
    return (
      <EmptyState
        icon={<CalendarRange className="h-6 w-6" />}
        title="Couldn't load the dashboard"
        text="Please check the date range and try again."
      />
    )
  }

  const empty = data.current.totalOrders === 0

  return (
    <div className="relative space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">How {store.name} is performing for the selected dates</p>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isPeriodMenuOpen}
            onClick={() => setIsPeriodMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none transition hover:border-brand-500 focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
          >
            <span>{PERIOD_LABELS[period]} · {formatDateRange(from, to)}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {isPeriodMenuOpen && (
            <div role="listbox" className="absolute right-0 top-full z-40 mt-2 min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={period === option}
                  onClick={() => applyPeriod(option)}
                  className={`block w-full px-4 py-2 text-left text-sm font-medium transition hover:bg-brand-50 ${period === option ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}
                >
                  {PERIOD_LABELS[option]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`absolute right-0 top-16 z-30 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:top-14 ${isDatePickerOpen ? '' : 'hidden'}`}>
        {isDatePickerOpen && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveDateField('from')}
                className={`rounded-xl border p-3 text-left transition ${activeDateField === 'from' ? 'border-brand-700 ring-2 ring-brand-100' : 'border-gray-200 hover:border-brand-500'}`}
              >
                <span className="block text-xs font-medium text-gray-500">From</span>
                <span className="mt-1 block text-sm font-semibold text-gray-900">{draftFrom ? formatDate(draftFrom) : 'Select date'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDateField('to')}
                className={`rounded-xl border p-3 text-left transition ${activeDateField === 'to' ? 'border-brand-700 ring-2 ring-brand-100' : 'border-gray-200 hover:border-brand-500'}`}
              >
                <span className="block text-xs font-medium text-gray-500">To</span>
                <span className="mt-1 block text-sm font-semibold text-gray-900">{draftTo ? formatDate(draftTo) : 'Select date'}</span>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <p className="text-sm font-semibold">{calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-gray-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-y-1">
              {calendarDays.map((date, index) => {
                if (!date) return <span key={`empty-${index}`} />
                const value = isoDate(date)
                const disabled = value > isoDate(new Date())
                const selected = value === draftFrom || value === draftTo
                const inRange = !!draftFrom && !!draftTo && value > draftFrom && value < draftTo
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDate(date)}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
                      selected ? 'bg-brand-700 font-semibold text-white' : inRange ? 'bg-brand-50 text-brand-900' : 'text-gray-700 hover:bg-gray-100'
                    } disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                onClick={applyCustomRange}
                className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      <Hero data={data} currency={store.currency} />

      {data.productsMissingCost > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="min-w-0 flex-1">
            {data.productsMissingCost} active {data.productsMissingCost === 1 ? 'item has' : 'items have'} no purchase price, so
            profit is overstated for {data.productsMissingCost === 1 ? 'it' : 'them'}.
          </p>
          <Link to="/dashboard/inventory" className="font-semibold underline underline-offset-2 hover:text-amber-700">
            Add in inventory
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Highlight
          label="Most ordered"
          icon={<Star className="h-5 w-5" />}
          tone="amber"
          title={data.mostOrderedItem}
          detail={
            data.mostOrderedItem
              ? `${data.mostOrderedQuantity.toLocaleString()} ${data.mostOrderedQuantity === 1 ? 'unit' : 'units'} sold`
              : 'No sales in this period yet'
          }
        />
        <Highlight
          label="Most profitable"
          icon={<Trophy className="h-5 w-5" />}
          tone="emerald"
          title={data.mostProfitableItem?.productName ?? null}
          detail={
            data.mostProfitableItem
              ? `${formatMoney(data.mostProfitableItem.profit, store.currency)} profit from ${data.mostProfitableItem.quantity.toLocaleString()} sold`
              : 'Nothing has made a profit in this period yet'
          }
        />
        <Highlight
          label="Lowest performer"
          icon={<TrendingDown className="h-5 w-5" />}
          tone="red"
          title={data.underperformers[0]?.productName ?? null}
          detail={
            data.underperformers[0]
              ? underperformerSummary(data.underperformers[0], store.currency)
              : 'Every active item is selling at or above average'
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Orders placed"
          value={data.current.placedOrders.toLocaleString()}
          previous={data.previous.placedOrders}
          current={data.current.placedOrders}
          icon={<PackageCheck className="h-5 w-5" />}
          tint="bg-emerald-50 text-emerald-700"
        />
        <Kpi
          label="Items sold"
          value={data.current.itemsSold.toLocaleString()}
          previous={data.previous.itemsSold}
          current={data.current.itemsSold}
          icon={<ShoppingBag className="h-5 w-5" />}
          tint="bg-blue-50 text-blue-700"
        />
        <Kpi
          label="Average order"
          value={formatMoney(data.current.averageOrderValue, store.currency)}
          previous={data.previous.averageOrderValue}
          current={data.current.averageOrderValue}
          icon={<Receipt className="h-5 w-5" />}
          tint="bg-violet-50 text-violet-700"
        />
        <Kpi
          label="Cancelled orders"
          value={data.current.cancelledOrders.toLocaleString()}
          previous={data.previous.cancelledOrders}
          current={data.current.cancelledOrders}
          invert
          icon={<Ban className="h-5 w-5" />}
          tint="bg-red-50 text-red-600"
        />
      </div>

      {empty ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="No orders in this range"
          text="Try a wider date range, or share your store so customers can place an order."
        />
      ) : (
        <>
          <ChartCard title="Revenue and profit" subtitle="Money in, and what was left after the purchase cost of the items sold">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={REVENUE_COLOR} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={REVENUE_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PROFIT_COLOR} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={PROFIT_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={compactNumber} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [formatMoney(Number(value), store.currency), String(name)]} />
                <Legend iconType="plainline" />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={REVENUE_COLOR} fill="url(#revenueFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke={PROFIT_COLOR} fill="url(#profitFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <ChartCard title="Orders over time" subtitle="Placed and cancelled volume">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f0" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f3f4f6' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="placed" name="Placed" stackId="orders" fill={STATUS_COLORS.Delivered} maxBarSize={28} />
                  <Bar dataKey="cancelled" name="Cancelled" stackId="orders" fill={STATUS_COLORS.Cancelled} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Order status" subtitle="How orders break down">
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={68} outerRadius={96} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                      {statusPie.map((s) => (
                        <Cell key={s.name} fill={STATUS_COLORS[s.name as OrderStatus]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value} orders`, String(name)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{data.current.totalOrders.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">orders</span>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {statusPie.map((s) => (
                  <li key={s.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.name as OrderStatus] }} />
                    <span className="flex-1 text-gray-600">{s.name}</span>
                    <span className="font-semibold tabular-nums">{s.value}</span>
                  </li>
                ))}
              </ul>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Most profitable items" subtitle="Profit after purchase cost, cancelled orders excluded">
              <RankedBars
                rows={data.topProfitItems.map((item) => ({
                  name: item.productName,
                  value: item.profit,
                  label: formatMoney(item.profit, store.currency),
                  note: `${item.quantity.toLocaleString()} sold · ${formatMoney(item.revenue, store.currency)} revenue`,
                }))}
                color={PROFIT_COLOR}
                emptyText="No item has made a profit in this period."
              />
            </ChartCard>

            <ChartCard title="Bestsellers" subtitle="Ranked by units sold">
              <RankedBars
                rows={data.topItems.map((item) => ({
                  name: item.productName,
                  value: item.quantity,
                  label: `${item.quantity.toLocaleString()} sold`,
                  note: `${formatMoney(item.revenue, store.currency)} revenue`,
                }))}
                color={REVENUE_COLOR}
                emptyText="Nothing sold in this period."
              />
            </ChartCard>
          </div>
        </>
      )}

      <ChartCard title="Lowest performers" subtitle="Active items that earned the least in this period, worst first">
        {data.underperformers.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Every active item is selling at or above average in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="py-2.5 pr-4 font-medium">Item</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sold</th>
                  <th className="px-4 py-2.5 text-right font-medium">Profit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Unsold stock</th>
                  <th className="px-4 py-2.5 text-right font-medium">Stock at cost</th>
                  <th className="py-2.5 pl-4 font-medium">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.underperformers.map((item) => {
                  const reason = underperformerReason(item)
                  return (
                    <tr key={item.productName}>
                      <td className="max-w-56 truncate py-3 pr-4 font-medium">{item.productName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.quantity.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${item.profit < 0 ? 'text-red-600' : ''}`}>
                        {formatMoney(item.profit, store.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.stockQuantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(item.stockValue, store.currency)}</td>
                      <td className="py-3 pl-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${reason.className}`}>
                          {reason.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  )
}

const axisTick = { fontSize: 12, fill: '#6b7280' }

const compactNumber = (value: number) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)

function underperformerReason(item: DashboardUnderperformer) {
  if (item.profit < 0) return { label: 'Sold at a loss', className: 'bg-red-50 text-red-700' }
  if (item.quantity === 0) return { label: 'No sales', className: 'bg-amber-50 text-amber-800' }
  return { label: 'Below average profit', className: 'bg-gray-100 text-gray-700' }
}

function underperformerSummary(item: DashboardUnderperformer, currency: string) {
  if (item.profit < 0) return `Lost ${formatMoney(-item.profit, currency)} on ${item.quantity.toLocaleString()} sold`
  if (item.quantity === 0) {
    const tiedUp = item.stockValue > 0 ? ` · ${formatMoney(item.stockValue, currency)} tied up` : ''
    return `None sold, ${item.stockQuantity.toLocaleString()} in stock${tiedUp}`
  }
  return `Only ${formatMoney(item.profit, currency)} profit from ${item.quantity.toLocaleString()} sold`
}

function Hero({ data, currency }: { data: OrderDashboard; currency: string }) {
  const { revenue, cost, profit, marginPercent } = data.current
  const change = delta(profit, data.previous.profit)
  const profitShare = revenue > 0 ? Math.min(100, Math.max(0, (profit / revenue) * 100)) : 0

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative grid gap-6 xl:grid-cols-[1fr_1.2fr] xl:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm text-white/70">
            <CircleDollarSign className="h-4 w-4" /> Profit in this period
          </p>
          <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{formatMoney(profit, currency)}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            {change > 0.05 ? <TrendingUp className="h-3.5 w-3.5" /> : change < -0.05 ? <TrendingDown className="h-3.5 w-3.5" /> : null}
            {changeText(change, data.previous.profit)}
          </p>
        </div>

        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            <HeroStat label="Revenue" value={formatMoney(revenue, currency)} />
            <HeroStat label="Purchase cost" value={formatMoney(cost, currency)} />
            <HeroStat label="Margin" value={`${marginPercent}%`} />
          </div>
          {revenue > 0 && profit >= 0 && (
            <div className="mt-4">
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
                <div className="bg-white/35" style={{ width: `${100 - profitShare}%` }} />
                <div className="bg-accent" style={{ width: `${profitShare}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-white/70">
                <span>Cost of items sold</span>
                <span>Profit kept</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
      <p className="text-xs text-white/70">{label}</p>
      <p className="mt-1 text-lg font-semibold break-words">{value}</p>
    </div>
  )
}

const HIGHLIGHT_TONES = {
  amber: { chip: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400' },
  emerald: { chip: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  red: { chip: 'bg-red-100 text-red-600', bar: 'bg-red-500' },
}

function Highlight({
  label,
  icon,
  tone,
  title,
  detail,
}: {
  label: string
  icon: ReactNode
  tone: keyof typeof HIGHLIGHT_TONES
  title: string | null
  detail: string
}) {
  const colors = HIGHLIGHT_TONES[tone]
  return (
    <div className={`${card} relative overflow-hidden`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${colors.bar}`} />
      <div className="flex items-center gap-3">
        <span className={`rounded-2xl p-2.5 ${colors.chip}`}>{icon}</span>
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
      <p className="mt-4 truncate text-lg font-semibold" title={title ?? undefined}>
        {title ?? '—'}
      </p>
      <p className="mt-1 text-sm text-gray-500">{detail}</p>
    </div>
  )
}

interface RankedRow {
  name: string
  value: number
  label: string
  note: string
}

/** Ranked list with a proportional bar per row; one colour because every row is the same measure. */
function RankedBars({ rows, color, emptyText }: { rows: RankedRow[]; color: string; emptyText: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-gray-500">{emptyText}</p>
  const max = Math.max(...rows.map((r) => r.value), 0)
  return (
    <ol className="space-y-4">
      {rows.map((row, i) => (
        <li key={`${row.name}-${i}`} className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-medium" title={row.name}>{row.name}</p>
              <p className="shrink-0 text-sm font-semibold tabular-nums">{row.label}</p>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full" style={{ width: `${max > 0 ? Math.max(2, (row.value / max) * 100) : 0}%`, background: color }} />
            </div>
            <p className="mt-1 text-xs text-gray-500">{row.note}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

const card = 'rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md'

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-gray-500">{subtitle}</p>
      {children}
    </section>
  )
}

function changeText(change: number, previous: number) {
  if (change === 0) return 'Same as previous period'
  if (previous === 0) return 'Nothing in the previous period'
  return `${change > 0 ? '+' : ''}${change.toFixed(0)}% vs previous period`
}

function Kpi({
  label,
  value,
  current,
  previous,
  icon,
  tint,
  invert,
}: {
  label: string
  value: string
  current: number
  previous: number
  icon: ReactNode
  tint: string
  invert?: boolean
}) {
  const change = delta(current, previous)
  const up = change > 0.05
  const down = change < -0.05
  const good = invert ? down : up
  const bad = invert ? up : down

  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <span className={`rounded-2xl p-2.5 ${tint}`}>{icon}</span>
      </div>
      <p
        className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          good ? 'bg-emerald-50 text-emerald-700' : bad ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : down ? <TrendingDown className="h-3.5 w-3.5" /> : null}
        {changeText(change, previous)}
      </p>
    </div>
  )
}
