import { CheckCircle } from "lucide-react"

export function StepIndicator({ steps, currentStep }) {
  const progress = (currentStep / (steps.length - 1)) * 100

  return (
    <div className="space-y-4">
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div
              key={step}
              className={`flex flex-col items-center space-y-1 ${
                isCompleted ? "text-green-600" : isCurrent ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                  isCompleted
                    ? "border-green-500 bg-green-500 text-white"
                    : isCurrent
                      ? "border-green-500 text-green-600"
                      : "border-muted-foreground text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <span className="text-xs font-medium">{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
