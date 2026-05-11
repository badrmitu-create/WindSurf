import { AutomationProvider } from "@/context/AutomationContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AutomationProvider>{children}</AutomationProvider>;
}
