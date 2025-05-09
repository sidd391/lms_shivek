
'use client';

import * as React from 'react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  PlusCircle,
  CalendarIcon,
  MoreHorizontal,
  Eye,
  Printer,
  Trash2,
  Download,
  Video,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import Link from "next/link";

const billsData = [
  {
    billDate: "2024-07-15",
    billId: "INV001",
    patientName: "Shivek Bhasin",
    phone: "9876543210",
    doctor: "Dr. Emily Carter",
    billTotal: 1500,
    discount: 100,
    due: 1400,
    status: "Paid",
  },
  {
    billDate: "2024-07-14",
    billId: "INV002",
    patientName: "Anya Sharma",
    phone: "8765432109",
    doctor: "Dr. John Davis",
    billTotal: 750,
    discount: 0,
    due: 750,
    status: "Pending",
  },
  {
    billDate: "2024-07-13",
    billId: "INV003",
    patientName: "Rohan Verma",
    phone: "7654321098",
    doctor: "Dr. Alice Smith",
    billTotal: 2200,
    discount: 200,
    due: 0,
    status: "Paid",
  },
  {
    billDate: "2024-07-12",
    billId: "INV004",
    patientName: "Priya Patel",
    phone: "6543210987",
    doctor: "Dr. Robert Jones",
    billTotal: 500,
    discount: 50,
    due: 450,
    status: "Partial",
  },
];

export default function BillsPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date()
  );

  const filteredBills = billsData.filter(
    (bill) =>
      (bill.patientName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (bill.billId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (bill.doctor?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (bill.phone || "").includes(searchTerm)
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-3xl font-bold">Bills</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link href="/bills/create" passHref>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create Bill
                </Button>
              </Link>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full sm:w-auto justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <CardDescription>Manage and track patient billing information.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Date</TableHead>
                <TableHead>Bill ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Doctor</TableHead>
                <TableHead className="text-right">Total (₹)</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Discount (₹)</TableHead>
                <TableHead className="text-right">Due (₹)</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <TableRow key={bill.billId}>
                    <TableCell>{format(new Date(bill.billDate), "PP")}</TableCell>
                    <TableCell className="font-medium">{bill.billId}</TableCell>
                    <TableCell>{bill.patientName}</TableCell>
                    <TableCell className="hidden md:table-cell">{bill.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell">{bill.doctor}</TableCell>
                    <TableCell className="text-right">{bill.billTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{bill.discount.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">{bill.due.toFixed(2)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={
                          bill.status === "Paid"
                            ? "default"
                            : bill.status === "Pending"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          bill.status === "Paid" ? "bg-accent text-accent-foreground" :
                          bill.status === "Pending" ? "bg-destructive text-destructive-foreground" :
                          "bg-yellow-500 text-white"
                        }
                      >
                        {bill.status}
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
                            View Bill
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Bill
                          </DropdownMenuItem>
                           <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Bill
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {filteredBills.length > 0 && (
            <CardFooter className="justify-center border-t pt-6">
                <Button variant="outline" size="sm">Previous</Button>
                <span className="mx-4 text-sm text-muted-foreground">Page 1 of 1</span>
                <Button variant="outline" size="sm">Next</Button>
            </CardFooter>
        )}
      </Card>

      <div className="flex justify-center mt-4">
        <Button variant="outline" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Video className="mr-2 h-5 w-5" />
          Video Tutorial
        </Button>
      </div>
    </div>
  );
}
