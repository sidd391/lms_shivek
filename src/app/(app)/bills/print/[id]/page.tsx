
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText as BillIcon, UserCircle, Stethoscope, IndianRupee, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { BillStatus, PaymentMode, BillAttributes } from '@/backend/models/Bill';
import type { BillItemAttributes } from '@/backend/models/BillItem';
import type { PatientAttributes } from '@/backend/models/Patient';
import type { DoctorAttributes } from '@/backend/models/Doctor';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const LAB_NAME_SETTING_KEY = 'LAB_NAME';
const LAB_ADDRESS_SETTING_KEY = 'LAB_ADDRESS'; // New key for address
const DEFAULT_LAB_NAME = 'QuantumHook Diagnostics';
const DEFAULT_LAB_ADDRESS = '123 Lab Lane, Science City, ST 54321\nPhone: (555) 123-4567 | Email: contact@quantumhook.dev';


interface PatientData extends PatientAttributes { fullName?: string }
interface DoctorData extends DoctorAttributes { fullName?: string }

interface BillDataForPrint extends Omit<BillAttributes, 'patientId' | 'doctorId'> {
  items: BillItemAttributes[];
  patient: PatientData | null;
  doctor: DoctorData | null;
}

export default function PrintBillPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const [billData, setBillData] = React.useState<BillDataForPrint | null>(null);
  const [labName, setLabName] = React.useState(DEFAULT_LAB_NAME);
  const [labAddress, setLabAddress] = React.useState(DEFAULT_LAB_ADDRESS); // State for lab address
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const printTriggered = React.useRef(false);
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAuthToken(localStorage.getItem('authToken'));
  }, []);

  React.useEffect(() => {
    if (billId && authToken) {
      const fetchBillAndLabSettings = async () => {
        setIsLoading(true);
        setError(null);
        
        if (!authToken) {
          setError("Authentication required. Please log in.");
          setIsLoading(false);
          return;
        }

        try {
           // Fetch Lab Name and Address
          try {
            const [labNameResponse, labAddressResponse] = await Promise.all([
              fetch(`${BACKEND_API_URL}/settings/${LAB_NAME_SETTING_KEY}`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
              }),
              fetch(`${BACKEND_API_URL}/settings/${LAB_ADDRESS_SETTING_KEY}`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
              })
            ]);
            
            if (labNameResponse.ok) {
              const labNameResult = await labNameResponse.json();
              if (labNameResult.success && labNameResult.data?.value) {
                setLabName(labNameResult.data.value);
              }
            }
             if (labAddressResponse.ok) {
              const labAddressResult = await labAddressResponse.json();
              if (labAddressResult.success && labAddressResult.data?.value) {
                setLabAddress(labAddressResult.data.value);
              }
            }
          } catch (labSettingsError) {
            console.warn("Could not fetch custom lab settings, using defaults:", labSettingsError);
          }

          const response = await fetch(`${BACKEND_API_URL}/bills/${billId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({ message: 'Failed to fetch bill data' }));
            throw new Error(errData.message || `Error ${response.status}`);
          }
          const result = await response.json();
          if (result.success && result.data) {
            const fetchedBill = result.data as any;
            if (fetchedBill.patient && !fetchedBill.patient.fullName) {
              fetchedBill.patient.fullName = `${fetchedBill.patient.title || ''} ${fetchedBill.patient.firstName || ''} ${fetchedBill.patient.lastName || ''}`.trim();
            }
            if (fetchedBill.doctor && !fetchedBill.doctor.fullName) {
              fetchedBill.doctor.fullName = `${fetchedBill.doctor.title || ''} ${fetchedBill.doctor.firstName || ''} ${fetchedBill.doctor.lastName || ''}`.trim();
            }
            setBillData(fetchedBill as BillDataForPrint);
          } else {
            throw new Error(result.message || 'Bill data not found.');
          }
        } catch (err: any) {
          setError(err.message || 'Could not load bill data for printing.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchBillAndLabSettings();
    }
  }, [billId, authToken]);

  React.useEffect(() => {
    if (billData && !isLoading && !error && !printTriggered.current) {
      const timer = setTimeout(() => {
        window.print();
        printTriggered.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [billData, isLoading, error]);

  if (isLoading) {
    return (
      <div className="print-container p-8 space-y-6">
        <div className="print-hide-controls mb-6 flex justify-between items-center">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="print-container p-8 text-center">
        <div className="print-hide-controls mb-6 flex justify-start">
            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        </div>
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Bill</h2>
        <p className="text-destructive-foreground">{error}</p>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="print-container p-8 text-center">
        <div className="print-hide-controls mb-6 flex justify-start">
             <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        </div>
        <p>Bill data could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="print-container bg-white text-black p-4 sm:p-6 md:p-8 print:p-2">
      <div className="print-hide-controls mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-xl font-bold text-center text-primary">Invoice / Bill</h1>
        <Button onClick={() => window.print()} size="sm">
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>

      <header className="mb-6 border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-primary">{labName}</h2>
            <div className="text-xs whitespace-pre-line">{labAddress}</div>
          </div>
          <div className="text-right">
            <img src="https://placehold.co/150x50.png" alt="Lab Logo" data-ai-hint="lab logo" className="h-12 mb-1" />
            <p className="text-sm">Bill No: <span className="font-semibold">{billData.billNumber}</span></p>
            <p className="text-sm">Date: <span className="font-semibold">{format(new Date(billData.billDate), 'PPP')}</span></p>
          </div>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
        <div>
          <h3 className="text-md font-semibold mb-1 underline">Patient Information</h3>
          <p className="text-sm"><UserCircle className="inline h-4 w-4 mr-1 text-gray-600" /><strong>Name:</strong> {billData.patient?.fullName || 'N/A'}</p>
          <p className="text-sm"><strong className="ml-5">Patient ID:</strong> {billData.patient?.patientId || 'N/A'}</p>
          <p className="text-sm"><strong className="ml-5">Phone:</strong> {billData.patient?.phone || 'N/A'}</p>
        </div>
        {billData.doctor && (
          <div className="md:text-left">
            <h3 className="text-md font-semibold mb-1 underline">Referring Doctor</h3>
            <p className="text-sm"><Stethoscope className="inline h-4 w-4 mr-1 text-gray-600" /><strong>Dr. {billData.doctor.fullName || 'N/A'}</strong></p>
            <p className="text-sm"><strong className="ml-5">Specialty:</strong> {billData.doctor.specialty || 'N/A'}</p>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-bold mb-2">Billing Details</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 print:bg-gray-100">
              <th className="text-left p-1.5 border w-[50%]">Item Description</th>
              <th className="text-center p-1.5 border">Type</th>
              <th className="text-right p-1.5 border">Price (₹)</th>
            </tr>
          </thead>
          <tbody>
            {billData.items.map((item) => (
              <tr key={item.id}>
                <td className="p-1.5 border">{item.itemName}</td>
                <td className="p-1.5 border text-center"><Badge variant={item.itemType === 'Package' ? 'secondary' : 'outline'} className="text-xs">{item.itemType}</Badge></td>
                <td className="p-1.5 border text-right">{item.itemPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-6 flex justify-end">
        <div className="w-full md:w-1/2 lg:w-2/5 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">₹{billData.subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 flex items-center"><Percent className="mr-1 h-3 w-3"/>Discount:</span>
            <span className="font-medium text-red-600 print:text-red-600">- ₹{billData.discountAmount.toFixed(2)}</span>
          </div>
          <Separator className="my-1"/>
          <div className="flex justify-between text-md font-bold">
            <span>Grand Total:</span>
            <span>₹{billData.grandTotal.toFixed(2)}</span>
          </div>
          <Separator className="my-1"/>
           <div className="flex justify-between">
            <span className="text-gray-600 flex items-center"><IndianRupee className="mr-1 h-3 w-3"/>Amount Received:</span>
            <span className="font-medium">₹{billData.amountReceived.toFixed(2)}</span>
          </div>
           <div className="flex justify-between">
            <span className="text-gray-600">Payment Mode:</span>
            <span className="font-medium">{billData.paymentMode || 'N/A'}</span>
          </div>
          <Separator className="my-1"/>
          <div className="flex justify-between text-md font-bold">
            <span>Amount Due:</span>
            <span className={billData.amountDue > 0 ? "text-red-600 print:text-red-600" : "text-green-600 print:text-green-600"}>₹{billData.amountDue.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {billData.notes && (
        <section className="mb-6 border-t pt-4">
          <h3 className="text-md font-semibold mb-1">Notes:</h3>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{billData.notes}</p>
        </section>
      )}

      <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500 print:text-gray-500">
        <p>Thank you for choosing {labName}!</p>
        <p className="mt-1">This is a computer-generated bill and does not require a signature.</p>
        <p>Printed on: {format(new Date(), 'PPPpp')}</p>
      </footer>

      <style jsx global>{`
        @media print {
          .print-hide-controls { display: none !important; }
          body {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-size: 10pt;
            margin: 0;
            padding: 0.5cm; /* Add some padding for print margins */
          }
          .print-container {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ccc !important; padding: 4px !important; }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .text-red-600 { color: #dc2626 !important; }
          .text-green-600 { color: #16a34a !important; }
          section { page-break-inside: avoid; }
        }
        .print-container { font-family: 'Arial', sans-serif; }
      `}</style>
    </div>
  );
}

        