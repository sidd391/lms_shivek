
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; 
import {
  Search,
  PlusCircle,
  ArrowLeft,
  TestTube,
  Container,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Sigma,
  ListOrdered,
} from "lucide-react";
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getIconByName } from '@/lib/icon-map'; 
import { useToast } from '@/hooks/use-toast';
import type { TestCategory } from '../page'; 
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TestParameterFormValue } from './create-test/page'; // Import TestParameterFormValue

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Test {
  id: number;
  name: string;
  shortCode: string;
  price: number;
  turnAroundTime: string; 
  sampleType: string;
  methodology?: string | null;
  normalRange?: string | null; // Overall normal range
  description?: string | null;
  categoryId: number;
  parameters?: TestParameterFormValue[]; // Make parameters optional for list view
}


export default function CategoryTestsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const categoryId = params.categoryId as string;
  
  const [categoryDetails, setCategoryDetails] = React.useState<TestCategory | null>(null);
  const [tests, setTests] = React.useState<Test[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isLoadingCategory, setIsLoadingCategory] = React.useState(true);
  const [isLoadingTests, setIsLoadingTests] = React.useState(false);
  const [selectedTestForView, setSelectedTestForView] = React.useState<Test | null>(null);
  const [isViewTestDialogOpen, setIsViewTestDialogOpen] = React.useState(false);
  const [isFetchingTestDetails, setIsFetchingTestDetails] = React.useState(false);

  React.useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!categoryId) {
        setIsLoadingCategory(false);
        toast({ title: "Error", description: "Category ID is missing.", variant: "destructive" });
        router.push('/tests');
        return;
      }
      setIsLoadingCategory(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        router.push('/');
        setIsLoadingCategory(false);
        return;
      }

      try {
        const categoryResponse = await fetch(`${BACKEND_API_URL}/test-categories/${categoryId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!categoryResponse.ok) throw new Error('Failed to fetch category details');
        const categoryResult = await categoryResponse.json();
        if (categoryResult.success && categoryResult.data) {
          setCategoryDetails(categoryResult.data);
        } else {
          throw new Error(categoryResult.message || 'Could not load category data.');
        }
      } catch (error: any) {
        toast({ title: "Error fetching category", description: error.message || "Failed to load data.", variant: "destructive" });
      } finally {
        setIsLoadingCategory(false);
      }
    };
    
    fetchCategoryDetails();
  }, [categoryId, router, toast]);

  React.useEffect(() => {
    const fetchTestsForCategory = async () => {
      if (!categoryId || !categoryDetails) return;
      setIsLoadingTests(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        router.push('/');
        setIsLoadingTests(false);
        return;
      }

      try {
        const testsResponse = await fetch(`${BACKEND_API_URL}/test-categories/${categoryId}/tests?search=${searchTerm}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!testsResponse.ok) throw new Error('Failed to fetch tests for this category');
        const testsResult = await testsResponse.json();
        if (testsResult.success) {
          setTests(testsResult.data);
        } else {
          toast({ title: "Error fetching tests", description: testsResult.message || "Could not load tests.", variant: "destructive" });
          setTests([]); 
        }
      } catch (error: any) {
        toast({ title: "Network Error", description: error.message || "Failed to load tests data.", variant: "destructive" });
        setTests([]);
      } finally {
        setIsLoadingTests(false);
      }
    };
    
    const timer = setTimeout(() => {
        if (categoryDetails) { 
             fetchTestsForCategory();
        }
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);

  }, [categoryId, categoryDetails, searchTerm, router, toast]);

  const handleViewTestDetails = async (test: Test) => {
    setSelectedTestForView(test); // Set basic info immediately
    setIsViewTestDialogOpen(true);
    setIsFetchingTestDetails(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Auth Error", description: "Please login.", variant: "destructive" });
      setIsFetchingTestDetails(false);
      setIsViewTestDialogOpen(false);
      return;
    }
    try {
      const response = await fetch(`${BACKEND_API_URL}/tests/${test.id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch test details.');
      const result = await response.json();
      if (result.success && result.data) {
        setSelectedTestForView(result.data); // Update with full details including parameters
      } else {
        throw new Error(result.message || 'Could not load full test details.');
      }
    } catch (error: any) {
      toast({ title: "Error Loading Details", description: error.message, variant: "destructive" });
    } finally {
      setIsFetchingTestDetails(false);
    }
  };
  
  const handleDeleteTest = async (testId: number) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        toast({ title: "Auth Error", description: "Please login.", variant: "destructive" });
        return;
    }
    try {
        const response = await fetch(`${BACKEND_API_URL}/tests/${testId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}`},
        });
        const result = await response.json();
        if (response.ok && result.success) {
            toast({ title: "Test Deleted", description: result.message });
            // Refetch tests
            if (categoryDetails) { // Ensure categoryDetails is not null
                const testsResponse = await fetch(`${BACKEND_API_URL}/test-categories/${categoryId}/tests?search=${searchTerm}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` },
                });
                if (testsResponse.ok) {
                    const testsResult = await testsResponse.json();
                    if (testsResult.success) setTests(testsResult.data);
                }
            }
        } else {
            toast({ title: "Error Deleting Test", description: result.message || "Failed to delete test.", variant: "destructive" });
        }
    } catch (error: any) {
        toast({ title: "Network Error", description: error.message || "Could not connect to server.", variant: "destructive"});
    }
};


  if (isLoadingCategory) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader>
             <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" disabled aria-label="Go back to categories">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-3xl font-bold flex items-center">
                    <Loader2 className="mr-3 h-8 w-8 text-primary animate-spin" />
                    <Skeleton className="h-8 w-48" />
                  </CardTitle>
                  <Skeleton className="h-5 w-64 mt-1" />
                </div>
              </div>
          </CardHeader>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
             <Skeleton className="h-10 w-full md:w-1/3" />
          </CardHeader>
          <CardContent className="p-0">
             <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!categoryDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
        <Container className="h-24 w-24 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Category Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          The test category (ID: {categoryId}) you are looking for either does not exist or could not be loaded. 
          This might be due to an invalid ID or a network issue.
        </p>
        <Button onClick={() => router.push('/tests')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to All Categories
        </Button>
      </div>
    );
  }
  
  const CategoryIcon = getIconByName(categoryDetails.icon);

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => router.push('/tests')} aria-label="Go back to categories">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle className="text-3xl font-bold flex items-center">
                  <CategoryIcon className="mr-3 h-8 w-8 text-primary" />
                  {categoryDetails.name} Tests
                </CardTitle>
                <CardDescription>{categoryDetails.description || "Manage tests under this category."}</CardDescription>
              </div>
            </div>
             <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                    placeholder="Search tests in this category..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Link href={`/tests/${categoryId}/create-test`} passHref>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Test
                    </Button>
                </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead className="hidden sm:table-cell">Short Code</TableHead>
                <TableHead className="text-right">Price (₹)</TableHead>
                <TableHead className="hidden md:table-cell">TAT</TableHead>
                <TableHead className="hidden lg:table-cell">Sample Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTests ? (
                 [...Array(3)].map((_, i) => (
                    <TableRow key={`test-skeleton-${i}`}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-12" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                 ))
              ) : tests.length > 0 ? (
                tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{test.shortCode}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{parseFloat(test.price.toString()).toFixed(2)}</TableCell>
                    <TableCell className="hidden md:table-cell">{test.turnAroundTime}</TableCell>
                    <TableCell className="hidden lg:table-cell">{test.sampleType}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewTestDetails(test)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/tests/${categoryId}/edit/${test.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Test
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => handleDeleteTest(test.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Test
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    <div className="block"> {/* Ensure this is a block element for text-center to apply well */}
                      No tests found in this category{searchTerm ? " matching your search" : ""}.
                    </div>
                    {!searchTerm && (
                        <Link href={`/tests/${categoryId}/create-test`} passHref className="mt-2 inline-block">
                            <Button variant="link" className="text-primary">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add the first test to {categoryDetails.name}
                            </Button>
                        </Link>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
       {isViewTestDialogOpen && selectedTestForView && (
        <Dialog open={isViewTestDialogOpen} onOpenChange={setIsViewTestDialogOpen}>
          <DialogContent className="sm:max-w-lg md:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center text-2xl font-semibold">
                <TestTube className="mr-3 h-7 w-7 text-primary" /> Test Details
              </DialogTitle>
              <DialogDescription>
                Viewing detailed information for "{selectedTestForView.name}".
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            {isFetchingTestDetails ? (
              <div className="space-y-4 p-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-2/3" />
                <Separator className="my-3"/>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <ScrollArea className="max-h-[60vh] pr-3">
                <div className="grid gap-3 py-4 text-sm">
                  <div className="grid grid-cols-[150px_1fr] items-center gap-x-3 gap-y-2">
                    <Label className="text-right text-muted-foreground">Test ID:</Label>
                    <span className="font-medium">TEST-{selectedTestForView.id}</span>

                    <Label className="text-right text-muted-foreground">Name:</Label>
                    <span className="font-medium">{selectedTestForView.name}</span>
                    
                    <Label className="text-right text-muted-foreground">Short Code:</Label>
                    <Badge variant="outline">{selectedTestForView.shortCode}</Badge>

                    <Label className="text-right text-muted-foreground">Price:</Label>
                    <span className="font-medium">₹{parseFloat(selectedTestForView.price.toString()).toFixed(2)}</span>

                    <Label className="text-right text-muted-foreground">TAT:</Label>
                    <span className="font-medium">{selectedTestForView.turnAroundTime}</span>

                    <Label className="text-right text-muted-foreground">Sample Type:</Label>
                    <span className="font-medium">{selectedTestForView.sampleType}</span>

                    <Label className="text-right text-muted-foreground">Methodology:</Label>
                    <span className="font-medium">{selectedTestForView.methodology || 'N/A'}</span>
                    
                    <Label className="text-right text-muted-foreground">Normal Range (Gen):</Label>
                    <span className="font-medium">{selectedTestForView.normalRange || 'N/A'}</span>

                    <Label className="text-right text-muted-foreground col-start-1">Description:</Label>
                    <p className="col-span-1 text-foreground leading-relaxed">{selectedTestForView.description || 'N/A'}</p>
                  </div>

                  {selectedTestForView.parameters && selectedTestForView.parameters.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h4 className="text-md font-semibold mb-3 flex items-center">
                          <ListOrdered className="mr-2 h-5 w-5 text-muted-foreground" /> Parameters ({selectedTestForView.parameters.length})
                        </h4>
                        <div className="space-y-3 rounded-md border p-3 bg-muted/30">
                          {selectedTestForView.parameters.map((param, index) => (
                            <div key={`param-${param.name}-${index}`} className="p-2 rounded-md bg-background shadow-sm">
                              <div className="font-medium text-foreground flex items-center">{param.name} <Badge variant="secondary" className="ml-2">{param.fieldType}</Badge></div>
                              {param.fieldType === 'Formula' ? (
                                <p className="text-xs"><strong className="text-muted-foreground">Formula:</strong> {param.formulaString || 'N/A'}</p>
                              ) : (
                                <>
                                  <p className="text-xs"><strong className="text-muted-foreground">Units:</strong> {param.units || 'N/A'}</p>
                                  <p className="text-xs"><strong className="text-muted-foreground">Range:</strong> {param.rangeText || `${param.rangeLow ?? 'N/A'} - ${param.rangeHigh ?? 'N/A'}`}</p>
                                </>
                              )}
                              {param.fieldType === 'Option List' && param.options && (
                                <p className="text-xs"><strong className="text-muted-foreground">Options:</strong> {(Array.isArray(param.options) ? param.options : []).join(', ') || 'N/A'}</p>
                              )}
                              <p className="text-xs"><strong className="text-muted-foreground">Method:</strong> {param.testMethod || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
            <Separator className="my-4" />
            <DialogFooter className="sm:justify-between">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              <Button 
                onClick={() => { 
                  if (selectedTestForView?.id) {
                    router.push(`/tests/${categoryId}/edit/${selectedTestForView.id}`); 
                    setIsViewTestDialogOpen(false); 
                  }
                }} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!selectedTestForView?.id || isFetchingTestDetails}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

