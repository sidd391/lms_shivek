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
  FormDescription as FormDesc,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, PackagePlus, Beaker, X, Search as SearchIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface TestOption { // Represents a test available for selection
  id: string; // Unique string ID for frontend (e.g., "test_1")
  dbId: number; // Actual database primary key
  name: string;
  price: number;
}

const packageFormSchema = z.object({
  name: z.string().min(3, 'Package name must be at least 3 characters.'),
  packageCode: z.string().optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
  description: z.string().optional(),
  selectedTests: z.array(z.object({ 
    id: z.string(), // Corresponds to TestOption.id (unique string ID)
    dbId: z.number(), // Actual database ID
    name: z.string(), 
    price: z.number() 
  })).min(1, 'At least one test must be selected for the package.'),
  imageSeed: z.string().optional(),
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

export default function CreateTestPackagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [openTestSelector, setOpenTestSelector] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [availableTests, setAvailableTests] = React.useState<TestOption[]>([]);
  const [isLoadingTests, setIsLoadingTests] = React.useState(true);


  React.useEffect(() => {
    const fetchTests = async () => {
      setIsLoadingTests(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        router.push('/');
        setIsLoadingTests(false);
        return;
      }
      try {
        // Fetch all tests from /api/tests endpoint
        const response = await fetch(`${BACKEND_API_URL}/tests`, { 
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) {
           if (response.status === 401) router.push('/');
           throw new Error('Failed to load available tests');
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Transform backend data to TestOption format
          const formattedTests: TestOption[] = result.data.map((test: any) => ({
            id: `test_${test.id}`, // Create a unique string ID like "test_1", "test_2"
            dbId: test.id,         // This is the actual database ID
            name: test.name,
            price: parseFloat(test.price), // Ensure price is a number
          }));
          setAvailableTests(formattedTests);
        } else {
          toast({ title: "Error", description: result.message || "Failed to load tests.", variant: "destructive" });
          setAvailableTests([]);
        }
      } catch (error: any) {
        toast({ title: "Network Error", description: error.message || "Could not fetch tests.", variant: "destructive" });
        setAvailableTests([]);
      } finally {
        setIsLoadingTests(false);
      }
    };
    fetchTests();
  }, [router, toast]);


  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: '',
      packageCode: '',
      price: undefined,
      description: '',
      selectedTests: [],
      imageSeed: '',
    },
  });

  const selectedTestsFromForm = form.watch('selectedTests');

  const handleSelectTest = (test: TestOption) => {
    const currentSelectedTests = form.getValues('selectedTests');
    if (!currentSelectedTests.find(t => t.id === test.id)) { // Use string id for comparison
      form.setValue('selectedTests', [...currentSelectedTests, test], { shouldValidate: true });
    }
    setOpenTestSelector(false);
  };

  const handleRemoveTest = (testId: string) => { // testId is the string id like "test_1"
    const currentSelectedTests = form.getValues('selectedTests');
    form.setValue('selectedTests', currentSelectedTests.filter(t => t.id !== testId), { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<PackageFormValues> = async (data) => {
    setIsSubmitting(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: 'Authentication Error', description: 'Please login.', variant: 'destructive' });
      setIsSubmitting(false);
      router.push('/');
      return;
    }
    
    // Prepare data for backend: extract only dbIds for selectedTests
    const backendPayload = {
      ...data,
      selectedTests: data.selectedTests.map(test => test.dbId), // Send only dbIds (numbers)
    };


    try {
      const response = await fetch(`${BACKEND_API_URL}/test-packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(backendPayload),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({
          title: 'Test Package Created',
          description: `The package "${result.data.name}" has been successfully created.`,
        });
        router.push('/test-packages');
      } else {
        toast({
          title: 'Failed to Create Package',
          description: result.message || 'An error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Create package request error:', error);
      toast({ title: 'Network Error', description: 'Could not connect to the server.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const testsAvailableForSelection = availableTests.filter(
    (test) => !selectedTestsFromForm.some((selected) => selected.id === test.id)
  );

  const calculatedSubtotal = selectedTestsFromForm.reduce((sum, test) => sum + test.price, 0);


  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.push('/test-packages')} aria-label="Go back to packages list" disabled={isSubmitting}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-3xl font-bold flex items-center">
                    <PackagePlus className="mr-3 h-8 w-8 text-primary" />
                    Create New Test Package
                  </CardTitle>
                  <CardDescription>Define a new package by bundling multiple tests.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Comprehensive Wellness Package" {...field} className="text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packageCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CWP001" {...field} className="text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

             <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Price (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 2500" 
                        {...field} 
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} 
                        className="text-base"
                      />
                    </FormControl>
                    <FormDesc>Set the final price for this package. The subtotal of individual tests is ₹{calculatedSubtotal.toFixed(2)}.</FormDesc>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly describe the package and its benefits..."
                        className="min-h-[100px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="imageSeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Seed (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., wellness-package" {...field} className="text-base"/>
                    </FormControl>
                     <FormDesc>Used for placeholder images. If blank, derived from package name.</FormDesc>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="selectedTests"
                render={() => ( 
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-2">Select Tests for Package *</FormLabel>
                    <Popover open={openTestSelector} onOpenChange={setOpenTestSelector}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openTestSelector}
                          className="w-full justify-between text-muted-foreground hover:text-foreground py-3 text-base"
                          disabled={isLoadingTests}
                        >
                          {isLoadingTests ? "Loading tests..." : "Add tests to package..."}
                          {isLoadingTests ? <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" /> : <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search test..." disabled={isLoadingTests}/>
                          <CommandList>
                            {isLoadingTests ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Loading available tests...</div>
                            ) : testsAvailableForSelection.length === 0 ? (
                                <CommandEmpty>No tests available for selection or all tests already added.</CommandEmpty>
                            ) : (
                                <CommandGroup>
                                {testsAvailableForSelection.map((test) => (
                                    <CommandItem
                                    key={test.id} // Use unique TestOption.id here
                                    value={test.name}
                                    onSelect={() => handleSelectTest(test)}
                                    className="cursor-pointer"
                                    >
                                    <div className="flex justify-between w-full items-center">
                                        <div className="flex items-center">
                                        <Beaker className="mr-2 h-4 w-4 text-primary" />
                                        <span>{test.name}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">₹{test.price.toFixed(2)}</span>
                                    </div>
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedTestsFromForm.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-md font-medium text-foreground">Included Tests ({selectedTestsFromForm.length}):</h4>
                  <ScrollArea className="h-auto max-h-60 w-full rounded-md border">
                    <div className="p-4 space-y-2">
                      {selectedTestsFromForm.map(test => (
                        <div 
                          key={test.id} 
                          className="flex items-center justify-between p-2 rounded-md bg-secondary/50"
                        >
                          <div className="flex items-center space-x-2">
                            <Beaker className="h-4 w-4 text-primary" />
                            <span className="text-sm text-secondary-foreground">{test.name}</span>
                            <Badge variant="outline">₹{test.price.toFixed(2)}</Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveTest(test.id)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Remove ${test.name}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="pt-2 text-right">
                      <p className="text-sm text-muted-foreground">
                          Total price of individual tests: <span className="font-semibold text-foreground">₹{calculatedSubtotal.toFixed(2)}</span>
                      </p>
                  </div>
                </div>
              )}


            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => router.push('/test-packages')} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || isLoadingTests}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Package
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

