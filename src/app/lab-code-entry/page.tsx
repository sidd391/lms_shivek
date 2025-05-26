
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { KeyRound, ArrowRight, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast';

const labCodeSchema = z.object({
  labCode: z.string().min(3, { message: 'Lab code must be at least 3 characters.' }),
});

type LabCodeFormValues = z.infer<typeof labCodeSchema>;

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function LabCodeEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LabCodeFormValues>({
    resolver: zodResolver(labCodeSchema),
    defaultValues: {
      labCode: '',
    },
  });

  const onSubmit: SubmitHandler<LabCodeFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/validate-lab-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ labCode: data.labCode }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('appLabCode', data.labCode);
        toast({
          title: 'Lab Code Verified',
          description: 'Redirecting to login page.',
        });
        router.push('/'); 
      } else {
        toast({
          title: 'Invalid Lab Code',
          description: result.message || 'The lab code entered is not valid. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Lab code validation error:', error);
      toast({
        title: 'Validation Error',
        description: 'Could not connect to the server to validate lab code. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-secondary to-primary/80">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <KeyRound className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Enter Your Lab Code</CardTitle>
          <CardDescription>Please enter the unique code provided for your laboratory to proceed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="labCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab Code</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., QHLAB001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Validating...
                  </>
                ) : (
                  <>
                    Proceed <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="pt-6">
          <p className="text-xs text-muted-foreground text-center w-full">
            If you don't have a lab code, please contact your administrator.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
