import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Activity, FlaskConical, Users, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  const metrics = [
    { title: "Total Labs", value: "128", icon: FlaskConical, imageHint: "laboratory science", imageSeed: "labs" },
    { title: "Active Users", value: "512", icon: Users, imageHint: "people network", imageSeed: "users" },
    { title: "System Status", value: "Operational", icon: CheckCircle, imageHint: "server status", imageSeed: "status" },
    { title: "Recent Experiments", value: "32", icon: Activity, imageHint: "science experiment", imageSeed: "experiments" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Dashboard</CardTitle>
          <CardDescription>Overview of QuantumHook LMS activities and metrics.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.title === "System Status" ? "All systems normal" : "+20.1% from last month"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest actions performed in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <li key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors">
                  <Image
                    src={`https://picsum.photos/seed/activity${i}/40/40`}
                    alt="User activity"
                    width={40}
                    height={40}
                    className="rounded-full"
                    data-ai-hint="user avatar"
                  />
                  <div>
                    <p className="text-sm font-medium">User John Doe {i % 2 === 0 ? "created a new lab" : "updated experiment results"}.</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Lab Utilization</CardTitle>
            <CardDescription>Overview of lab equipment usage.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {/* Placeholder for a chart */}
            <Image
              src="https://picsum.photos/seed/chart-placeholder/400/200"
              alt="Chart placeholder"
              width={400}
              height={200}
              className="rounded-md"
              data-ai-hint="data chart graph"
            />
            {/* In a real app, replace with:
            import { BarChart } from 'recharts'; // or shadcn/ui chart
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={chartData}>...</BarChart>
            </ChartContainer>
            */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
