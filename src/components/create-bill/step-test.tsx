
'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Beaker, FileText, PackagePlus, PlusCircle, Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface Test {
  id: string;
  name: string;
  price: number;
  isPackage?: boolean;
}

const allAvailableTests: Test[] = [
  { id: "T001", name: "Complete Blood Count (CBC)", price: 300 },
  { id: "T002", name: "Lipid Profile", price: 500 },
  { id: "T003", name: "Thyroid Stimulating Hormone (TSH)", price: 400 },
  { id: "T004", name: "Glucose - Fasting", price: 150 },
  { id: "T005", name: "Iron Profile with Ferritin", price: 1650 },
  { id: "T006", name: "Prothrombin Time (PT)", price: 400 },
  { id: "T007", name: "Liver Function Test (LFT)", price: 700 },
  { id: "T008", name: "Kidney Function Test (KFT)", price: 650 },
  { id: "P001", name: "Basic Health Package", price: 1200, isPackage: true },
  { id: "P002", name: "Full Body Checkup", price: 3500, isPackage: true },
];

interface StepTestProps {
  onTestsSelected?: (tests: Test[]) => void;
  // Add initialSelectedTests prop if needed for editing scenarios
}

export default function StepTest({ onTestsSelected }: StepTestProps) {
  const [selectedTests, setSelectedTests] = React.useState<Test[]>([]);
  const [openPopover, setOpenPopover] = React.useState(false);

  const handleSelectTest = (test: Test) => {
    if (!selectedTests.find(t => t.id === test.id)) {
      const newSelectedTests = [...selectedTests, test];
      setSelectedTests(newSelectedTests);
      onTestsSelected?.(newSelectedTests);
    }
    setOpenPopover(false);
  };

  const handleRemoveTest = (testId: string) => {
    const newSelectedTests = selectedTests.filter(t => t.id !== testId);
    setSelectedTests(newSelectedTests);
    onTestsSelected?.(newSelectedTests);
  };

  const availableTestsForSelection = allAvailableTests.filter(
    (test) => !selectedTests.some((selected) => selected.id === test.id)
  );

  const totalAmount = selectedTests.reduce((sum, test) => sum + test.price, 0);

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-2xl font-semibold flex items-center">
          <Beaker className="mr-3 h-7 w-7 text-primary" />
          Tests
        </CardTitle>
        <CardDescription>Add tests or packages to the bill.</CardDescription>
      </CardHeader>
      
      <div className="space-y-4">
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPopover}
              className="w-full justify-between text-muted-foreground hover:text-foreground py-3 text-base"
            >
              {selectedTests.length > 0 ? `Selected ${selectedTests.length} item(s)` : "Select a test or package..."}
              <PlusCircle className="ml-2 h-5 w-5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search test or package..." />
              <CommandList>
                <CommandEmpty>No test or package found.</CommandEmpty>
                <CommandGroup>
                  {availableTestsForSelection.map((test) => (
                    <CommandItem
                      key={test.id}
                      value={test.name}
                      onSelect={() => handleSelectTest(test)}
                      className="cursor-pointer"
                    >
                      <div className="flex justify-between w-full items-center">
                        <div className="flex items-center">
                          {test.isPackage ? <PackagePlus className="mr-2 h-4 w-4 text-accent" /> : <Beaker className="mr-2 h-4 w-4 text-primary" />}
                          <span>{test.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">₹{test.price.toFixed(2)}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedTests.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-lg font-medium text-foreground">Selected Items:</h3>
            <ScrollArea className="h-auto max-h-60 w-full rounded-md border">
              <div className="p-4 space-y-3">
                {selectedTests.map(test => (
                  <div 
                    key={test.id} 
                    className="flex items-center justify-between p-3 rounded-md bg-card shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                        {test.isPackage ? <PackagePlus className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{test.name}</span>
                        <p className="text-sm text-muted-foreground">₹{test.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveTest(test.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${test.name}`}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
             <div className="pt-4 mt-4 border-t">
                <div className="flex justify-between text-lg font-semibold text-primary">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                </div>
            </div>
          </div>
        )}
         {selectedTests.length === 0 && (
            <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground bg-card mt-4">
                <Beaker className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p>No tests or packages selected yet.</p>
                <p className="text-xs">Use the dropdown above to add items to the bill.</p>
            </div>
        )}
      </div>
    </div>
  );
}
