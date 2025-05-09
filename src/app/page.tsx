import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Atom } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-primary to-accent">
      <div className="text-center bg-card p-10 rounded-xl shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <Atom className="h-16 w-16 text-primary" />
          <h1 className="ml-4 text-5xl font-bold text-card-foreground">
            QuantumHook LMS
          </h1>
        </div>
        <p className="mb-8 text-xl text-muted-foreground">
          The next generation Lab Management System.
        </p>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
