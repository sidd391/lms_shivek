'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  FormDescription as FormDesc, // Renamed to avoid conflict
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Added Select

// Mock data for category name - in a real app, fetch this or pass via props/state
const mockCategoryNames: Record<string, string> = {
  biochemistry: "Biochemistry",
  cardiology: "Cardiology",
  "clinical-pathology": "Clinical Pathology",
  haematology: "Haematology",
  hormones: "Hormones",
  microbiology: "Microbiology",
  radiology: "Radiology",
  serology: "Serology",
  "smear-tests": "Smear Tests",
  "general-panels": "General Panels",
};


const testFormSchema = z.object({
  name: z.string().min(3, 'Test name must be at least 3 characters.'),
  shortCode: z.string().min(2, 'Short code must be at least 2 characters.').max(10, 'Short code too long.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
  turnAroundTime: z.string().min(1, 'Turnaround time is required.'),
  sampleType: z.string().min(1, 'Sample type is required.'),
  methodology: z.string().optional(),
  normalRange: z.string().optional(),
  description: z.string().optional(),
});

type TestFormValues = z.infer<typeof testFormSchema>;

export default function CreateTestPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const categoryId = params.categoryId as string;
  
  // For display purposes, get category name (in real app, this might be fetched or passed)
  const categoryName = mockCategoryNames[categoryId] || "Selected Category";


  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      name: '',
      shortCode: '',
      price: undefined,
      turnAroundTime: '',
      sampleType: '',
      methodology: '',
      normalRange: '',
      description: '',
    },
  });

  const onSubmit: SubmitHandler<TestFormValues> = (data) => {
    console.log('Test data for category', categoryId, ':', data);
    // Here you would typically send the data to your backend API
    toast({
      title: 'Test Created',
      description: `The test "${data.name}" has been successfully added to ${categoryName}.`,
    });
    // router.push(`/tests/${categoryId}`);
    form.reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.push(`/tests/${categoryId}`)} aria-label="Go back to tests list">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-3xl font-bold flex items-center">
                    <TestTube className="mr-3 h-8 w-8 text-primary" />
                    Add New Test
                  </CardTitle>
                  <CardDescription>Fill in the details for the new test in the "{categoryName}" category.</CardDescription>
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
                      <FormLabel>Test Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Complete Blood Count" {...field} className="text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shortCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Code / Abbreviation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CBC, FBS" {...field} className="text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 350" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} className="text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="turnAroundTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turnaround Time (TAT)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 24 hours, 3-5 days" {...field} className="text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="sampleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sample Type</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Select sample type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Blood">Blood</SelectItem>
                          <SelectItem value="Serum">Serum</SelectItem>
                          <SelectItem value="Plasma">Plasma</SelectItem>
                          <SelectItem value="Urine">Urine</SelectItem>
                          <SelectItem value="Stool">Stool</SelectItem>
                          <SelectItem value="Swab">Swab</SelectItem>
                          <SelectItem value="Biopsy">Biopsy</SelectItem>
                          <SelectItem value="CSF">CSF (Cerebrospinal Fluid)</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="N/A">N/A (e.g. for imaging)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="methodology"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Methodology (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Spectrophotometry, ELISA" {...field} className="text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="normalRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Normal Range (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 70-110 mg/dL" {...field} className="text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description / Clinical Significance (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly describe the test and its use..."
                        className="min-h-[120px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDesc>
                      This information can help staff understand the test better.
                    </FormDesc>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => router.push(`/tests/${categoryId}`)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-5 w-5" />
                {form.formState.isSubmitting ? 'Saving...' : 'Save Test'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
