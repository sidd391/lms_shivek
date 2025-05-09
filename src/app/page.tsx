import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Atom, LogIn, UserPlus } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-primary to-accent">
      <div className="text-center bg-card p-10 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <Atom className="h-16 w-16 text-primary" />
          <h1 className="ml-4 text-5xl font-bold text-card-foreground">
            QuantumHook LMS
          </h1>
        </div>
        <p className="mb-8 text-xl text-muted-foreground">
          The next generation Lab Management System.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1">
            <Link href="/login">
              <LogIn className="mr-2 h-5 w-5" /> Login
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground flex-1">
            <Link href="/signup">
              <UserPlus className="mr-2 h-5 w-5" /> Sign Up
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
