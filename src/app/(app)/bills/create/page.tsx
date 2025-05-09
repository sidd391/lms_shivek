
'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateBillPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
       <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-3xl font-bold flex items-center">
                <FilePlus2 className="mr-3 h-8 w-8 text-primary" />
                Create New Bill
              </CardTitle>
              <CardDescription>Fill in the details below to generate a new bill.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Bill Details</CardTitle>
          <CardDescription>
            This is a placeholder for the create bill form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The form to create a new bill will be implemented here. It will include fields for patient selection, services/tests, amounts, discounts, etc.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
