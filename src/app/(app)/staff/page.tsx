
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
  Search
} from "lucide-react";

interface StaffMember {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: "Admin" | "Technician" | "Receptionist" | "Doctor" | "Accountant"; 
  status: "Active" | "Inactive";
  imageSeed: string;
}

const initialStaffData: StaffMember[] = [
  { id: "STF001", fullName: "Shivek Bhasin", phone: "9897573479", email: "shivek200221bhasin@gmail.com", role: "Admin", status: "Active", imageSeed: "staff admin" },
  { id: "STF002", fullName: "Alice Johnson", phone: "9876543211", email: "alice.j@example.com", role: "Technician", status: "Active", imageSeed: "staff technician" },
  { id: "STF003", fullName: "Robert Smith", phone: "9876543212", email: "robert.s@example.com", role: "Receptionist", status: "Inactive", imageSeed: "staff receptionist" },
  { id: "STF004", fullName: "Dr. Carol White", phone: "9876543213", email: "carol.w@example.com", role: "Doctor", status: "Active", imageSeed: "staff doctor" },
  { id: "STF005", fullName: "David Lee", phone: "9876543214", email: "david.l@example.com", role: "Accountant", status: "Active", imageSeed: "staff accountant" },
];


export default function StaffPage() {
  const [searchTerm, setSearchTerm] = React.useState(""); 
  const [staffMembers, setStaffMembers] = React.useState(initialStaffData);

  const filteredStaffMembers = staffMembers.filter(staff =>
    (staff.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (staff.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (staff.phone || '').includes(searchTerm) ||
    (staff.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
  
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
                    <CardTitle className="text-3xl font-bold">Staff Management</CardTitle>
                    <CardDescription>Manage staff accounts, roles, and permissions.</CardDescription>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
               <Button variant="outline" className="w-full sm:w-auto">
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
        <CardHeader className={filteredStaffMembers.length > 0 ? "border-b" : ""}>
            <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search staff by name, email, phone, or role..." 
                className="pl-10 w-full md:w-1/2 lg:w-1/3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
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
              {filteredStaffMembers.length > 0 ? (
                filteredStaffMembers.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://picsum.photos/seed/${staff.imageSeed}/40/40`} alt={staff.fullName} data-ai-hint={staff.imageSeed} />
                        <AvatarFallback>{staff.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 sm:hidden"> 
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://picsum.photos/seed/${staff.imageSeed}/32/32`} alt={staff.fullName} data-ai-hint={staff.imageSeed}/>
                          <AvatarFallback>{staff.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {staff.fullName}
                      </div>
                      <span className="hidden sm:inline">{staff.fullName}</span> 
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{staff.phone}</TableCell>
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Staff
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
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
         {filteredStaffMembers.length > 5 && (
            <CardFooter className="justify-center border-t pt-6">
                <Button variant="outline" size="sm">Previous</Button>
                <span className="mx-4 text-sm text-muted-foreground">Page 1 of 1</span> 
                <Button variant="outline" size="sm">Next</Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
