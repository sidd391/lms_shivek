
'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ListChecks, UserCircle, Stethoscope, Beaker } from 'lucide-react';

export default function StepSummary() {
  // This component would ideally receive selectedPatient, selectedDoctor, selectedTests as props
  const patientName = "Mr. Shivek Bhasin"; // Placeholder
  const doctorName = "Dr. Emily Carter (Optional)"; // Placeholder
  const tests = [ // Placeholder
    { name: "Complete Blood Count (CBC)", price: 300 },
    { name: "Lipid Profile", price: 500 },
  ];
  const subTotal = tests.reduce((sum, test) => sum + test.price, 0);
  const discount = 50; // Placeholder
  const total = subTotal - discount;

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-2xl font-semibold flex items-center">
          <ListChecks className="mr-3 h-7 w-7 text-primary" />
          Bill Summary
        </CardTitle>
        <CardDescription>Review the bill details before generating.</CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        <div className="p-4 border rounded-lg bg-background">
          <h3 className="text-lg font-medium mb-2 flex items-center"><UserCircle className="mr-2 h-5 w-5 text-muted-foreground"/>Patient Details</h3>
          <p><strong>Name:</strong> {patientName}</p>
          {/* Add more patient details here */}
        </div>

        <div className="p-4 border rounded-lg bg-background">
          <h3 className="text-lg font-medium mb-2 flex items-center"><Stethoscope className="mr-2 h-5 w-5 text-muted-foreground"/>Doctor Details</h3>
          <p><strong>Name:</strong> {doctorName}</p>
          {/* Add more doctor details here */}
        </div>
        
        <div className="p-4 border rounded-lg bg-background">
          <h3 className="text-lg font-medium mb-2 flex items-center"><Beaker className="mr-2 h-5 w-5 text-muted-foreground"/>Selected Tests/Packages</h3>
          <ul className="space-y-1">
            {tests.map((test, index) => (
              <li key={index} className="flex justify-between">
                <span>{test.name}</span>
                <span>₹{test.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
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
        </div>
      </CardContent>
    </div>
  );
}
