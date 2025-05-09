import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Image from "next/image";

const labsData = [
  { id: "LAB001", name: "Quantum Entanglement Lab", status: "Active", capacity: 10,负责人: "Dr. Alice Smith", imageSeed: "quantum lab" },
  { id: "LAB002", name: "Bio-Synthesis Lab", status: "Maintenance", capacity: 5,负责人: "Dr. Bob Johnson", imageSeed: "biology lab" },
  { id: "LAB003", name: "Materials Science Lab", status: "Active", capacity: 8,负责人: "Dr. Carol Lee", imageSeed: "material science" },
  { id: "LAB004", name: "High-Performance Computing", status: "Inactive", capacity: 20,负责人: "Dr. David Brown", imageSeed: "computer lab" },
];

export default function LabsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">Labs Management</CardTitle>
              <CardDescription>Manage and monitor all laboratory facilities.</CardDescription>
            </div>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Lab
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search labs by name or ID..." className="pl-10 w-full md:w-1/3" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">Image</TableHead>
                <TableHead>Lab ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Capacity</TableHead>
                <TableHead className="hidden sm:table-cell">负责人</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labsData.map((lab) => (
                <TableRow key={lab.id}>
                  <TableCell className="hidden md:table-cell">
                    <Image
                      src={`https://picsum.photos/seed/${lab.imageSeed}/64/64`}
                      alt={lab.name}
                      width={48}
                      height={48}
                      className="rounded-md aspect-square object-cover"
                      data-ai-hint={lab.imageSeed}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{lab.id}</TableCell>
                  <TableCell>{lab.name}</TableCell>
                  <TableCell>
                    <Badge variant={lab.status === "Active" ? "default" : lab.status === "Maintenance" ? "secondary" : "destructive"}
                           className={
                             lab.status === "Active" ? "bg-accent text-accent-foreground" :
                             lab.status === "Maintenance" ? "bg-yellow-500 text-white" : ""
                           }>
                      {lab.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{lab.capacity}</TableCell>
                  <TableCell className="hidden sm:table-cell">{lab.负责人}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Lab</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                          Delete Lab
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6">
            <Button variant="outline" size="sm">Previous</Button>
            <span className="mx-4 text-sm text-muted-foreground">Page 1 of 10</span>
            <Button variant="outline" size="sm">Next</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
