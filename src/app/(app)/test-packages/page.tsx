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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; 
import { Badge } from '@/components/ui/badge';
import {
  Search,
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package as PackageIcon,
  Box,
  Loader2, 
  IndianRupee, 
  FileText as TestListIcon, 
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
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


const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Test { 
  id: number;
  name: string;
  price: number; 
}
interface TestPackage {
  id: number; 
  name: string;
  packageCode: string | null;
  price: number;
  testCount: number; 
  description?: string | null;
  status: "Active" | "Archived";
  imageSeed: string | null;
  tests?: Test[]; 
}

export default function TestPackagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [testPackages, setTestPackages] = React.useState<TestPackage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalPackages, setTotalPackages] = React.useState(0);
  const [limit] = React.useState(5); 
  
  const [selectedPackageForDialog, setSelectedPackageForDialog] = React.useState<TestPackage | null>(null);
  const [detailedPackageData, setDetailedPackageData] = React.useState<TestPackage | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = React.useState(false);
  const [isViewPackageDialogOpen, setIsViewPackageDialogOpen] = React.useState(false);


  const fetchTestPackages = React.useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/test-packages?page=${page}&limit=${limit}&search=${search}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) {
        if (response.status === 401) router.push('/');
        throw new Error('Failed to fetch test packages');
      }
      const result = await response.json();
      if (result.success) {
        setTestPackages(result.data.map((apiPkg: any) => {
            const priceNum = parseFloat(apiPkg.price);
            return {
                ...apiPkg,
                id: parseInt(apiPkg.id, 10), 
                price: isNaN(priceNum) ? 0 : priceNum, 
                testCount: parseInt(apiPkg.testCount, 10) || 0, 
                tests: undefined, // Explicitly set tests to undefined for list items
            } as TestPackage;
        }));
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
        setTotalPackages(result.totalPackages);
      } else {
        toast({ title: "Error", description: result.message || "Could not fetch test packages.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [limit, router, toast]);

  React.useEffect(() => {
    fetchTestPackages(currentPage, searchTerm);
  }, [fetchTestPackages, currentPage, searchTerm]);

  const handleSearch = () => {
    setCurrentPage(1); 
    fetchTestPackages(1, searchTerm);
  };

  const handleKeyPressSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeletePackage = async (packageId: number) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) { router.push('/'); return; }
    try {
        const response = await fetch(`${BACKEND_API_URL}/test-packages/${packageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}`},
        });
        const result = await response.json();
        if(response.ok && result.success) {
            toast({title: "Package Deleted", description: result.message});
            fetchTestPackages(currentPage, searchTerm); 
        } else {
            toast({title: "Error", description: result.message || "Failed to delete package", variant: "destructive"});
        }
    } catch (error) {
        toast({title: "Network Error", description: "Could not connect to server", variant: "destructive"});
    }
  };
  
  const handleViewPackageDetails = async (pkgToList: TestPackage) => {
    setIsViewPackageDialogOpen(true);
    setSelectedPackageForDialog(pkgToList); // Show basic info immediately
    setDetailedPackageData(null); // Reset detailed data
    setIsFetchingDetails(true);

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Auth Error", description: "Please login.", variant: "destructive" });
      setIsViewPackageDialogOpen(false);
      setIsFetchingDetails(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/test-packages/${pkgToList.id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch package details');
      const result = await response.json();
      if (result.success && result.data) {
        const fetchedData = result.data;
        const packagePriceNum = parseFloat(fetchedData.price);

        const testsWithParsedPrices = (fetchedData.tests || []).map((t: any) => ({
          id: Number(t.id),
          name: String(t.name),
          price: parseFloat(t.price) 
        }));
        
        setDetailedPackageData({
          ...fetchedData,
          price: isNaN(packagePriceNum) ? 0 : isNaN(packagePriceNum),
          tests: testsWithParsedPrices
        });
      } else {
        throw new Error(result.message || 'Could not load package details.');
      }
    } catch (error: any) {
      toast({ title: "Error Loading Details", description: error.message, variant: "destructive" });
      // If fetch fails, detailedPackageData remains null, dialog will show basic info
    } finally {
      setIsFetchingDetails(false);
    }
  };


  const getStatusBadgeVariant = (status: TestPackage["status"]): "default" | "secondary" => {
    switch (status) {
      case "Active":
        return "default"; 
      case "Archived":
        return "secondary"; 
      default:
        return "default";
    }
  };

  const filteredTestPackages = testPackages; 

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
                <PackageIcon className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-3xl font-bold">Test Packages ({totalPackages})</CardTitle>
                    <CardDescription>Manage and create test packages for bundled services.</CardDescription>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search packages..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPressSearch}
                />
              </div>
               <Button onClick={handleSearch} className="w-full sm:w-auto">
                  <Search className="mr-2 h-5 w-5 md:hidden" />
                  <span className="hidden md:inline">Search</span>
               </Button>
              <Link href="/test-packages/create" passHref>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Package
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
                <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                <TableHead>Package Name</TableHead>
                <TableHead className="text-right">Price (₹)</TableHead>
                <TableHead className="text-center">No. of Tests</TableHead>
                <TableHead className="hidden lg:table-cell">Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 Array.from({ length: limit }).map((_, index) => (
                    <TableRow key={`skeleton-pkg-${index}`}>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-10" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
              ) : filteredTestPackages.length > 0 ? (
                filteredTestPackages.map((pkg: TestPackage) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Avatar className="h-10 w-10 bg-primary/10 rounded-md">
                        <AvatarFallback className="bg-transparent">
                            <Box className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 sm:hidden">
                        <Avatar className="h-8 w-8 bg-primary/10 rounded-md">
                           <AvatarFallback className="bg-transparent"><Box className="h-4 w-4 text-primary" /></AvatarFallback>
                        </Avatar>
                        {pkg.name}
                      </div>
                      <span className="hidden sm:inline">{pkg.name}</span>
                       {pkg.packageCode && <span className="block text-xs text-muted-foreground">Code: {pkg.packageCode}</span>}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {typeof pkg.price === 'number' ? pkg.price.toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">{pkg.testCount}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-xs">{pkg.description || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(pkg.status)}
                         className={
                          pkg.status === "Active" ? "bg-accent text-accent-foreground" :
                          "bg-muted text-muted-foreground"
                        }
                      >
                        {pkg.status}
                      </Badge>
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => handleViewPackageDetails(pkg)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/test-packages/edit/${pkg.id}`)} >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Package
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                            onClick={() => handleDeletePackage(pkg.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Package
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No test packages found.
                    {searchTerm ? " Try adjusting your search." : (
                        <Link href="/test-packages/create" passHref className="block mt-2">
                            <Button variant="link" className="text-primary">
                                <PlusCircle className="mr-2 h-4 w-4" /> Create the first package
                            </Button>
                        </Link>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="justify-center border-t pt-6 space-x-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1 || isLoading}
                >
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                >
                    Next
                </Button>
            </CardFooter>
        )}
      </Card>
      
      {isViewPackageDialogOpen && selectedPackageForDialog && (
        <Dialog open={isViewPackageDialogOpen} onOpenChange={setIsViewPackageDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-2xl font-semibold">
                       <PackageIcon className="mr-3 h-7 w-7 text-primary" /> Test Package Details
                    </DialogTitle>
                    <DialogDescription>
                        Viewing information for {selectedPackageForDialog.name}.
                    </DialogDescription>
                </DialogHeader>
                <Separator className="my-4" />
                <div className="grid gap-3 py-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-[120px_1fr] items-center gap-x-3 gap-y-1.5">
                        <Label className="text-right text-muted-foreground">Package Name:</Label>
                        <span className="font-medium">{selectedPackageForDialog.name}</span>

                        <Label className="text-right text-muted-foreground">Package Code:</Label>
                        <span className="font-medium">{selectedPackageForDialog.packageCode || 'N/A'}</span>
                        
                        <Label className="text-right text-muted-foreground flex items-center justify-end"><IndianRupee className="mr-1 h-4 w-4"/>Price:</Label>
                        <span className="font-medium">
                           {typeof selectedPackageForDialog.price === 'number' && !isNaN(selectedPackageForDialog.price)
                            ? `₹${selectedPackageForDialog.price.toFixed(2)}`
                            : 'Price N/A'}
                        </span>
                        
                        <Label className="text-right text-muted-foreground">Description:</Label>
                        <p className="col-span-1 text-foreground leading-relaxed">{selectedPackageForDialog.description || 'N/A'}</p>

                        <Label className="text-right text-muted-foreground">Status:</Label>
                        <Badge 
                            variant={getStatusBadgeVariant(selectedPackageForDialog.status)}
                            className={
                                selectedPackageForDialog.status === "Active" ? "bg-accent text-accent-foreground w-fit" :
                                "bg-muted text-muted-foreground w-fit"
                            }
                        >
                          {selectedPackageForDialog.status}
                        </Badge>
                    </div>
                    
                    {isFetchingDetails && (
                         <>
                            <Separator className="my-3"/>
                            <div>
                                <h4 className="text-md font-semibold mb-2 flex items-center">
                                    <TestListIcon className="mr-2 h-5 w-5 text-muted-foreground" /> Included Tests 
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                </h4>
                                <div className="space-y-1.5 p-3 border rounded-md bg-muted/30">
                                    {[...Array(2)].map((_, i) => <Skeleton key={`test-load-${i}`} className="h-6 w-full" />)}
                                </div>
                            </div>
                        </>
                    )}

                    {!isFetchingDetails && detailedPackageData && detailedPackageData.tests && detailedPackageData.tests.length > 0 && (
                        <>
                            <Separator className="my-3"/>
                            <div>
                                <h4 className="text-md font-semibold mb-2 flex items-center">
                                    <TestListIcon className="mr-2 h-5 w-5 text-muted-foreground" /> Included Tests ({detailedPackageData.tests.length})
                                </h4>
                                <ScrollArea className="h-auto max-h-40 w-full rounded-md border p-3 bg-muted/30">
                                    <ul className="space-y-1.5">
                                        {detailedPackageData.tests.map(test => (
                                            <li key={test.id} className="flex justify-between items-center text-xs">
                                                <span>{test.name}</span>
                                                <span className="font-medium text-muted-foreground">
                                                  {typeof test.price === 'number' && !isNaN(test.price) ? `₹${test.price.toFixed(2)}` : 'N/A'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            </div>
                        </>
                    )}
                     {!isFetchingDetails && (!detailedPackageData || !detailedPackageData.tests || detailedPackageData.tests.length === 0) && (
                         <>
                            <Separator className="my-3"/>
                            <div>
                                <h4 className="text-md font-semibold mb-2 flex items-center">
                                    <TestListIcon className="mr-2 h-5 w-5 text-muted-foreground" /> Included Tests
                                </h4>
                                <p className="text-xs text-muted-foreground p-3 border rounded-md bg-muted/30">
                                    {detailedPackageData ? "No tests associated with this package." : "Could not load test details."}
                                </p>
                            </div>
                        </>
                    )}
                </div>
                <Separator className="my-4" />
                <DialogFooter className="sm:justify-between">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                    <Button 
                        onClick={() => { 
                            if (selectedPackageForDialog?.id) {
                                router.push(`/test-packages/edit/${selectedPackageForDialog.id}`); 
                                setIsViewPackageDialogOpen(false); 
                            }
                        }} 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={!selectedPackageForDialog?.id}
                    >
                        <Edit className="mr-2 h-4 w-4" /> Edit Package
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
