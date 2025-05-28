
'use client';

import * as React from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Atom, LogIn, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode

interface DecodedToken {
  labCode: string;
  // other properties if needed, like exp, iat, id, email, name
}

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [labCode, setLabCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsClient(true);
    const storedLabCode = localStorage.getItem('appLabCode');
    
    if (!storedLabCode) {
      router.push('/lab-code-entry');
      return; 
    }
    setLabCode(storedLabCode);

    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        if (decodedToken.labCode !== storedLabCode) {
          // Token exists but is for a different lab code
          localStorage.removeItem('authToken');
          toast({
            title: "Lab Code Mismatch",
            description: "Your previous session was for a different lab. Please log in again.",
            variant: "default",
          });
          setIsLoading(false);
          return; // Show login form for the current lab code
        }
      } catch (error) {
        // Token is invalid or malformed
        console.error("Error decoding token:", error);
        localStorage.removeItem('authToken');
        setIsLoading(false);
        return; // Show login form
      }

      // Token exists and lab code matches (or no lab code in token to check against old tokens)
      const verifyToken = async () => {
        try {
          const response = await fetch(`${BACKEND_API_URL}/auth/status`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              toast({ title: "Session Active", description: "Redirecting to dashboard..." });
              router.push('/dashboard');
              return; 
            } else {
              localStorage.removeItem('authToken'); 
            }
          } else {
            localStorage.removeItem('authToken'); 
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('authToken'); 
        }
        setIsLoading(false); 
      };
      verifyToken();
    } else {
      setIsLoading(false); 
    }
  }, [router, toast]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    const currentLabCode = labCode || localStorage.getItem('appLabCode');
    if (!currentLabCode) {
      toast({
        title: "Lab Code Missing",
        description: "Lab code not found. Please re-enter your lab code.",
        variant: "destructive",
      });
      router.push('/lab-code-entry');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, labCode: currentLabCode }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.token) {
        localStorage.setItem('authToken', result.token);
        toast({
          title: "Login Successful",
          description: result.message || "Redirecting to dashboard...",
        });
        router.push('/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials or server error.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login request error:', error);
      toast({
        title: "Login Error",
        description: "Could not connect to the server. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleChangeLabCode = () => {
    localStorage.removeItem('appLabCode');
    localStorage.removeItem('authToken'); // Also remove auth token
    setLabCode(null);
    router.push('/lab-code-entry');
  };

  if (!isClient || isLoading || !labCode) { 
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-primary to-accent">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Atom className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome!</CardTitle>
            <CardDescription>Loading application or redirecting...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-primary to-accent">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Atom className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>
            Sign in for Lab: <span className="font-semibold text-primary">{labCode}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" /> Login
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 pt-6">
            <Button variant="link" className="text-sm text-primary hover:underline" onClick={handleChangeLabCode}>
                Change Lab Code
            </Button>
            <Link href="#" className="text-sm text-primary hover:underline">
                Forgot password?
            </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
