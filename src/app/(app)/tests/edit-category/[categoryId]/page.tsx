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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Edit, Loader2, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { availableIconsForCategories, getIconByName, type IconName } from '@/lib/icon-map';
import { Skeleton } from '@/components/ui/skeleton';
import type { TestCategory } from '../../page'; // Import TestCategory type

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const categoryFormSchema = z.object({
  name: z.string().min(3, 'Category name must be at least 3 characters.'),
  description: z.string().optional(),
  icon: z.custom<IconName>((val) => typeof val === 'string' && Object.keys(availableIconsForCategories).includes(val), {
    message: "Please select a valid icon.",
  }).optional(),
  imageSeed: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const NO_ICON_SELECTED_VALUE = "_NO_ICON_";

export default function EditTestCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;
  const { toast } = useToast();
  const [isLoadingCategory, setIsLoadingCategory] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: undefined,
      imageSeed: '',
    },
  });

  React.useEffect(() => {
    if (categoryId) {
      const fetchCategoryData = async () => {
        setIsLoadingCategory(true);
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
          router.push('/');
          return;
        }
        try {
          const response = await fetch(`${BACKEND_API_URL}/test-categories/${categoryId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch category data');
          }
          const result = await response.json();
          if (result.success && result.data) {
            const category: TestCategory = result.data;
            form.reset({
              name: category.name || '',
              description: category.description || '',
              icon: category.icon as IconName || undefined,
              imageSeed: category.imageSeed || '',
            });
          } else {
            toast({ title: "Error", description: "Category data not found.", variant: "destructive" });
            router.push('/tests');
          }
        } catch (error) {
          console.error('Error fetching category:', error);
          toast({ title: "Error", description: "Could not load category data.", variant: "destructive" });
          router.push('/tests');
        } finally {
          setIsLoadingCategory(false);
        }
      };
      fetchCategoryData();
    }
  }, [categoryId, form, router, toast]);

  const onSubmit: SubmitHandler<CategoryFormValues> = async (data) => {
    setIsSubmitting(true);
    const authToken = localStorage.getItem('authToken');
     if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...data,
        imageSeed: data.imageSeed || data.name.toLowerCase().replace(/\s+/g, '-').slice(0, 20),
      };

      const response = await fetch(`${BACKEND_API_URL}/test-categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({
          title: 'Category Updated',
          description: `The category "${result.data.name}" has been successfully updated.`,
        });
        router.push('/tests');
      } else {
        toast({
          title: 'Failed to Update Category',
          description: result.message || 'An error occurred during update.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Update category request error:', error);
      toast({
        title: 'Network Error',
        description: 'Could not connect to the server. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIconName = form.watch('icon');
  const IconPreview = selectedIconName ? getIconByName(selectedIconName) : Layers;

  if (isLoadingCategory) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-3/5" /></CardHeader>
        </Card>
        <Card className="shadow-md">
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
             <Skeleton className="h-20 w-full md:col-span-2 lg:col-span-3" />
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.push('/tests')} aria-label="Go back to categories" disabled={isSubmitting}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-3xl font-bold flex items-center">
                    <Edit className="mr-3 h-8 w-8 text-primary" />
                    Edit Test Category
                  </CardTitle>
                  <CardDescription>Update the details for category: {form.getValues('name') || `ID: ${categoryId}`}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name *</FormLabel>
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
                        value={field.value || ''} // Ensure it's not null
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (Optional)</FormLabel>
                    <div className="flex items-center gap-3">
                        <Select 
                          onValueChange={(value) => {
                            if (value === NO_ICON_SELECTED_VALUE) {
                              field.onChange(undefined);
                            } else {
                              field.onChange(value as IconName);
                            }
                          }} 
                          value={field.value || NO_ICON_SELECTED_VALUE}
                        >
                        <FormControl>
                            <SelectTrigger className="flex-grow">
                            <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value={NO_ICON_SELECTED_VALUE}>No Icon / Clear selection</SelectItem>
                            {Object.entries(availableIconsForCategories).map(([name, label]) => (
                            <SelectItem key={name} value={name}>
                                {label}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <div className="p-2 border rounded-md bg-muted">
                            <IconPreview className="h-6 w-6 text-muted-foreground" />
                        </div>
                    </div>
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
                      <Input 
                        placeholder="e.g., blood-samples, lab-test" 
                        {...field} 
                        className="text-base"
                        value={field.value || ''} // Ensure it's not null
                      />
                    </FormControl>
                    <FormMessage />
                     <p className="text-xs text-muted-foreground">
                        Used for placeholder images. If blank, derived from category name.
                    </p>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => router.push('/tests')} disabled={isSubmitting}>
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
                    Update Category
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
