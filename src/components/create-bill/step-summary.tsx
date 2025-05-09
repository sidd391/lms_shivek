
'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListChecks, UserCircle, Stethoscope, Beaker, IndianRupee, Percent } from 'lucide-react';

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

export interface Test { 
  id: string;
  name: string;
  price: number;
  isPackage?: boolean;
}

interface StepSummaryProps {
  patient: Patient | null;
  doctor: Doctor | null;
  selectedTests: Test[]; 
}

export default function StepSummary({ patient, doctor, selectedTests }: StepSummaryProps) {
  const [amountReceived, setAmountReceived] = React.useState<number>(0);
  const [paymentMode, setPaymentMode] = React.useState<string>('Cash');
  const [discount, setDiscount] = React.useState<number>(0); // Placeholder discount

  const patientName = patient ? patient.fullName : "N/A";
  
  const subTotal = selectedTests.reduce((sum, test) => sum + test.price, 0);
  const totalAmountDue = subTotal - discount;
  const amountActuallyDue = totalAmountDue - amountReceived;

  return (
    <div className="space-y-8">
      <CardHeader className="p-0">
        <CardTitle className="text-2xl font-semibold flex items-center">
          <ListChecks className="mr-3 h-7 w-7 text-primary" />
          Bill Summary
        </CardTitle>
        <CardDescription>Review the bill details and finalize charges before generating.</CardDescription>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Details */}
        <div className="p-4 border rounded-lg bg-card shadow-sm space-y-2">
          <h3 className="text-lg font-medium flex items-center"><UserCircle className="mr-2 h-5 w-5 text-muted-foreground"/>Patient Details</h3>
          <p><strong>Name:</strong> {patientName}</p>
          {patient && <p><strong className="text-muted-foreground">Phone:</strong> {patient.phone || 'N/A'}</p>}
          {patient && <p><strong className="text-muted-foreground">Patient ID:</strong> {patient.id}</p>}
        </div>

        {/* Doctor Details */}
        {doctor && (
          <div className="p-4 border rounded-lg bg-card shadow-sm space-y-2">
            <h3 className="text-lg font-medium flex items-center"><Stethoscope className="mr-2 h-5 w-5 text-muted-foreground"/>Doctor Details</h3>
            <p><strong>Name:</strong> {doctor.fullName}</p>
            {doctor.specialty && <p><strong className="text-muted-foreground">Specialty:</strong> {doctor.specialty}</p>}
            {doctor.id && <p><strong className="text-muted-foreground">Doctor ID:</strong> {doctor.id}</p>}
          </div>
        )}
      </div>
        
      {/* Selected Tests/Packages */}
      <div className="p-4 border rounded-lg bg-card shadow-sm">
        <h3 className="text-lg font-medium mb-3 flex items-center"><Beaker className="mr-2 h-5 w-5 text-muted-foreground"/>Selected Tests/Packages</h3>
        {selectedTests.length > 0 ? (
          <ul className="space-y-2">
            {selectedTests.map((test) => (
              <li key={test.id} className="flex justify-between items-center py-1">
                <span>{test.name}</span>
                <span className="font-medium">₹{test.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No tests selected.</p>
        )}
        
        {selectedTests.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex justify-between font-medium text-md">
                <span>Subtotal</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-md text-muted-foreground">
                <span>Discount</span>
                <span>- ₹{discount.toFixed(2)}</span>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-xl font-bold text-primary">
                <span>Bill Total</span>
                <span>₹{totalAmountDue.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charges Summary */}
      {selectedTests.length > 0 && (
        <div className="p-4 border rounded-lg bg-card shadow-sm">
          <h3 className="text-lg font-medium mb-4">Charges Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="billTotal">Bill Total</Label>
              <div className="flex items-center">
                <IndianRupee className="h-4 w-4 text-muted-foreground mr-1" />
                <Input id="billTotal" value={totalAmountDue.toFixed(2)} readOnly className="font-semibold bg-muted/30" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="amountReceived">Amount Received</Label>
              <div className="flex items-center">
                 <IndianRupee className="h-4 w-4 text-muted-foreground mr-1" />
                <Input 
                  id="amountReceived" 
                  type="number" 
                  value={amountReceived} 
                  onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                  className="border-primary focus:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="amountDue">Amount Due</Label>
               <div className="flex items-center">
                <IndianRupee className="h-4 w-4 text-muted-foreground mr-1" />
                <Input id="amountDue" value={amountActuallyDue.toFixed(2)} readOnly className="font-semibold bg-muted/30" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger id="paymentMode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Online">Online Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="outline">
              <Percent className="mr-2 h-4 w-4" />
              Add Discount
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
