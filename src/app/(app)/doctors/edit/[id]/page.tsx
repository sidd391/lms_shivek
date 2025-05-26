
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
import { ArrowLeft, Save, Stethoscope, Loader2 } from 'lucide-react'; // Changed icon to Stethoscope
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const doctorFormSchema = z.object({
  title: z.enum(['Dr.', 'Prof.', 'Other'], { required_error: 'Title is required.' }),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required.' }),
  specialty: z.string().min(1, 'Specialty is required.'),
  qualification: z.string().optional(),
  experienceYears: z.coerce.number().int().min(0, 'Experience must be positive.').optional().nullable(),
  email: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.').regex(/^\+?[0-9\s-()]+$/, 'Invalid phone format.'),
  address: z.string().optional(),
  consultationFee: z.coerce.number().min(0, "Fee cannot be negative.").optional().nullable(),
  doctorID: z.string().optional(),
  status: z.enum(['Active', 'On Leave', 'Inactive']).optional(),
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

export default function EditDoctorPage() {
  const router = useRouter();
  const params = useParams();
  const doctorIdFromParams = params.id as string;
  const { toast } = useToast();
  const [isLoadingDoctor, setIsLoadingDoctor] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      title: undefined,
      firstName: '',
      lastName: '',
      gender: undefined,
      specialty: '',
      qualification: '',
      experienceYears: null,
      email: '',
      phone: '',
      address: '',
      consultationFee: null,
      doctorID: '',
      status: 'Active',
    },
  });

  React.useEffect(() => {
    if (doctorIdFromParams) {
      const fetchDoctorData = async () => {
        setIsLoadingDoctor(true);
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
          router.push('/');
          return;
        }
        try {
          const response = await fetch(`${BACKEND_API_URL}/doctors/${doctorIdFromParams}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (!response.ok) throw new Error('Failed to fetch doctor data');
          
          const result = await response.json();
          if (result.success && result.data) {
            const doctor = result.data;
            form.reset({
              ...doctor,
              experienceYears: doctor.experienceYears ?? null,
              consultationFee: doctor.consultationFee ?? null,
              email: doctor.email || '',
              address: doctor.address || '',
              qualification: doctor.qualification || '',
              doctorID: doctor.doctorID || '',
            });
          } else {
            toast({ title: "Error", description: result.message || "Doctor data not found.", variant: "destructive" });
            router.push('/doctors');
          }
        } catch (error) {
          console.error('Error fetching doctor:', error);
          toast({ title: "Error", description: "Could not load doctor data.", variant: "destructive" });
          router.push('/doctors');
        } finally {
          setIsLoadingDoctor(false);
        }
      };
      fetchDoctorData();
    }
  }, [doctorIdFromParams, form, router, toast]);

  const onSubmit: SubmitHandler<DoctorFormValues> = async (data) => {
    setIsSubmitting(true);
    const authToken = localStorage.getItem('authToken');
     if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/doctors/${doctorIdFromParams}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({
          title: 'Doctor Updated',
          description: `Doctor ${result.data.firstName} ${result.data.lastName} has been successfully updated.`,
        });
        router.push('/doctors');
      } else {
        toast({
          title: 'Failed to Update Doctor',
          description: result.message || 'An error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Update doctor request error:', error);
      toast({ title: 'Network Error', description: 'Could not connect. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDoctor) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-3/5" /></CardHeader></Card>
        <Card className="shadow-md">
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
         <CardFooter className="flex justify-end gap-4 pt-6 border-t">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </CardFooter>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push('/doctors')} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-3xl font-bold flex items-center">
                <Stethoscope className="mr-3 h-8 w-8 text-primary" />
                Edit Doctor Details
              </CardTitle>
              <CardDescription>Update information for Dr. {form.getValues('firstName')} {form.getValues('lastName')} (ID: {form.getValues('doctorID') || doctorIdFromParams})</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Card */}
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-xl font-semibold">Basic Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select title" /></SelectTrigger></FormControl><SelectContent>{['Dr.', 'Prof.', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input placeholder="First Name" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input placeholder="Last Name" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem><FormLabel>Gender *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent>{['Male', 'Female', 'Other'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="doctorID" render={({ field }) => (
                  <FormItem><FormLabel>Doctor ID</FormLabel><FormControl><Input placeholder="Doctor ID" {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed"/></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{['Active', 'On Leave', 'Inactive'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )}/>
            </CardContent>
          </Card>

          {/* Professional Details Card */}
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-xl font-semibold">Professional Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField control={form.control} name="specialty" render={({ field }) => (
                  <FormItem><FormLabel>Specialty *</FormLabel><FormControl><Input placeholder="Specialty" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="qualification" render={({ field }) => (
                  <FormItem><FormLabel>Qualification</FormLabel><FormControl><Input placeholder="Qualification" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="experienceYears" render={({ field }) => (
                  <FormItem><FormLabel>Years of Experience</FormLabel><FormControl><Input type="number" placeholder="Years" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : +e.target.value)} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="consultationFee" render={({ field }) => (
                  <FormItem><FormLabel>Consultation Fee (₹)</FormLabel><FormControl><Input type="number" placeholder="Fee" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : +e.target.value)} /></FormControl><FormMessage /></FormItem>
              )}/>
            </CardContent>
          </Card>

          {/* Contact Details Card */}
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-xl font-semibold">Contact Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="Email" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone *</FormLabel><FormControl><Input type="tel" placeholder="Phone" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Address" className="min-h-[100px]" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
              )}/>
            </CardContent>
          </Card>

          <CardFooter className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/doctors')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || !form.formState.isDirty}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Update Doctor
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}
