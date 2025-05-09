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
  FlaskConical,
  HeartPulse,
  Microscope,
  Droplets,
  Activity,
  PackagePlus,
  Radiation,
  ShieldCheck,
  ClipboardMedical,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Container,
  Bug,
  Zap
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

interface Test {
  id: string;
  name: string;
  shortCode: string;
  price: number;
  turnAroundTime: string; // e.g., "24 hours", "3-5 days"
  sampleType: string;
}

interface TestCategoryDetails {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tests: Test[];
}

// Mock data - in a real app, this would come from an API based on categoryId
const mockTestCategoriesData: Record<string, TestCategoryDetails> = {
  biochemistry: {
    id: "biochemistry",
    name: "Biochemistry",
    description: "Analysis of chemical processes within and relating to living organisms.",
    icon: FlaskConical,
    tests: [
      { id: "BC001", name: "Glucose - Fasting", shortCode: "FBS", price: 150, turnAroundTime: "4 hours", sampleType: "Blood" },
      { id: "BC002", name: "Lipid Profile", shortCode: "LIPID", price: 500, turnAroundTime: "6 hours", sampleType: "Blood" },
      { id: "BC003", name: "Liver Function Test (LFT)", shortCode: "LFT", price: 700, turnAroundTime: "8 hours", sampleType: "Blood" },
    ],
  },
  cardiology: {
    id: "cardiology",
    name: "Cardiology",
    description: "Study and treatment of disorders of the heart and the blood vessels.",
    icon: HeartPulse,
    tests: [
      { id: "CD001", name: "ECG (Electrocardiogram)", shortCode: "ECG", price: 300, turnAroundTime: "30 mins", sampleType: "N/A" },
      { id: "CD002", name: "Troponin I", shortCode: "TROP-I", price: 1200, turnAroundTime: "2 hours", sampleType: "Blood" },
    ],
  },
   "clinical-pathology": {
    id: "clinical-pathology",
    name: "Clinical Pathology",
    description: "Diagnosis of disease using lab testing of bodily fluids.",
    icon: Microscope,
    tests: [
      { id: "CP001", name: "Urine Routine & Microscopy", shortCode: "URM", price: 200, turnAroundTime: "3 hours", sampleType: "Urine" },
      { id: "CP002", name: "Stool Routine Examination", shortCode: "SRM", price: 180, turnAroundTime: "4 hours", sampleType: "Stool" },
    ],
  },
  haematology: {
    id: "haematology",
    name: "Haematology",
    description: "Study of blood, blood-forming organs, and blood diseases.",
    icon: Droplets,
    tests: [
      { id: "HM001", name: "Complete Blood Count (CBC)", shortCode: "CBC", price: 350, turnAroundTime: "2 hours", sampleType: "Blood" },
      { id: "HM002", name: "ESR (Erythrocyte Sedimentation Rate)", shortCode: "ESR", price: 100, turnAroundTime: "1 hour", sampleType: "Blood" },
    ],
  },
  hormones: {
    id: "hormones",
    name: "Hormones",
    description: "Analysis of hormone levels in the body.",
    icon: Zap,
    tests: [
        { id: "HR001", name: "Thyroid Stimulating Hormone (TSH)", shortCode: "TSH", price: 400, turnAroundTime: "6 hours", sampleType: "Blood" },
        { id: "HR002", name: "Free Thyroxine (FT4)", shortCode: "FT4", price: 450, turnAroundTime: "6 hours", sampleType: "Blood" },
    ]
  },
  microbiology: {
    id: "microbiology",
    name: "Microbiology",
    description: "Study of microscopic organisms.",
    icon: Bug,
    tests: [
        { id: "MB001", name: "Culture & Sensitivity - Urine", shortCode: "UCS", price: 600, turnAroundTime: "48-72 hours", sampleType: "Urine" },
        { id: "MB002", name: "Gram Stain", shortCode: "GRAM", price: 250, turnAroundTime: "2 hours", sampleType: "Various" },
    ]
  },
  radiology: {
    id: "radiology",
    name: "Radiology",
    description: "Medical imaging to diagnose and treat diseases.",
    icon: Radiation,
    tests: [
        { id: "RD001", name: "X-Ray Chest PA View", shortCode: "CXR", price: 400, turnAroundTime: "1 hour", sampleType: "N/A" },
        { id: "RD002", name: "Ultrasound Abdomen", shortCode: "USG-ABD", price: 1200, turnAroundTime: "2 hours", sampleType: "N/A" },
    ]
  },
  serology: {
    id: "serology",
    name: "Serology",
    description: "Study of blood serum for antibodies and other substances.",
    icon: ShieldCheck,
    tests: [
        { id: "SR001", name: "HIV Antibody Test", shortCode: "HIV", price: 500, turnAroundTime: "24 hours", sampleType: "Blood" },
        { id: "SR002", name: "HBsAg (Hepatitis B)", shortCode: "HBSAG", price: 450, turnAroundTime: "24 hours", sampleType: "Blood" },
    ]
  },
  "smear-tests": {
    id: "smear-tests",
    name: "Smear Tests",
    description: "Microscopic examination of smears for diagnostic purposes.",
    icon: ClipboardMedical,
    tests: [
        { id: "SM001", name: "Pap Smear", shortCode: "PAP", price: 700, turnAroundTime: "3-5 days", sampleType: "Cervical Smear" },
    ]
  },
  "general-panels": {
    id: "general-panels",
    name: "General Panels",
    description: "Bundled common tests for general health checkups.",
    icon: PackagePlus,
    tests: [
        { id: "GP001", name: "Basic Health Panel", shortCode: "BHP", price: 1500, turnAroundTime: "24 hours", sampleType: "Blood, Urine" },
        { id: "GP002", name: "Executive Health Check", shortCode: "EHC", price: 4500, turnAroundTime: "48 hours", sampleType: "Blood, Urine, etc." },
    ]
  },
};

export default function CategoryTestsPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;
  
  const [categoryDetails, setCategoryDetails] = React.useState<TestCategoryDetails | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (categoryId) {
      // Simulate API fetch
      setIsLoading(true);
      setTimeout(() => {
        const details = mockTestCategoriesData[categoryId];
        setCategoryDetails(details || null);
        setIsLoading(false);
      }, 500);
    }
  }, [categoryId]);

  const filteredTests = categoryDetails?.tests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.shortCode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
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
                    <div className="h-8 w-8 bg-muted rounded-full animate-pulse mr-3" />
                    <div className="h-8 w-40 bg-muted rounded animate-pulse" />
                  </CardTitle>
                  <CardDescription className="h-5 w-60 bg-muted rounded animate-pulse mt-1" />
                </div>
              </div>
          </CardHeader>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <div className="h-10 w-full md:w-1/3 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="p-0">
             <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 w-full bg-muted rounded animate-pulse" />)}
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!categoryDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <Container className="h-24 w-24 text-destructive" />
        <h1 className="text-2xl font-bold">Category Not Found</h1>
        <p className="text-muted-foreground">The test category you are looking for does not exist or could not be loaded.</p>
        <Button onClick={() => router.push('/tests')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Categories
        </Button>
      </div>
    );
  }
  
  const CategoryIcon = categoryDetails.icon;

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
                <CardDescription>{categoryDetails.description}</CardDescription>
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
              {filteredTests.length > 0 ? (
                filteredTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{test.shortCode}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{test.price.toFixed(2)}</TableCell>
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Test
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    No tests found in this category{searchTerm ? " matching your search" : ""}.
                    {!searchTerm && (
                        <Link href={`/tests/${categoryId}/create-test`} passHref className="mt-2 inline-block">
                            <Button variant="link" className="text-primary">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add the first test
                            </Button>
                        </Link>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {categoryDetails.tests.length > 5 && ( // Basic pagination example
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
