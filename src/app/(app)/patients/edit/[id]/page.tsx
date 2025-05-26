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
import { ArrowLeft, Save, UserCog, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const patientFormSchema = z.object({
  title: z.enum(['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Other'], {
    required_error: 'Title is required.',
  }),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  gender: z.enum(['Male', 'Female', 'Other'], {
    required_error: 'Gender is required.',
  }),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'], {
    required_error: 'Blood group is required.',
  }),
  age: z.coerce.number().int().min(0, 'Age must be a positive number.'),
  dobDay: z.string().optional(),
  dobMonth: z.string().optional(),
  dobYear: z.string()
    .optional()
    .refine((val) => val === undefined || val === '' || /^\d{4}$/.test(val), {
      message: 'Year must be 4 digits or empty.',
    }),
  email: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits.')
    .regex(/^\+?[0-9\s-()]+$/, 'Invalid phone number format.'),
  address: z.string().optional(),
  patientId: z.string().optional(),
  status: z.enum(['Active', 'Closed']).optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const months = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const patientIdFromParams = params.id as string;
  const { toast } = useToast();
  const [isLoadingPatient, setIsLoadingPatient] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      title: undefined,
      firstName: '',
      lastName: '',
      gender: undefined,
      bloodGroup: undefined,
      age: 0, 
      dobDay: undefined,
      dobMonth: undefined,
      dobYear: '',
      email: '',
      phone: '',
      address: '',
      patientId: '',
      status: 'Active',
    },
  });

  React.useEffect(() => {
    if (patientIdFromParams) {
      const fetchPatientData = async () => {
        setIsLoadingPatient(true);
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
          router.push('/');
          return;
        }
        try {
          const response = await fetch(`${BACKEND_API_URL}/patients/${patientIdFromParams}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch patient data');
          }
          const result = await response.json();
          if (result.success && result.data) {
            const patient = result.data;
            let dobDay, dobMonth, dobYear;
            if (patient.dob) {
              const dobDate = new Date(patient.dob);
              dobDay = dobDate.getDate().toString();
              dobMonth = (dobDate.getMonth() + 1).toString().padStart(2, '0');
              dobYear = dobDate.getFullYear().toString();
            }
            form.reset({
              title: patient.title || undefined,
              firstName: patient.firstName || '',
              lastName: patient.lastName || '',
              gender: patient.gender || undefined,
              bloodGroup: patient.bloodGroup || undefined,
              age: patient.age ?? 0,
              dobDay: dobDay || undefined,
              dobMonth: dobMonth || undefined,
              dobYear: dobYear || '',
              email: patient.email || '', // Ensure empty string for null
              phone: patient.phone || '',
              address: patient.address || '', // Ensure empty string for null
              patientId: patient.patientId || '', // Ensure empty string for null
              status: patient.status || 'Active',
            });
          } else {
            toast({ title: "Error", description: "Patient data not found.", variant: "destructive" });
            router.push('/patients');
          }
        } catch (error) {
          console.error('Error fetching patient:', error);
          toast({ title: "Error", description: "Could not load patient data.", variant: "destructive" });
          router.push('/patients');
        } finally {
          setIsLoadingPatient(false);
        }
      };
      fetchPatientData();
    }
  }, [patientIdFromParams, form, router, toast]);

  const onSubmit: SubmitHandler<PatientFormValues> = async (data) => {
    setIsSubmitting(true);
    const authToken = localStorage.getItem('authToken');
     if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/patients/${patientIdFromParams}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({
          title: 'Patient Updated',
          description: `Patient ${result.data.firstName} ${result.data.lastName} has been successfully updated.`,
        });
        router.push('/patients');
      } else {
        toast({
          title: 'Failed to Update Patient',
          description: result.message || 'An error occurred during update.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Update patient request error:', error);
      toast({
        title: 'Network Error',
        description: 'Could not connect to the server. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPatient) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-3/5" /></CardHeader>
        </Card>
        <Card className="shadow-md">
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
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
            <Button variant="outline" size="icon" onClick={() => router.push('/patients')} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-3xl font-bold flex items-center">
                <UserCog className="mr-3 h-8 w-8 text-primary" />
                Edit Patient Details
              </CardTitle>
              <CardDescription>Update the information for patient ID: {form.getValues('patientId') || patientIdFromParams}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select title" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Other'].map((title) => (
                          <SelectItem key={title} value={title}>
                            {title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Male', 'Female', 'Other'].map((gender) => (
                          <SelectItem key={gender} value={gender}>
                            {gender}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter age" 
                        {...field} 
                        value={field.value ?? ''} // Use empty string for undefined/null to avoid uncontrolled->controlled warning
                        onChange={e => field.onChange(e.target.value === '' ? 0 : +e.target.value)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <fieldset className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 border p-4 rounded-md">
                <legend className="text-sm font-medium px-1">Date of Birth (Optional)</legend>
                <FormField
                  control={form.control}
                  name="dobDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {days.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dobMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map((month, index) => (
                            <SelectItem key={month} value={(index + 1).toString().padStart(2, '0')}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dobYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="YYYY" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Contact &amp; Other Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="patient@example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter full address" className="min-h-[100px]" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. PAT12345" {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <CardFooter className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/patients')} disabled={isSubmitting}>
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
                  Update Patient
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}

