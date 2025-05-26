
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  PlusCircle,
  TestTube,
  ChevronRight,
  Eye,
  Container, 
  Loader2, 
  Edit, 
} from "lucide-react";
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; 
import { getIconByName } from '@/lib/icon-map';
import { Skeleton } from '@/components/ui/skeleton';


const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface TestCategory { 
  id: number; 
  name: string;
  description: string | null;
  icon: string | null; 
  testCount: number; 
  imageSeed: string | null;
}


export default function TestCategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categories, setCategories] = React.useState<TestCategory[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        router.push('/');
        return;
      }

      try {
        const response = await fetch(`${BACKEND_API_URL}/test-categories?search=${searchTerm}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) {
          if (response.status === 401) router.push('/');
          throw new Error('Failed to fetch test categories');
        }
        const result = await response.json();
        if (result.success) {
          setCategories(result.data);
        } else {
          toast({ title: "Error", description: result.message || "Could not fetch categories.", variant: "destructive" });
        }
      } catch (error: any) {
        toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
        fetchCategories();
    }, searchTerm ? 300 : 0); 

    return () => clearTimeout(timer);
  }, [searchTerm, router, toast]);


  const filteredCategories = categories; 

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <TestTube className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold">Test Categories</CardTitle>
                <CardDescription>Browse and manage laboratory test categories.</CardDescription>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link href="/tests/create-category" passHref>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Category
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={`skeleton-${i}`} className="shadow-md flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-center gap-4 mb-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32 rounded" />
                    <Skeleton className="h-4 w-48 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </CardHeader>
              <CardFooter className="border-t pt-4 flex gap-2">
                <Skeleton className="h-10 w-1/2 rounded-md" />
                <Skeleton className="h-10 w-1/2 rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const CategoryIcon = getIconByName(category.icon);
            const imageSeed = category.imageSeed || category.name.toLowerCase().replace(/\s+/g, '-');
            return (
              <Card key={category.id} className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                <CardHeader className="flex-grow">
                  <div className="flex items-center gap-4 mb-3">
                    <Avatar className="h-12 w-12 bg-primary/10 text-primary">
                      <AvatarImage src={`https://picsum.photos/seed/${imageSeed}/48/48`} alt={category.name} data-ai-hint={imageSeed} />
                      <AvatarFallback>
                        <CategoryIcon className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl font-semibold">{category.name}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">{category.description || "No description available."}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                     {category.testCount} {category.testCount === 1 ? 'Test' : 'Tests'}
                  </Badge>
                </CardHeader>
                <CardFooter className="border-t pt-4 mt-auto flex gap-2">
                  <Link href={`/tests/edit-category/${category.id}`} passHref className="flex-1">
                    <Button variant="outline" className="w-full group hover:bg-secondary hover:text-secondary-foreground">
                      <Edit className="mr-2 h-5 w-5 text-primary group-hover:text-secondary-foreground" /> Edit
                    </Button>
                  </Link>
                  <Link href={`/tests/${category.id}`} passHref className="flex-1">
                    <Button variant="outline" className="w-full group hover:bg-accent hover:text-accent-foreground">
                      <Eye className="mr-2 h-5 w-5 text-primary group-hover:text-accent-foreground" /> View Tests
                      <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-md">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <Container className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-1">No Categories Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search term." : "You haven't added any test categories yet."}
            </p>
            {!searchTerm && (
                 <Link href="/tests/create-category" passHref className="mt-4">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Category
                    </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
