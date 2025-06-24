import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoCircledIcon } from "@radix-ui/react-icons"

interface SafetyScoreTooltipProps {
  score: number
  totalYawns: number
  totalDrowsiness: number
  totalAlerts: number
  averageEAR: number
}

export function SafetyScoreTooltip({
  score,
  totalYawns,
  totalDrowsiness,
  totalAlerts,
  averageEAR,
}: SafetyScoreTooltipProps) {
  // คำนวณการหักคะแนนแต่ละส่วน
  const yawnDeduction = Math.min(totalYawns * 2, 30)
  const drowsyDeduction = Math.min(totalDrowsiness * 5, 40)
  const alertDeduction = Math.min(totalAlerts * 10, 50)

  let earDeduction = 0
  if (averageEAR < 0.25) {
    earDeduction = 20
  } else if (averageEAR < 0.3) {
    earDeduction = 10
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <InfoCircledIcon className="h-4 w-4 text-blue-500 cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="w-80 p-4">
          <div className="space-y-2">
            <h4 className="font-medium text-center border-b pb-1">วิธีคำนวณคะแนนความปลอดภัย</h4>
            <p className="text-sm">คะแนนเริ่มต้น: 100 คะแนน</p>
            <div className="space-y-1 text-sm">
              <p>การหักคะแนน:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>หาว: -{yawnDeduction} คะแนน (2 คะแนน/ครั้ง สูงสุด 30)</li>
                <li>ง่วง: -{drowsyDeduction} คะแนน (5 คะแนน/ครั้ง สูงสุด 40)</li>
                <li>อันตราย: -{alertDeduction} คะแนน (10 คะแนน/ครั้ง สูงสุด 50)</li>
                <li>ค่า EAR ต่ำ: -{earDeduction} คะแนน</li>
              </ul>
            </div>
            <div className="text-sm pt-1 border-t">
              <p>คะแนนสุดท้าย: {score}/100</p>
              <p className="text-xs text-muted-foreground mt-1">
                ระดับคะแนน: 80-100 = ดีมาก, 60-79 = ดี, 40-59 = ปานกลาง, 0-39 = ต้องปรับปรุง
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
