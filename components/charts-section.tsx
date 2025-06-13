import type React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

interface Event {
  type: "yawn" | "fatigue"
  severity: 1 | 2 | 3
}

interface ChartsSectionProps {
  events: Event[]
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ events }) => {
  // Count events by type
  const yawnEvents = events.filter((e) => e.type === "yawn").length
  const fatigueEvents = events.filter((e) => e.type === "fatigue").length
  const totalEvents = yawnEvents + fatigueEvents

  // Calculate percentages for event types
  const yawnPercentage = totalEvents > 0 ? (yawnEvents / totalEvents) * 100 : 0
  const fatiguePercentage = totalEvents > 0 ? (fatigueEvents / totalEvents) * 100 : 0

  // Count events by severity
  const lowSeverity = events.filter((e) => e.severity === 1).length
  const mediumSeverity = events.filter((e) => e.severity === 2).length
  const highSeverity = events.filter((e) => e.severity === 3).length
  const totalSeverity = lowSeverity + mediumSeverity + highSeverity

  // Calculate percentages for severity levels
  const lowPercentage = totalSeverity > 0 ? (lowSeverity / totalSeverity) * 100 : 0
  const mediumPercentage = totalSeverity > 0 ? (mediumSeverity / totalSeverity) * 100 : 0
  const highPercentage = totalSeverity > 0 ? (highSeverity / totalSeverity) * 100 : 0

  const eventTypeData = [
    { name: "Yawn", value: yawnPercentage },
    { name: "Fatigue", value: fatiguePercentage },
  ]

  const severityData = [
    { name: "Low", value: lowPercentage },
    { name: "Medium", value: mediumPercentage },
    { name: "High", value: highPercentage },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
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
    <div style={{ display: "flex", justifyContent: "space-around", width: "100%" }}>
      <div>
        <h3>Event Types</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={eventTypeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {eventTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3>Severity Levels</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={severityData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {severityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ChartsSection
