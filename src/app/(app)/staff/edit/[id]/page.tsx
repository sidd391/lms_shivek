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
import { ArrowLeft, Save, UserCog, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { staffRoles } from '@/backend/models/User'; // Import staffRoles

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const staffFormSchema = z.object({
  title: z.enum(['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Other']).optional().nullable(),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits.')
    .regex(/^\+?[0-9\s-()]+$/, 'Invalid phone number format.')
    .optional().or(z.literal('')),
  role: z.enum(staffRoles, {
    required_error: 'Role is required.',
  }),
  status: z.enum(['Active', 'Inactive'], {
    required_error: 'Status is required.',
  }),
  password: z.string().min(8, 'Password must be at least 8 characters.').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"], 
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffIdFromParams = params.id as string;
  const { toast } = useToast();
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      title: undefined,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: undefined,
      status: 'Active',
      password: '',
      confirmPassword: '',
    },
  });

  React.useEffect(() => {
    if (staffIdFromParams) {
      const fetchStaffData = async () => {
        setIsLoadingStaff(true);
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
          router.push('/');
          return;
        }
        try {
          const response = await fetch(`${BACKEND_API_URL}/staff/${staffIdFromParams}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (!response.ok) throw new Error('Failed to fetch staff data');
          
          const result = await response.json();
          if (result.success && result.data) {
            const staff = result.data;
            form.reset({
              title: staff.title || undefined,
              firstName: staff.firstName || '',
              lastName: staff.lastName || '',
              email: staff.email || '',
              phone: staff.phone || '',
              role: staff.role || undefined,
              status: staff.status || 'Active',
              password: '', // Don't prefill password
              confirmPassword: '',
            });
          } else {
            toast({ title: "Error", description: result.message || "Staff data not found.", variant: "destructive" });
            router.push('/staff');
          }
        } catch (error) {
          console.error('Error fetching staff:', error);
          toast({ title: "Error", description: "Could not load staff data.", variant: "destructive" });
          router.push('/staff');
        } finally {
          setIsLoadingStaff(false);
        }
      };
      fetchStaffData();
    }
  }, [staffIdFromParams, form, router, toast]);

  const onSubmit: SubmitHandler<StaffFormValues> = async (data) => {
    setIsSubmitting(true);
    const authToken = localStorage.getItem('authToken');
     if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      setIsSubmitting(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...payload } = data;
    if (!payload.password) { // If password field is empty, don't send it
        delete payload.password;
    }


    try {
      const response = await fetch(`${BACKEND_API_URL}/staff/${staffIdFromParams}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({
          title: 'Staff Member Updated',
          description: `Staff member ${result.data.fullName || `${result.data.firstName} ${result.data.lastName}`} has been updated.`,
        });
        router.push('/staff');
      } else {
        toast({
          title: 'Failed to Update Staff Member',
          description: result.message || 'An error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Update staff request error:', error);
      toast({ title: 'Network Error', description: 'Could not connect. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStaff) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-3/5" /></CardHeader></Card>
        <Card className="shadow-md">
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
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
            <Button variant="outline" size="icon" onClick={() => router.push('/staff')} aria-label="Go back to staff list" disabled={isSubmitting}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-3xl font-bold flex items-center">
                <UserCog className="mr-3 h-8 w-8 text-primary" />
                Edit Staff Member
              </CardTitle>
              <CardDescription>Update details for {form.getValues('firstName')} {form.getValues('lastName')}.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
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
            </CardContent>
          </Card>
           <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Contact, Role & Status</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="staff.member@example.com" {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 234 567 8900" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staffRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Account Security</CardTitle>
              <CardDescription>Update password only if necessary. Leave blank to keep current password.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Re-enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <CardFooter className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/staff')} disabled={isSubmitting}>
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
                  Update Staff Member
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
}