import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center space-x-2 mb-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={index} className="flex items-center flex-1">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isCompleted ? <Check className="w-3 h-3" /> : stepNumber}
              </div>
              {index < totalSteps - 1 && (
                <div 
                  className={`flex-1 h-1 mx-2 rounded ${
                    isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-600' : 'bg-gray-300'
                  }`} 
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-600 text-center">
        Etapa {currentStep + 1} de {totalSteps}: {stepLabels[currentStep]}
      </p>
    </div>
  );
}
