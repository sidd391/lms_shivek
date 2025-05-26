
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, FileEdit, UserCircle, Stethoscope, Beaker, IndianRupee, Percent, StickyNote, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { BillStatus, PaymentMode } from '@/backend/models/Bill';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Patient {
  id: number;
  fullName: string;
  patientId: string; 
}

interface Doctor {
  id: number;
  fullName: string;
  doctorID?: string; 
}

interface BillItem {
  id: number;
  itemName: string;
  itemType: 'Test' | 'Package';
  itemPrice: number;
}

interface BillData {
  id: number;
  billNumber: string;
  patient: Patient;
  doctor?: Doctor | null;
  items: BillItem[];
  subTotal: number;
  discountAmount: number;
  grandTotal: number;
  amountReceived: number;
  amountDue: number;
  paymentMode: PaymentMode | null;
  notes?: string | null;
  status: BillStatus;
  billDate: string;
}

const editBillFormSchema = z.object({
  discountAmount: z.coerce.number().min(0, "Discount cannot be negative."),
  amountReceived: z.coerce.number().min(0, "Amount received cannot be negative."),
  paymentMode: z.enum(['Cash', 'Card', 'UPI', 'Online', 'Cheque']).nullable(),
  notes: z.string().optional().nullable(),
});

type EditBillFormValues = z.infer<typeof editBillFormSchema>;

export default function EditBillPage() {
  console.log("EditBillPage rendering..."); // Diagnostic log
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const { toast } = useToast();
  const [isLoadingBill, setIsLoadingBill] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [billData, setBillData] = React.useState<BillData | null>(null);
  const [isBillFinalized, setIsBillFinalized] = React.useState(false);


  const form = useForm<EditBillFormValues>({
    resolver: zodResolver(editBillFormSchema),
    defaultValues: {
      discountAmount: 0,
      amountReceived: 0,
      paymentMode: null,
      notes: '',
    },
  });

  React.useEffect(() => {
    if (billId) {
      const fetchBillData = async () => {
        setIsLoadingBill(true);
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
          router.push('/');
          return;
        }
        try {
          const response = await fetch(`${BACKEND_API_URL}/bills/${billId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (!response.ok) throw new Error('Failed to fetch bill data');
          
          const result = await response.json();
          if (result.success && result.data) {
            const fetchedBill = result.data as BillData;
            setBillData(fetchedBill);
            if (fetchedBill.status === 'Done') {
              setIsBillFinalized(true);
            }
            form.reset({
              discountAmount: fetchedBill.discountAmount,
              amountReceived: fetchedBill.amountReceived,
              paymentMode: fetchedBill.paymentMode,
              notes: fetchedBill.notes || '',
            });
          } else {
            toast({ title: "Error", description: result.message || "Bill data not found.", variant: "destructive" });
            router.push('/bills');
          }
        } catch (error) {
          console.error('Error fetching bill:', error);
          toast({ title: "Error", description: "Could not load bill data.", variant: "destructive" });
          router.push('/bills');
        } finally {
          setIsLoadingBill(false);
        }
      };
      fetchBillData();
    }
  }, [billId, form, router, toast]);

  const onSubmit: SubmitHandler<EditBillFormValues> = async (data) => {
    if (isBillFinalized) {
        toast({ title: "Action Denied", description: "This bill is finalized and cannot be edited.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    const authToken = localStorage.getItem('authToken');
     if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/bills/${billId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({
          title: 'Bill Updated',
          description: `Bill ${result.data.billNumber} has been successfully updated.`,
        });
        router.push('/bills');
      } else {
        toast({
          title: 'Failed to Update Bill',
          description: result.message || 'An error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Update bill request error:', error);
      toast({ title: 'Network Error', description: 'Could not connect. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingBill || !billData) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-3/5" /></CardHeader></Card>
        <Card className="shadow-md">
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </CardContent>
        </Card>
         <CardFooter className="flex justify-end gap-4 pt-6 border-t">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </CardFooter>
      </div>
    );
  }
  
  const subTotal = billData.items.reduce((sum, item) => sum + item.itemPrice, 0);
  const currentDiscount = form.watch('discountAmount');
  const currentAmountReceived = form.watch('amountReceived');
  const grandTotalAfterDiscount = subTotal - currentDiscount;
  const amountCurrentlyDue = grandTotalAfterDiscount - currentAmountReceived;


  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push('/bills')} aria-label="Go back to bills list" disabled={isSubmitting}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-3xl font-bold flex items-center">
                <FileEdit className="mr-3 h-8 w-8 text-primary" />
                Edit Bill: {billData.billNumber}
              </CardTitle>
              <CardDescription>Modify financial details for this bill. Bill Date: {new Date(billData.billDate).toLocaleDateString()}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isBillFinalized && (
        <Card className="border-orange-500 bg-orange-50 shadow-md">
            <CardContent className="p-4">
                <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
                    <p className="text-orange-700 font-medium">This bill is marked as "Paid" and cannot be edited further.</p>
                </div>
            </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><UserCircle className="mr-2 h-5 w-5 text-muted-foreground" />Patient Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p><strong>Name:</strong> {billData.patient.fullName}</p>
                <p><strong className="text-muted-foreground">Patient ID:</strong> {billData.patient.patientId}</p>
              </CardContent>
            </Card>

            {billData.doctor && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Stethoscope className="mr-2 h-5 w-5 text-muted-foreground" />Doctor Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p><strong>Name:</strong> {billData.doctor.fullName}</p>
                  <p><strong className="text-muted-foreground">Doctor ID:</strong> {billData.doctor.doctorID || 'N/A'}</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Beaker className="mr-2 h-5 w-5 text-muted-foreground"/> Billed Items (Read-only)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {billData.items.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto border p-3 rounded-md bg-muted/30">
                  {billData.items.map((item) => (
                    <li key={item.id} className="flex justify-between items-center py-1">
                      <span>{item.itemName} ({item.itemType})</span>
                      <span className="font-medium">₹{item.itemPrice.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No items found for this bill.</p>
              )}
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between font-medium text-md">
                  <span>Subtotal</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center">
                      <FormLabel className="flex items-center text-md text-muted-foreground">
                        <Percent className="mr-1 h-4 w-4"/>Discount
                      </FormLabel>
                      <div className="flex items-center w-32">
                         <span className="mr-1 text-muted-foreground">- ₹</span>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            className="h-8 text-right"
                            min="0"
                            step="0.01"
                            disabled={isBillFinalized}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-xs col-span-full text-right" />
                    </FormItem>
                  )}
                />
                <Separator className="my-4" />
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>Bill Total</span>
                  <span>₹{grandTotalAfterDiscount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
              <FormField
                control={form.control}
                name="amountReceived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><IndianRupee className="mr-1 h-4 w-4 text-muted-foreground"/>Amount Received</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        className="border-primary focus:ring-primary"
                        min="0"
                        step="0.01"
                        disabled={isBillFinalized}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isBillFinalized}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Online">Online Transfer</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-1">
                <FormLabel className="flex items-center"><IndianRupee className="mr-1 h-4 w-4 text-muted-foreground"/>Amount Due</FormLabel>
                <Input value={amountCurrentlyDue.toFixed(2)} readOnly className="font-semibold bg-muted/30" />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2 lg:col-span-3">
                    <FormLabel className="flex items-center"><StickyNote className="mr-2 h-4 w-4 text-muted-foreground"/>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                          placeholder="Any specific instructions or comments for this bill..."
                          {...field}
                          value={field.value ?? ''}
                          className="min-h-[80px]"
                          disabled={isBillFinalized}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <CardFooter className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/bills')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || !form.formState.isDirty || isBillFinalized}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Update Bill
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}

    
