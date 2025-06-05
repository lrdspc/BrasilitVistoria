import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  className?: string;
}

export const ProgressBar = ({ currentStep, totalSteps, stepLabels, className }: ProgressBarProps) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Progress indicators */}
      <div className="flex items-center space-x-2 mb-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center flex-1">
              {/* Step circle */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                {
                  'bg-green-500 text-white': isCompleted,
                  'bg-blue-600 text-white': isCurrent,
                  'bg-gray-300 text-gray-600': isUpcoming,
                }
              )}>
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Progress line */}
              {index < totalSteps - 1 && (
                <div className={cn(
                  'flex-1 h-1 mx-2 rounded transition-colors',
                  {
                    'bg-green-500': isCompleted,
                    'bg-blue-600': isCurrent && index + 2 <= currentStep,
                    'bg-gray-300': isUpcoming || (isCurrent && index + 2 > currentStep),
                  }
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step label */}
      <p className="text-sm text-gray-600 text-center">
        Etapa {currentStep} de {totalSteps}: {stepLabels[currentStep - 1]}
      </p>
    </div>
  );
};
