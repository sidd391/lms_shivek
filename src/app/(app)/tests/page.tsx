
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
  FlaskConical,
  HeartPulse,
  Microscope,
  Droplets,
  Activity,
  Users,
  Settings,
  ChevronRight,
  Eye,
  PackagePlus,
  Radiation,
  ShieldCheck,
  Clipboard, // Changed from ClipboardMedical
  FileText,
  Bug,
  Zap,
  Container,
} from "lucide-react";
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  testCount: number;
  imageSeed: string; // for placeholder image in avatar
}

const mockCategories: TestCategory[] = [
  { id: "biochemistry", name: "Biochemistry", description: "Analysis of chemical processes.", icon: FlaskConical, testCount: 25, imageSeed: "biochemistry lab" },
  { id: "cardiology", name: "Cardiology", description: "Study of heart disorders.", icon: HeartPulse, testCount: 15, imageSeed: "cardiology heart" },
  { id: "clinical-pathology", name: "Clinical Pathology", description: "Diagnosis of disease using lab testing.", icon: Microscope, testCount: 30, imageSeed: "pathology slides" },
  { id: "haematology", name: "Haematology", description: "Study of blood and blood disorders.", icon: Droplets, testCount: 18, imageSeed: "blood cells" },
  { id: "hormones", name: "Hormones", description: "Analysis of hormone levels.", icon: Zap, testCount: 22, imageSeed: "endocrine system" },
  { id: "microbiology", name: "Microbiology", description: "Study of microorganisms.", icon: Bug, testCount: 12, imageSeed: "bacteria virus" },
  { id: "radiology", name: "Radiology", description: "Medical imaging techniques.", icon: Radiation, testCount: 8, imageSeed: "xray scan" },
  { id: "serology", name: "Serology", description: "Study of blood serum and immune responses.", icon: ShieldCheck, testCount: 10, imageSeed: "antibody test" },
  { id: "smear-tests", name: "Smear Tests", description: "Microscopic examination of smears.", icon: Clipboard, testCount: 5, imageSeed: "smear sample" }, // Changed icon
  { id: "general-panels", name: "General Panels", description: "Bundled common tests.", icon: PackagePlus, testCount: 7, imageSeed: "health package" },
];


export default function TestCategoriesPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredCategories = mockCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex items-center gap-4 mb-3">
                  <Avatar className="h-12 w-12 bg-primary/10 text-primary">
                     {/* Using picsum for icon placeholder based on category name */}
                    <AvatarImage src={`https://picsum.photos/seed/${category.imageSeed}/48/48`} alt={category.name} data-ai-hint={category.imageSeed} />
                    <AvatarFallback>
                      <category.icon className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl font-semibold">{category.name}</CardTitle>
                    <CardDescription className="text-sm">{category.description}</CardDescription>
                  </div>
                </div>
                 <Badge variant="secondary" className="w-fit">
                  {category.testCount} Test{category.testCount !== 1 ? 's' : ''}
                </Badge>
              </CardHeader>
              <CardFooter className="border-t pt-4">
                <Link href={`/tests/${category.id}`} passHref className="w-full">
                  <Button variant="outline" className="w-full group hover:bg-accent hover:text-accent-foreground">
                    <Eye className="mr-2 h-5 w-5 text-primary group-hover:text-accent-foreground" /> View Tests
                    <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
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

