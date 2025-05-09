
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface BillWizardStepInfo {
  id: number;
  name: string;
  subtext?: string;
}

interface BillWizardStepsProps {
  steps: BillWizardStepInfo[];
  currentStepId: number;
}

export default function BillWizardSteps({ steps, currentStepId }: BillWizardStepsProps) {
  return (
    <div className="flex items-center justify-between p-4 md:p-6 bg-card shadow-md rounded-lg">
      {steps.map((step, index) => {
        const isActive = step.id === currentStepId;
        const isCompleted = step.id < currentStepId;
        const isUpcoming = step.id > currentStepId;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 text-sm md:text-base font-semibold transition-all duration-300',
                  isActive
                    ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg'
                    : isCompleted
                    ? 'bg-accent border-accent text-accent-foreground'
                    : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : step.id}
              </div>
              <div className="mt-2">
                <p
                  className={cn(
                    'text-xs md:text-sm font-medium',
                    isActive ? 'text-primary font-bold' : isCompleted ? 'text-accent' : 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </p>
                {step.subtext && (
                  <p className="text-xs text-muted-foreground/80 hidden sm:block">{step.subtext}</p>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-2 md:mx-4 rounded transition-all duration-300',
                  isCompleted || isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
