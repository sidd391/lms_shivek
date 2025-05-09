
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import BillWizardSteps, { type BillWizardStepInfo } from '@/components/create-bill/bill-wizard-steps';
import StepPatient from '@/components/create-bill/step-patient';
import StepDoctor from '@/components/create-bill/step-doctor';
import StepTest from '@/components/create-bill/step-test';
import StepSummary from '@/components/create-bill/step-summary';

// Define types for Patient and Doctor if not already globally available
// For simplicity, using 'any' for now, but should be replaced with actual types.
interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: string;
  imageSeed?: string;
}

interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  phone: string;
  email?: string;
  imageSeed?: string;
}


const wizardStepsConfig: BillWizardStepInfo[] = [
  { id: 1, name: "Patient" },
  { id: 2, name: "Doctor", subtext: "Optional" },
  { id: 3, name: "Test" },
  { id: 4, name: "Summary" },
];

export default function CreateBillPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = React.useState<Doctor | null>(null);
  // Add state for selected tests later
  // const [selectedTests, setSelectedTests] = React.useState<any[]>([]);


  const handleNext = () => {
    if (currentStep < wizardStepsConfig.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePatientSelected = (patient: Patient | null) => {
    setSelectedPatient(patient);
    // if (patient) handleNext(); // Optionally auto-navigate if patient selected
  };

  const handleDoctorSelected = (doctor: Doctor | null) => {
    setSelectedDoctor(doctor);
    // if (doctor) handleNext(); // Optionally auto-navigate if doctor selected, or if skipping
  };

  // Add handler for tests selection later
  // const handleTestsSelected = (tests: any[]) => {
  //   setSelectedTests(tests);
  // };

  const handleFinish = () => {
    // Logic to finalize and create the bill
    console.log("Bill creation process finished.");
    console.log("Patient:", selectedPatient);
    console.log("Doctor:", selectedDoctor);
    // console.log("Tests:", selectedTests);
    // router.push('/bills'); // Or to the newly created bill's page
  }

  const CurrentStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <StepPatient onPatientSelected={handlePatientSelected} />;
      case 2:
        return <StepDoctor onDoctorSelected={handleDoctorSelected} />;
      case 3:
        return <StepTest /* onTestsSelected={handleTestsSelected} */ />;
      case 4:
        return <StepSummary patient={selectedPatient} doctor={selectedDoctor} /* tests={selectedTests} */ />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push('/bills')} aria-label="Go back to bills">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FilePlus2 className="mr-3 h-8 w-8 text-primary" />
                Create New Bill
              </h1>
              <p className="text-muted-foreground">Follow the steps to generate a new bill.</p>
            </div>
          </div>
      </div>

      <BillWizardSteps steps={wizardStepsConfig} currentStepId={currentStep} />

      <Card className="shadow-lg w-full">
        <CardContent className="pt-6 min-h-[300px]"> {/* Added min-h for consistent height */}
          <CurrentStepComponent />
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={() => router.push('/bills')}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
              Previous
            </Button>
            {currentStep < wizardStepsConfig.length ? (
              <Button 
                onClick={handleNext} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                // Disable next if required fields not met, e.g. patient not selected in step 1
                disabled={currentStep === 1 && !selectedPatient} 
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleFinish} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Generate Bill
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
