import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader.jsx';

export default function AdminLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <AdminHeader />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}