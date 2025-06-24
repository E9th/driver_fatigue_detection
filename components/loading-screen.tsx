"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Car, Database, Wifi, CheckCircle, Shield } from "lucide-react"

interface LoadingScreenProps {
  onLoadingComplete?: () => void
}

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { icon: Database, label: "เชื่อมต่อฐานข้อมูล", duration: 800 },
    { icon: Wifi, label: "ตรวจสอบการเชื่อมต่อ", duration: 600 },
    { icon: Car, label: "โหลดข้อมูลอุปกรณ์", duration: 800 },
    { icon: Shield, label: "เตรียมระบบความปลอดภัย", duration: 500 },
    { icon: CheckCircle, label: "เตรียมพร้อมใช้งาน", duration: 400 },
  ]

  useEffect(() => {
    let totalElapsed = 0
    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0)

    console.log("🔄 LoadingScreen: เริ่มต้น loading", { totalDuration })

    const progressInterval = setInterval(() => {
      totalElapsed += 50
      const newProgress = Math.min((totalElapsed / totalDuration) * 100, 100)
      setProgress(newProgress)

      // อัพเดท current step
      let stepElapsed = 0
      for (let i = 0; i < steps.length; i++) {
        stepElapsed += steps[i].duration
        if (totalElapsed <= stepElapsed) {
          setCurrentStep(i)
          break
        }
      }

      // เมื่อเสร็จสิ้น
      if (totalElapsed >= totalDuration) {
        clearInterval(progressInterval)
        setProgress(100)
        setCurrentStep(steps.length - 1)

        console.log("✅ LoadingScreen: เสร็จสิ้น loading")

        setTimeout(() => {
          console.log("🚀 LoadingScreen: เรียก onLoadingComplete")
          if (onLoadingComplete) {
            onLoadingComplete()
          }
        }, 500)
      }
    }, 50)

    return () => {
      clearInterval(progressInterval)
    }
  }, [onLoadingComplete])

  const CurrentIcon = steps[currentStep]?.icon || Database

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg">
                <Car className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Driver Safety System
              </h1>
              <p className="text-gray-600 dark:text-gray-400">กำลังเตรียมระบบให้พร้อมใช้งาน</p>
            </div>

            {/* Current Step */}
            <div className="flex items-center justify-center space-x-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <CurrentIcon className="h-6 w-6 text-blue-600 animate-pulse" />
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {steps[currentStep]?.label || "กำลังโหลด..."}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <Progress value={progress} className="h-3 bg-gray-200 dark:bg-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{Math.round(progress)}% เสร็จสิ้น</p>
            </div>

            {/* Steps Indicator */}
            <div className="flex justify-center space-x-2">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <div
                    key={index}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      index <= currentStep
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 scale-110"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                  </div>
                )
              })}
            </div>

            {/* Loading Animation */}
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
