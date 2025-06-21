import type React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { DailyStats, HistoricalData } from "@/lib/types"

interface ChartsSectionProps {
  data?: HistoricalData[]
  stats?: DailyStats | null
  showAllCharts?: boolean // Optional prop to control which charts are shown
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ data = [], stats = null, showAllCharts = false }) => {
  if (!stats) {
    // Return a loading or empty state if stats are not available
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        กำลังโหลดข้อมูลสถิติ...
      </div>
    )
  }

  // Use stats for the pie charts
  const { totalYawns, totalDrowsiness, totalAlerts } = stats
  const totalEvents = totalYawns + totalDrowsiness + totalAlerts

  const eventTypeData = [
    { name: "การหาว", value: totalYawns },
    { name: "ความง่วง", value: totalDrowsiness + totalAlerts },
  ].filter((d) => d.value > 0)

  const severityData = [
    { name: "ระดับต่ำ (หาว)", value: totalYawns },
    { name: "ระดับกลาง (ง่วง)", value: totalDrowsiness },
    { name: "ระดับสูง (วิกฤต)", value: totalAlerts },
  ].filter((d) => d.value > 0)

  const COLORS = ["#0088FE", "#FFBB28", "#FF8042", "#00C49F"]

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    if (percent === 0) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-medium text-center mb-4">ประเภทของเหตุการณ์</h3>
        {eventTypeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {eventTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${value} ครั้ง`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">ไม่มีข้อมูลเหตุการณ์</div>
        )}
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-medium text-center mb-4">ระดับความรุนแรง</h3>
        {severityData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index + 1 % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${value} ครั้ง`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">ไม่มีข้อมูลความรุนแรง</div>
        )}
      </div>
    </div>
  )
}

export default ChartsSection
