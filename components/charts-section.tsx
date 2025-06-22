"use client"
import type React from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
} from "recharts"
import type { DailyStats, HistoricalData, AlertData } from "@/lib/types"

// Interface ที่รับ Props
interface ChartsSectionProps {
  data?: (HistoricalData | AlertData)[]
  stats?: DailyStats | null
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ data = [], stats = null }) => {
  // ส่วนของ Pie Chart (เหมือนเดิม)
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        กำลังโหลดข้อมูลสถิติ...
      </div>
    )
  }

  const { totalYawns, totalDrowsiness, totalAlerts } = stats

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
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent === 0 || !percent) return null
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // ส่วนของ Line Chart
  const lineChartData = data
    .filter((item): item is HistoricalData => "ear" in item && item.ear !== undefined)
    .map((item) => ({
      ...item,
      time: new Date(item.timestamp).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' }),
    }))

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* กราฟเส้นแสดงค่า EAR */}
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-medium text-center mb-4">ค่าสายตา (EAR) ตามช่วงเวลา</h3>
        {lineChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 0.5]} />
              <Tooltip
                formatter={(value: number) => [value.toFixed(3), "EAR"]}
                labelFormatter={(label) => `เวลา: ${label}`}
              />
              <Legend />
              <Line type="monotone" dataKey="ear" stroke="#8884d8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">ไม่มีข้อมูล EAR</div>
        )}
      </div>

      {/* กราฟวงกลม */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-medium text-center mb-4">ประเภทของเหตุการณ์</h3>
          {eventTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventTypeData}
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
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    // --- จุดแก้ไข ---
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
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
    </div>
  )
}

export default ChartsSection
