
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Stethoscope, FileText, FileCheck, AlertTriangle, CheckCircle2, Loader2, CalendarDays, TestTube, Package as PackageIcon } from "lucide-react"; // Added TestTube
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  pendingBills: number;
  partialBills: number;
  reportsToVerify: number;
  reportsVerified: number;
  recentBills: Array<{
    id: number;
    billNumber: string;
    patientName: string;
    grandTotal: string;
    status: string;
    billDate: string;
    createdAt: string;
  }>;
  billStatusSummary: Array<{ name: string; value: number }>;
}

const COLORS = ['#FFBB28', '#FF8042', '#00C49F', '#8884D8']; // Pending, Partial, Done, Cancelled

export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
        router.push('/');
        return;
      }
      try {
        const response = await fetch(`${BACKEND_API_URL}/dashboard/summary`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) {
          if (response.status === 401) router.push('/');
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        } else {
          toast({ title: "Error", description: result.message || "Could not load dashboard data.", variant: "destructive" });
        }
      } catch (error: any) {
        toast({ title: "Network Error", description: error.message || "Failed to connect to server.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [router, toast]);

  const kpiCards = [
    { title: "Total Patients", value: stats?.totalPatients, icon: Users, color: "text-blue-500", bgColor: "bg-blue-50" },
    { title: "Total Doctors", value: stats?.totalDoctors, icon: Stethoscope, color: "text-green-500", bgColor: "bg-green-50" },
    { title: "Pending Bills", value: stats?.pendingBills, icon: FileText, color: "text-orange-500", bgColor: "bg-orange-50" },
    { title: "Partial Bills", value: stats?.partialBills, icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-50" },
    { title: "Reports to Verify", value: stats?.reportsToVerify, icon: FileCheck, color: "text-purple-500", bgColor: "bg-purple-50" },
    { title: "Verified Reports", value: stats?.reportsVerified, icon: CheckCircle2, color: "text-teal-500", bgColor: "bg-teal-50" },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <Card className="shadow-lg border-primary border-2">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Dashboard Overview</CardTitle>
          <CardDescription>Welcome back! Here's a summary of your LMS activity.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={`skeleton-kpi-${i}`} className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          kpiCards.map((metric) => (
            <Card key={metric.title} className={`shadow-md hover:shadow-lg transition-shadow duration-300 ${metric.bgColor}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${metric.color}`}>{metric.title}</CardTitle>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value ?? <Loader2 className="h-6 w-6 animate-spin" />}</div>
                <p className="text-xs text-muted-foreground pt-1">Current Count</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
            <CardDescription>Latest 5 bills created in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                   <div key={`skeleton-recent-${i}`} className="flex items-center gap-3 p-2 rounded-md">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : stats?.recentBills && stats.recentBills.length > 0 ? (
              <ul className="space-y-3">
                {stats.recentBills.map((bill) => (
                  <li key={bill.id} className="flex items-center justify-between gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <Link href={`/bills/edit/${bill.id}`} className="text-sm font-medium text-primary hover:underline">{bill.billNumber} - {bill.patientName}</Link>
                            <p className="text-xs text-muted-foreground flex items-center">
                                <CalendarDays className="mr-1 h-3 w-3"/>
                                {format(new Date(bill.billDate), "PP")} &bull; ₹{bill.grandTotal}
                            </p>
                        </div>
                    </div>
                    <Badge
                        className={
                            bill.status === 'Done' ? 'bg-green-500 text-white' :
                            bill.status === 'Pending' ? 'bg-yellow-500 text-white' :
                            bill.status === 'Partial' ? 'bg-orange-500 text-white' :
                            'bg-gray-500 text-white'
                        }
                    >
                        {bill.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-6">No recent bills found.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Bills by Status</CardTitle>
            <CardDescription>Distribution of bills based on their current status.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[300px]">
            {isLoading ? (
              <Skeleton className="h-[250px] w-full rounded-md" />
            ) : stats?.billStatusSummary && stats.billStatusSummary.some(s => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.billStatusSummary.filter(s => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={60} 
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ payload, percent }) => {
                        const statusName = payload && typeof payload.name === 'string' ? payload.name : 'N/A';
                        return `${statusName} ${(percent * 100).toFixed(0)}%`;
                    }}
                  >
                    {stats.billStatusSummary.filter(s => s.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground">No bill data available for chart.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-lg mt-6">
         <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
         </CardHeader>
         <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Link href="/bills/create" passHref><Button variant="outline" className="w-full h-20 flex-col gap-1"><FileText className="h-6 w-6 text-primary"/>Create Bill</Button></Link>
            <Link href="/patients/create" passHref><Button variant="outline" className="w-full h-20 flex-col gap-1"><Users className="h-6 w-6 text-primary"/>Add Patient</Button></Link>
            <Link href="/reports" passHref><Button variant="outline" className="w-full h-20 flex-col gap-1"><FileCheck className="h-6 w-6 text-primary"/>View Reports</Button></Link>
            <Link href="/doctors/create" passHref><Button variant="outline" className="w-full h-20 flex-col gap-1"><Stethoscope className="h-6 w-6 text-primary"/>Add Doctor</Button></Link>
            <Link href="/tests" passHref><Button variant="outline" className="w-full h-20 flex-col gap-1"><TestTube className="h-6 w-6 text-primary"/>Manage Tests</Button></Link>
         </CardContent>
      </Card>
    </div>
  );
}
