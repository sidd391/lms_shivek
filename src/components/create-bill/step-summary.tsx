"use client";

import * as React from "react";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea for notes
import {
  ListChecks,
  UserCircle,
  Stethoscope,
  Beaker,
  IndianRupee,
  Percent,
  StickyNote,
} from "lucide-react";

interface Patient {
  id: string; // Frontend display ID
  dbId: number; // Actual database ID
  fullName: string;
  phone?: string;
  email?: string;
}

interface Doctor {
  id: string; // Frontend display ID
  dbId: number; // Actual database ID
  fullName: string;
  specialty?: string;
}

export interface Test {
  id: string; // Frontend display ID (e.g., T1, P2)
  dbId: number; // Actual database ID
  name: string;
  price: number;
  isPackage?: boolean;
}

interface StepSummaryProps {
  patient: Patient | null;
  doctor: Doctor | null;
  selectedTests: Test[];
  amountReceived: number;
  onAmountReceivedChange: (amount: number) => void;
  paymentMode: string;
  onPaymentModeChange: (mode: string) => void;
  discountAmount: number;
  onDiscountChange: (discount: number) => void;
  onTestPriceChange: (testId: string, newPrice: number) => void;

  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function StepSummary({
  patient,
  doctor,
  selectedTests,
  amountReceived,
  onAmountReceivedChange,
  paymentMode,
  onPaymentModeChange,
  discountAmount, // Received from parent
  onDiscountChange, // Received from parent
  onTestPriceChange,

  notes,
  onNotesChange,
}: StepSummaryProps) {
  const patientName = patient ? patient.fullName : "N/A";

  const subTotal = selectedTests.reduce((sum, test) => sum + test.price, 0);
  const totalAmountDueAfterDiscount = subTotal - discountAmount;
  const amountActuallyDue = totalAmountDueAfterDiscount - amountReceived;

  // For local discount input if needed, though now controlled by parent
  // const [localDiscount, setLocalDiscount] = React.useState(discountAmount);
  // React.useEffect(() => { setLocalDiscount(discountAmount); }, [discountAmount]);
  // const handleLocalDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newDiscount = parseFloat(e.target.value) || 0;
  //   setLocalDiscount(newDiscount);
  //   onDiscountChange(newDiscount); // Update parent state
  // };

  {
    selectedTests.map((test) => (
      <li key={test.id} className="flex justify-between items-center py-1 pr-2">
        <span>
          {test.name} ({test.isPackage ? "Package" : "Test"})
        </span>
        <div className="flex items-center gap-2">
          <span className="font-medium">₹</span>
          <Input
            type="number"
            value={test.price}
            min="0"
            step="0.01"
            onChange={(e) =>
              onTestPriceChange(test.id, parseFloat(e.target.value) || 0)
            }
            className="w-24 h-8 text-right"
          />
        </div>
      </li>
    ));
  }
  return (
    <div className="space-y-8">
      <CardHeader className="p-0">
        <CardTitle className="text-2xl font-semibold flex items-center">
          <ListChecks className="mr-3 h-7 w-7 text-primary" />
          Bill Summary
        </CardTitle>
        <CardDescription>
          Review the bill details and finalize charges before generating.
        </CardDescription>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Details */}
        <div className="p-4 border rounded-lg bg-card shadow-sm space-y-2">
          <h3 className="text-lg font-medium flex items-center">
            <UserCircle className="mr-2 h-5 w-5 text-muted-foreground" />
            Patient Details
          </h3>
          <p>
            <strong>Name:</strong> {patientName}
          </p>
          {patient && (
            <p>
              <strong className="text-muted-foreground">Phone:</strong>{" "}
              {patient.phone || "N/A"}
            </p>
          )}
          {patient && (
            <p>
              <strong className="text-muted-foreground">Patient ID:</strong>{" "}
              {patient.id} (DB ID: {patient.dbId})
            </p>
          )}
        </div>

        {/* Doctor Details */}
        {doctor && (
          <div className="p-4 border rounded-lg bg-card shadow-sm space-y-2">
            <h3 className="text-lg font-medium flex items-center">
              <Stethoscope className="mr-2 h-5 w-5 text-muted-foreground" />
              Doctor Details
            </h3>
            <p>
              <strong>Name:</strong> {doctor.fullName}
            </p>
            {doctor.specialty && (
              <p>
                <strong className="text-muted-foreground">Specialty:</strong>{" "}
                {doctor.specialty}
              </p>
            )}
            {doctor.id && (
              <p>
                <strong className="text-muted-foreground">Doctor ID:</strong>{" "}
                {doctor.id} (DB ID: {doctor.dbId})
              </p>
            )}
          </div>
        )}
      </div>

      {/* Selected Tests/Packages */}
      <div className="p-4 border rounded-lg bg-card shadow-sm">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Beaker className="mr-2 h-5 w-5 text-muted-foreground" />
          Selected Tests/Packages
        </h3>
        {selectedTests.length > 0 ? (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {selectedTests.map((test) => (
              <li
                key={test.id}
                className="flex justify-between items-center py-1 pr-2"
              >
                <span>
                  {test.name} ({test.isPackage ? "Package" : "Test"})
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₹</span>
                  <Input
                    type="number"
                    value={test.price}
                    min="0"
                    step="0.01"
                    onChange={(e) =>
                      onTestPriceChange(
                        test.id,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-24 h-8 text-right"
                  />
                </div>
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
              <div className="flex justify-between text-md text-muted-foreground items-center">
                <Label
                  htmlFor="discountAmountInput"
                  className="flex items-center"
                >
                  <Percent className="mr-1 h-4 w-4 text-muted-foreground" />
                  Discount
                </Label>
                <div className="flex items-center w-32">
                  <span className="mr-1 text-muted-foreground">- ₹</span>
                  <Input
                    id="discountAmountInput"
                    type="number"
                    value={discountAmount}
                    onChange={(e) =>
                      onDiscountChange(parseFloat(e.target.value) || 0)
                    }
                    className="h-8 text-right"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-xl font-bold text-primary">
                <span>Bill Total</span>
                <span>₹{totalAmountDueAfterDiscount.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charges Summary & Payment */}
      {selectedTests.length > 0 && (
        <div className="p-4 border rounded-lg bg-card shadow-sm">
          <h3 className="text-lg font-medium mb-4">Payment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="amountReceived">Amount Received</Label>
              <div className="flex items-center">
                <IndianRupee className="h-4 w-4 text-muted-foreground mr-1" />
                <Input
                  id="amountReceived"
                  type="number"
                  value={amountReceived}
                  onChange={(e) =>
                    onAmountReceivedChange(parseFloat(e.target.value) || 0)
                  }
                  className="border-primary focus:ring-primary"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={onPaymentModeChange}>
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
            <div className="space-y-1">
              <Label htmlFor="amountDue">Amount Due</Label>
              <div className="flex items-center">
                <IndianRupee className="h-4 w-4 text-muted-foreground mr-1" />
                <Input
                  id="amountDue"
                  value={amountActuallyDue.toFixed(2)}
                  readOnly
                  className="font-semibold bg-muted/30"
                />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Label htmlFor="billNotes" className="flex items-center mb-1">
              <StickyNote className="mr-2 h-4 w-4 text-muted-foreground" />
              Notes (Optional)
            </Label>
            <Textarea
              id="billNotes"
              placeholder="Any specific instructions or comments for this bill..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
