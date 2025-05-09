
'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListChecks, UserCircle, Stethoscope, Beaker } from 'lucide-react';

// Define types for Patient and Doctor if not already globally available
interface Patient {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
}

interface Doctor {
  id: string;
  fullName: string;
  specialty?: string;
}

interface Test { // Placeholder for test type
  name: string;
  price: number;
}

interface StepSummaryProps {
  patient: Patient | null;
  doctor: Doctor | null;
  tests?: Test[]; // Placeholder for tests
}

export default function StepSummary({ patient, doctor, tests: propTests }: StepSummaryProps) {
  const patientName = patient ? patient.fullName : "N/A";
  const doctorName = doctor ? doctor.fullName : "N/A (Optional)";
  
  // Placeholder test data if not passed via props
  const tests = propTests || [
    { name: "Complete Blood Count (CBC)", price: 300 },
    { name: "Lipid Profile", price: 500 },
  ];

  const subTotal = tests.reduce((sum, test) => sum + test.price, 0);
  const discount = 50; // Placeholder
  const total = subTotal - discount;

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-2xl font-semibold flex items-center">
          <ListChecks className="mr-3 h-7 w-7 text-primary" />
          Bill Summary
        </CardTitle>
        <CardDescription>Review the bill details before generating.</CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        <div className="p-4 border rounded-lg bg-card shadow-sm">
          <h3 className="text-lg font-medium mb-2 flex items-center"><UserCircle className="mr-2 h-5 w-5 text-muted-foreground"/>Patient Details</h3>
          <p><strong>Name:</strong> {patientName}</p>
          {patient && <p><strong>Phone:</strong> {patient.phone || 'N/A'}</p>}
          {patient && <p><strong>Patient ID:</strong> {patient.id}</p>}
        </div>

        {doctor && (
          <div className="p-4 border rounded-lg bg-card shadow-sm">
            <h3 className="text-lg font-medium mb-2 flex items-center"><Stethoscope className="mr-2 h-5 w-5 text-muted-foreground"/>Doctor Details</h3>
            <p><strong>Name:</strong> {doctor.fullName}</p>
            {doctor.specialty && <p><strong>Specialty:</strong> {doctor.specialty}</p>}
            {doctor.id && <p><strong>Doctor ID:</strong> {doctor.id}</p>}
          </div>
        )}
        
        <div className="p-4 border rounded-lg bg-card shadow-sm">
          <h3 className="text-lg font-medium mb-2 flex items-center"><Beaker className="mr-2 h-5 w-5 text-muted-foreground"/>Selected Tests/Packages</h3>
          {tests.length > 0 ? (
            <ul className="space-y-1">
              {tests.map((test, index) => (
                <li key={index} className="flex justify-between">
                  <span>{test.name}</span>
                  <span>₹{test.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No tests selected.</p>
          )}
          
          {tests.length > 0 && (
            <>
              <Separator className="my-3" />
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>- ₹{discount.toFixed(2)}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-xl font-bold text-primary">
                <span>Total Amount Due</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </div>
  );
}

