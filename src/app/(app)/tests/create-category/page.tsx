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
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const categoryFormSchema = z.object({
  name: z.string().min(3, 'Category name must be at least 3 characters.'),
  description: z.string().optional(),
  // icon: z.string().optional(), // For selecting an icon later
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function CreateTestCategoryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit: SubmitHandler<CategoryFormValues> = (data) => {
    console.log('Category data:', data);
    // Here you would typically send the data to your backend API
    toast({
      title: 'Category Created',
      description: `The category "${data.name}" has been successfully created.`,
    });
    // router.push('/tests'); // Navigate back to categories list
    form.reset(); // Reset form for another entry or clear fields
  };

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.push('/tests')} aria-label="Go back to categories">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-3xl font-bold flex items-center">
                    <Layers className="mr-3 h-8 w-8 text-primary" />
                    Add New Test Category
                  </CardTitle>
                  <CardDescription>Fill in the details for the new test category.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Biochemistry, Haematology" {...field} className="text-base"/>
                    </FormControl>
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
                        placeholder="Briefly describe this category..."
                        className="min-h-[100px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Icon selection could be added here later */}
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => router.push('/tests')}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-5 w-5" />
                {form.formState.isSubmitting ? 'Saving...' : 'Save Category'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
