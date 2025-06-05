import { Check } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  return (
    <div className="flex items-center space-x-2 mb-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isCurrent
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {isCompleted ? (
                <Check className="w-3 h-3" />
              ) : (
                stepNumber
              )}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`flex-1 h-1 rounded ${
                  isCompleted ? "bg-green-500" : isCurrent ? "bg-blue-600" : "bg-gray-300"
                }`}
                style={{ minWidth: "20px" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
