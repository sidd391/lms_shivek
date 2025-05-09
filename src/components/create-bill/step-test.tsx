
'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Beaker, PackagePlus } from 'lucide-react'; // Beaker for tests, PackagePlus for packages
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const mockTests = [
  { id: "T001", name: "Complete Blood Count (CBC)", price: 300 },
  { id: "T002", name: "Lipid Profile", price: 500 },
  { id: "T003", name: "Thyroid Stimulating Hormone (TSH)", price: 400 },
  { id: "T004", name: "Glucose - Fasting", price: 150 },
  { id: "P001", name: "Basic Health Package", price: 1200, isPackage: true },
];


export default function StepTest() {
  const [selectedTests, setSelectedTests] = React.useState<string[]>([]);

  const handleTestSelection = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-2xl font-semibold flex items-center">
          <Beaker className="mr-3 h-7 w-7 text-primary" />
          Select Tests / Packages
        </CardTitle>
        <CardDescription>Choose the tests or packages for the bill.</CardDescription>
      </CardHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="testSearch">Search Tests or Packages</Label>
          <div className="relative">
            <Input id="testSearch" placeholder="e.g., CBC or Health Package" className="pr-10 py-3 text-base" />
            <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
              <Search className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Search Tests</span>
            </Button>
          </div>
        </div>

        <ScrollArea className="h-72 w-full rounded-md border p-4">
          <div className="space-y-3">
            {mockTests.map(test => (
              <div key={test.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id={`test-${test.id}`} 
                    checked={selectedTests.includes(test.id)}
                    onCheckedChange={() => handleTestSelection(test.id)}
                  />
                  <Label htmlFor={`test-${test.id}`} className="flex flex-col cursor-pointer">
                    <span className="font-medium">{test.name} {test.isPackage && <PackagePlus className="inline h-4 w-4 ml-1 text-accent" />}</span>
                    <span className="text-sm text-muted-foreground">₹{test.price.toFixed(2)}</span>
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border border-dashed rounded-md text-muted-foreground">
          <p>Selected Tests: {selectedTests.length}</p>
          {/* Display selected tests summary here */}
        </div>
      </div>
    </div>
  );
}
