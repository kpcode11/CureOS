"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Area, AreaChart, XAxis } from "recharts";

interface Stats10Props {
  data: Array<{
    date: string;
    [key: string]: string | number;
  }>;
  summary: Array<{
    name: string;
    tickerSymbol: string;
    value: string | number;
    change: string | number;
    percentageChange: string;
    changeType: "positive" | "negative";
  }>;
  isLoading?: boolean;
}

const data = [
  {
    date: "Jan 18",
    "Active Patients (IPD)": 142,
    "Pending Clinical Orders": 68,
    "Available Beds": 42,
  },
  {
    date: "Jan 19",
    "Active Patients (IPD)": 148,
    "Pending Clinical Orders": 72,
    "Available Beds": 36,
  },
  {
    date: "Jan 20",
    "Active Patients (IPD)": 151,
    "Pending Clinical Orders": 59,
    "Available Beds": 33,
  },
  {
    date: "Jan 21",
    "Active Patients (IPD)": 154,
    "Pending Clinical Orders": 65,
    "Available Beds": 30,
  },
  {
    date: "Jan 22",
    "Active Patients (IPD)": 158,
    "Pending Clinical Orders": 58,
    "Available Beds": 26,
  },
  {
    date: "Jan 23",
    "Active Patients (IPD)": 160,
    "Pending Clinical Orders": 63,
    "Available Beds": 24,
  },
  {
    date: "Jan 24",
    "Active Patients (IPD)": 159,
    "Pending Clinical Orders": 52,
    "Available Beds": 35,
  },
  {
    date: "Jan 25",
    "Active Patients (IPD)": 156,
    "Pending Clinical Orders": 47,
    "Available Beds": 34,
  },
];

const summary = [
  {
    name: "Active Patients (IPD)",
    tickerSymbol: "ADMITTED",
    value: "156",
    change: "+8",
    percentageChange: "+5.4%",
    changeType: "positive",
  },
  {
    name: "Pending Clinical Orders",
    tickerSymbol: "ORDERS",
    value: "47",
    change: "-12",
    percentageChange: "-20.3%",
    changeType: "positive",
  },
  {
    name: "Available Beds",
    tickerSymbol: "BEDS",
    value: "34",
    change: "-5",
    percentageChange: "-12.8%",
    changeType: "negative",
  },
];

const sanitizeName = (name: string) => {
  return name
    .replace(/\\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "_")
    .toLowerCase();
};

export default function Stats10({ data, summary, isLoading = false }: Stats10Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 w-full">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 w-full">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {summary.map((item) => {
          const sanitizedName = sanitizeName(item.name);
          const gradientId = `gradient-${sanitizedName}`;

          const color =
            item.changeType === "positive"
              ? "hsl(142.1 76.2% 36.3%)"
              : "hsl(0 72.2% 50.6%)";

          return (
            <Card key={item.name} className="p-0">
              <CardContent className="p-4 pb-0">
                <div>
                  <dt className="text-sm font-medium text-foreground">
                    {item.name}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({item.tickerSymbol})
                    </span>
                  </dt>
                  <div className="flex items-baseline justify-between">
                    <dd
                      className={cn(
                        item.changeType === "positive"
                          ? "text-green-600 dark:text-green-500"
                          : "text-red-600 dark:text-red-500",
                        "text-lg font-semibold"
                      )}
                    >
                      {item.value}
                    </dd>
                    <dd className="flex items-center space-x-1 text-sm">
                      <span className="font-medium text-foreground">
                        {item.change}
                      </span>
                      <span
                        className={cn(
                          item.changeType === "positive"
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500"
                        )}
                      >
                        ({item.percentageChange})
                      </span>
                    </dd>
                  </div>
                </div>

                <div className="mt-0 h-32 overflow-hidden">
                  <ChartContainer
                    className="w-full h-full"
                    config={{
                      [item.name]: {
                        label: item.name,
                        color: color,
                      },
                    }}
                  >
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient
                          id={gradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={color}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={color}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide={true} />
                      <Area
                        dataKey={item.name}
                        stroke={color}
                        fill={`url(#${gradientId})`}
                        fillOpacity={0.4}
                        strokeWidth={1.5}
                        type="monotone"
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </dl>
    </div>
  );
}
