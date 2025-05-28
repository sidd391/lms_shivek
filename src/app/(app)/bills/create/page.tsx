
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"; 
import { ArrowLeft, FilePlus2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import BillWizardSteps, { type BillWizardStepInfo } from '@/components/create-bill/bill-wizard-steps';
import StepPatient from '@/components/create-bill/step-patient';
import StepDoctor from '@/components/create-bill/step-doctor';
import StepTest from '@/components/create-bill/step-test';
import StepSummary, { type Test as BillTest } from '@/components/create-bill/step-summary';
import { useToast } from '@/hooks/use-toast';
import type { BillStatus } from '@/backend/models/Bill'; // Import BillStatus type


interface Patient {
  id: string; 
  dbId: number; 
  fullName: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: string;
  imageSeed?: string;
}

interface Doctor {
  id: string; 
  dbId: number; 
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

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function CreateBillPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = React.useState(1);
  
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = React.useState<Doctor | null>(null);
  const [selectedTests, setSelectedTests] = React.useState<BillTest[]>([]);
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [amountReceived, setAmountReceived] = React.useState(0);
  const [paymentMode, setPaymentMode] = React.useState('Cash'); 
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [notes, setNotes] = React.useState('');


  const handleNext = React.useCallback(() => {
    if (currentStep < wizardStepsConfig.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handlePrevious = React.useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handlePatientSelected = React.useCallback((patient: Patient | null) => {
    setSelectedPatient(patient);
  }, []);
const handleTestPriceChange = (testId: string, newPrice: number) => {
  setSelectedTests(tests =>
    tests.map(test =>
      test.id === testId ? { ...test, price: newPrice } : test
    )
  );
};
  const handleDoctorSelected = React.useCallback((doctor: Doctor | null) => {
    setSelectedDoctor(doctor);
  }, []);

  const handleTestsSelected = React.useCallback((tests: BillTest[]) => {
    setSelectedTests(tests);
  }, []);
  
  const handleAmountReceivedChange = React.useCallback((amount: number) => setAmountReceived(amount), []);
  const handlePaymentModeChange = React.useCallback((mode: string) => setPaymentMode(mode), []);
  const handleDiscountChange = React.useCallback((discount: number) => setDiscountAmount(discount), []);
  const handleNotesChange = React.useCallback((newNotes: string) => setNotes(newNotes), []);


  const handleFinish = async () => {
    setIsSubmitting(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        toast({ title: 'Authentication Error', description: 'Please login to create a bill.', variant: 'destructive' });
        router.push('/');
        setIsSubmitting(false);
        return;
    }
    if (!selectedPatient) {
        toast({ title: 'Patient Required', description: 'Please select a patient.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }
     if (selectedTests.length === 0) {
        toast({ title: 'Items Required', description: 'Please add at least one test or package to the bill.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    const grandTotal = selectedTests.reduce((sum, t) => sum + t.price, 0) - discountAmount;
    const suggestedStatus: BillStatus = amountReceived >= grandTotal ? 'Done' : 'Pending';

    const billPayload = {
      patientId: selectedPatient.dbId,
      doctorId: selectedDoctor ? selectedDoctor.dbId : null,
      selectedTests: selectedTests.map(test => ({
        id: test.id, 
        dbId: test.dbId, 
        name: test.name,
        price: test.price,
        isPackage: test.isPackage || false,
      })),
      amountReceived: amountReceived,
      paymentMode: paymentMode,
      discountAmount: discountAmount,
      notes: notes,
      status: suggestedStatus, // Backend will make final determination
    };

    try {
      const response = await fetch(`${BACKEND_API_URL}/bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(billPayload),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({
          title: 'Bill Generated Successfully',
          description: `Bill ${result.data.billNumber} has been created.`,
        });
        router.push('/bills');
      } else {
        toast({
          title: 'Failed to Generate Bill',
          description: result.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Bill creation error:', error);
      toast({
        title: 'Network Error',
        description: 'Could not connect to the server. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = React.useMemo(() => {
    switch (currentStep) {
      case 1:
        return <StepPatient 
                  onPatientSelected={handlePatientSelected} 
                  currentPatientToDisplay={selectedPatient} 
               />;
      case 2:
        return <StepDoctor 
                  onDoctorSelected={handleDoctorSelected} 
                  currentDoctorToDisplay={selectedDoctor} 
                />;
      case 3:
        return <StepTest 
                  onTestsSelected={handleTestsSelected} 
                  initialSelectedTests={selectedTests} 
                />;
      case 4:
        return (
            <StepSummary 
                patient={selectedPatient} 
                doctor={selectedDoctor} 
                selectedTests={selectedTests} 
                amountReceived={amountReceived}
                onAmountReceivedChange={handleAmountReceivedChange}
                paymentMode={paymentMode}
                onPaymentModeChange={handlePaymentModeChange}
                discountAmount={discountAmount}
                onDiscountChange={handleDiscountChange}
                notes={notes}
                onNotesChange={handleNotesChange}
                onTestPriceChange={handleTestPriceChange}

            />
        );
      default:
        return null;
    }
  }, [currentStep, selectedPatient, selectedDoctor, selectedTests, amountReceived, paymentMode, discountAmount, notes, handlePatientSelected, handleDoctorSelected, handleTestsSelected, handleAmountReceivedChange, handlePaymentModeChange, handleDiscountChange, handleNotesChange]);


  const isNextDisabled = React.useCallback(() => {
    if (currentStep === 1 && !selectedPatient) return true;
    if (currentStep === 3 && selectedTests.length === 0) return true; 
    return false;
  }, [currentStep, selectedPatient, selectedTests]);

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
        <CardContent className="pt-6 min-h-[300px] md:min-h-[400px] lg:min-h-[450px]">
          {CurrentStepComponent}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={() => router.push('/bills')} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isSubmitting}>
              Previous
            </Button>
            {currentStep < wizardStepsConfig.length ? (
              <Button 
                onClick={handleNext} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isNextDisabled() || isSubmitting} 
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleFinish} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting || !selectedPatient || selectedTests.length === 0}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating...
                    </>
                ) : "Generate Bill" }
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

