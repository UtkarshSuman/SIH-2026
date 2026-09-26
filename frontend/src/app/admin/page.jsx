import AdminDashboard from "@/components/admin/admindashboard";

export const metadata = {
  title: "Rescue Arc — Hazard Admin Portal",
  description: "Monitor real-time hazard zones, manage population capacity, and dispatch emergency alerts.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
