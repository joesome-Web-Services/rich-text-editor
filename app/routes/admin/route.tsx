import {
  createFileRoute,
  Outlet,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import { LayoutDashboard, Bell } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    location: { pathname },
  } = useRouterState();

  return (
    <div className="container mx-auto pt-8">
      <div className="flex">
        <aside className="w-64 bg-gray-50 shadow-sm rounded-xl border border-gray-200 h-[80vh] flex flex-col justify-between mr-8">
          <div>
            <div className="px-6 py-6 border-b border-gray-200 mb-2">
              <span className="text-lg font-semibold text-gray-800 tracking-tight">
                Admin
              </span>
            </div>
            <nav className="flex flex-col gap-2 px-4 py-2">
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-transparent text-gray-700 hover:bg-rose-50 hover:text-rose-700 ${
                  pathname === "/admin" || pathname === "/admin/"
                    ? "bg-rose-100 text-rose-700 font-semibold"
                    : ""
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Configuration</span>
              </Link>
              <Link
                to="/admin/notifications"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-transparent text-gray-700 hover:bg-rose-50 hover:text-rose-700 ${
                  pathname === "/admin/notifications"
                    ? "bg-rose-100 text-rose-700 font-semibold"
                    : ""
                }`}
              >
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </Link>
            </nav>
          </div>
        </aside>
        <div className="h-[80vh] border-l border-gray-200" />
        <main className="flex-1 overflow-auto">
          <div className="bg-white shadow rounded-xl border border-gray-200 p-8 min-h-[60vh] w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
