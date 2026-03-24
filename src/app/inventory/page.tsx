import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import {
  getInventoryDashboardItems,
  getItemsForInventory,
  getSuppliers,
} from "@/lib/inventory/queries";
import { InventoryPageClient } from "./InventoryPageClient";

export default async function InventoryPage() {
  const [dashboardItems, activeItems, suppliers] = await Promise.all([
    getInventoryDashboardItems(),
    getItemsForInventory(),
    getSuppliers(),
  ]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-8 lg:py-6">
          <InventoryPageClient
            dashboardItems={dashboardItems}
            activeItems={activeItems}
            suppliers={suppliers}
          />
        </main>
      </div>
    </div>
  );
}
