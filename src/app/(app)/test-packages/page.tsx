
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
  Search,
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package as PackageIcon, // Renamed to avoid conflict
  Box,
} from "lucide-react";

interface TestPackage {
  id: string;
  name: string;
  price: number;
  testCount: number;
  description?: string;
  status: "Active" | "Archived";
  imageSeed: string;
}

const initialTestPackages: TestPackage[] = [
  { id: "PKG001", name: "Basic Health Checkup", price: 1500, testCount: 12, description: "Essential tests for a general health overview.", status: "Active", imageSeed: "health checkup" },
  { id: "PKG002", name: "Advanced Cardiac Profile", price: 3200, testCount: 8, description: "Comprehensive heart health assessment.", status: "Active", imageSeed: "cardiac profile" },
  { id: "PKG003", name: "Diabetes Care Package", price: 2200, testCount: 10, description: "Monitoring package for diabetic patients.", status: "Active", imageSeed: "diabetes care" },
  { id: "PKG004", name: "Women's Wellness Package", price: 2800, testCount: 15, description: "Holistic health check for women.", status: "Archived", imageSeed: "wellness woman" },
  { id: "PKG005", name: "Men's Health Screening", price: 2600, testCount: 14, description: "Comprehensive screening for men's health.", status: "Active", imageSeed: "health man" },
];

export default function TestPackagesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [testPackages, setTestPackages] = React.useState(initialTestPackages);

  const filteredTestPackages = testPackages.filter(pkg =>
    (pkg.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (pkg.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: TestPackage["status"]): "default" | "secondary" => {
    switch (status) {
      case "Active":
        return "default"; // Styled by accent color
      case "Archived":
        return "secondary"; // Styled by muted color
      default:
        return "default";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
                <PackageIcon className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-3xl font-bold">Test Packages</CardTitle>
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
                />
              </div>
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
              {filteredTestPackages.length > 0 ? (
                filteredTestPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Avatar className="h-10 w-10 bg-primary/10">
                        <AvatarImage src={`https://picsum.photos/seed/${pkg.imageSeed}/40/40`} alt={pkg.name} data-ai-hint={pkg.imageSeed} />
                        <AvatarFallback>
                            <Box className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 sm:hidden">
                        <Avatar className="h-8 w-8 bg-primary/10">
                          <AvatarImage src={`https://picsum.photos/seed/${pkg.imageSeed}/32/32`} alt={pkg.name} data-ai-hint={pkg.imageSeed} />
                          <AvatarFallback><Box className="h-4 w-4 text-primary" /></AvatarFallback>
                        </Avatar>
                        {pkg.name}
                      </div>
                      <span className="hidden sm:inline">{pkg.name}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{pkg.price.toFixed(2)}</TableCell>
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Package
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
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
        {filteredTestPackages.length > 5 && ( // Basic pagination example
            <CardFooter className="justify-center border-t pt-6">
                <Button variant="outline" size="sm">Previous</Button>
                <span className="mx-4 text-sm text-muted-foreground">Page 1 of 1</span> {/* Update with actual pagination logic */}
                <Button variant="outline" size="sm">Next</Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
