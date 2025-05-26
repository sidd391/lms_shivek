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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users, 
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  KeyRound,
  Eye,
  Search,
  Loader2,
  Mail,
  PhoneIcon,
  Shield, // For Role
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import type { StaffRole } from '@/backend/models/User'; 
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

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface StaffMember {
  id: number; 
  fullName: string;
  phone: string | null;
  email: string;
  role: StaffRole; 
  status: "Active" | "Inactive";
  imageSeed?: string; 
  title?: string | null; // Added title for view details
}


export default function StaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState(""); 
  const [staffMembers, setStaffMembers] = React.useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalStaff, setTotalStaff] = React.useState(0);
  const [limit] = React.useState(5); 
  const [selectedStaffForView, setSelectedStaffForView] = React.useState<StaffMember | null>(null);
  const [isViewStaffDialogOpen, setIsViewStaffDialogOpen] = React.useState(false);


  const fetchStaff = React.useCallback(async (page: number, search: string) => {
    setIsLoading(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      router.push('/');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/staff?page=${page}&limit=${limit}&search=${search}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) {
        if (response.status === 401) router.push('/');
        throw new Error('Failed to fetch staff members');
      }
      const result = await response.json();
      if (result.success) {
        const fetchedStaff = result.data.map((s: any) => ({
          ...s,
          imageSeed: `${s.firstName}${s.lastName}`.toLowerCase().replace(/\s+/g, ''),
        }));
        setStaffMembers(fetchedStaff);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
        setTotalStaff(result.totalStaff);
      } else {
        toast({ title: "Error", description: result.message || "Could not fetch staff members.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [limit, router, toast]);

  React.useEffect(() => {
    fetchStaff(currentPage, searchTerm);
  }, [fetchStaff, currentPage, searchTerm]);

  const handleSearch = () => {
    setCurrentPage(1); 
    fetchStaff(1, searchTerm);
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

  const handleDeactivateStaff = async (staffId: number) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) { router.push('/'); return; }
    try {
        const response = await fetch(`${BACKEND_API_URL}/staff/${staffId}`, {
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${authToken}`},
        });
        const result = await response.json();
        if(response.ok && result.success) {
            toast({title: "Staff Deactivated", description: result.message || "Staff member has been deactivated."});
            fetchStaff(currentPage, searchTerm); 
        } else {
            toast({title: "Error", description: result.message || "Failed to deactivate staff member.", variant: "destructive"});
        }
    } catch (error: any) {
        toast({title: "Network Error", description: error.message || "Could not connect to server.", variant: "destructive"});
    }
  };

  const handleViewStaffDetails = (staff: StaffMember) => {
    setSelectedStaffForView(staff);
    setIsViewStaffDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: StaffMember["status"]): "default" | "secondary" => {
    switch (status) {
      case "Active":
        return "default"; 
      case "Inactive":
        return "secondary";
      default:
        return "secondary";
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-3xl font-bold">Staff Management ({totalStaff})</CardTitle>
                    <CardDescription>Manage staff accounts, roles, and permissions.</CardDescription>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
               <Button variant="outline" className="w-full sm:w-auto" onClick={() => alert('Change Admin Password functionality to be implemented.')}>
                  <KeyRound className="mr-2 h-5 w-5" /> Change Admin Password
                </Button>
              <Link href="/staff/create" passHref>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create New Staff
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardHeader className={staffMembers.length > 0 ? "border-b" : ""}>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                  placeholder="Search staff by name, email, phone, or role..." 
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
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Avatar</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden lg:table-cell">Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: limit }).map((_, index) => (
                    <TableRow key={`skeleton-staff-${index}`}>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
              ) : staffMembers.length > 0 ? (
                staffMembers.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://picsum.photos/seed/${staff.imageSeed || staff.id}/40/40`} alt={staff.fullName} data-ai-hint={staff.imageSeed || "person avatar"} />
                        <AvatarFallback>{staff.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 sm:hidden"> 
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://picsum.photos/seed/${staff.imageSeed || staff.id}/32/32`} alt={staff.fullName} data-ai-hint={staff.imageSeed || "person avatar"}/>
                          <AvatarFallback>{staff.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {staff.fullName}
                      </div>
                      <span className="hidden sm:inline">{staff.fullName}</span> 
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{staff.phone || 'N/A'}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{staff.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(staff.status)}
                         className={
                          staff.status === "Active" ? "bg-accent text-accent-foreground" :
                          "bg-muted text-muted-foreground"
                        }
                      >
                        {staff.status}
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
                          <DropdownMenuItem onClick={() => handleViewStaffDetails(staff)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/staff/edit/${staff.id}`)} >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Staff
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                            onClick={() => handleDeactivateStaff(staff.id)}
                            disabled={staff.email === 'admin@quantumhook.dev'}
                           >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deactivate Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No staff members found.
                    {searchTerm ? " Try adjusting your search." : (
                        <Link href="/staff/create" passHref className="block mt-2">
                            <Button variant="link" className="text-primary">
                                <PlusCircle className="mr-2 h-4 w-4" /> Create the first staff member
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

      {selectedStaffForView && (
        <Dialog open={isViewStaffDialogOpen} onOpenChange={setIsViewStaffDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-2xl font-semibold">
                <Users className="mr-3 h-7 w-7 text-primary" />
                Staff Details
              </DialogTitle>
              <DialogDescription>
                Viewing information for {selectedStaffForView.fullName}.
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <div className="grid gap-3 py-4 text-sm">
              <div className="grid grid-cols-[100px_1fr] items-center gap-x-3 gap-y-1.5">
                <Label className="text-right text-muted-foreground">Full Name:</Label>
                <span className="font-medium">{selectedStaffForView.fullName}</span>
                
                <Label className="text-right text-muted-foreground flex items-center justify-end"><Mail className="mr-1 h-4 w-4"/>Email:</Label>
                <span className="font-medium truncate">{selectedStaffForView.email}</span>
                
                <Label className="text-right text-muted-foreground flex items-center justify-end"><PhoneIcon className="mr-1 h-4 w-4"/>Phone:</Label>
                <span className="font-medium">{selectedStaffForView.phone || 'N/A'}</span>
                
                <Label className="text-right text-muted-foreground flex items-center justify-end"><Shield className="mr-1 h-4 w-4"/>Role:</Label>
                <span className="font-medium">{selectedStaffForView.role}</span>
                
                <Label className="text-right text-muted-foreground">Status:</Label>
                 <Badge 
                    variant={getStatusBadgeVariant(selectedStaffForView.status)}
                    className={
                        selectedStaffForView.status === "Active" ? "bg-accent text-accent-foreground w-fit" :
                        "bg-muted text-muted-foreground w-fit"
                    }
                >
                  {selectedStaffForView.status}
                </Badge>
              </div>
            </div>
            <Separator className="my-4" />
            <DialogFooter className="sm:justify-between">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              <Button 
                onClick={() => { 
                  router.push(`/staff/edit/${selectedStaffForView.id}`); 
                  setIsViewStaffDialogOpen(false); 
                }} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}