import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getAllCustomers, getAssignedUsers, assignUserToAdmin } from '../api/userApi.js';
import Loader from '../components/common/Loader.jsx';

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (user?.role !== 'admin') return;

    Promise.all([
      getAllCustomers(),
      getAssignedUsers()
    ])
      .then(([customersResponse, assignedResponse]) => {
        setCustomers(customersResponse.data.data || []);
        setAssignedUsers(assignedResponse.data.data || []);
      })
      .catch(() => {
        setCustomers([]);
        setAssignedUsers([]);
        toast.error('Failed to load user data.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, user]);

  const handleAssignUser = async (userId) => {
    try {
      await assignUserToAdmin(userId);
      // Refresh assigned users
      const { data } = await getAssignedUsers();
      setAssignedUsers(data.data || []);
      toast.success('User assigned successfully');
    } catch (error) {
      toast.error('Failed to assign user');
    }
  };

  if (authLoading || loading) {
    return <Loader />;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <p className="text-slate-400 mt-2">Assign customers to manage their orders</p>
      </div>

      <div className="space-y-8">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Assigned Users ({assignedUsers.length})</h2>
          {assignedUsers.length === 0 ? (
            <p className="text-slate-400">No users assigned yet.</p>
          ) : (
            <div className="grid gap-3">
              {assignedUsers.map((assignedUser) => (
                <div key={assignedUser.id} className="rounded-lg border border-slate-600/50 bg-slate-700/30 p-4">
                  <p className="text-white font-medium">{assignedUser.first_name} {assignedUser.last_name}</p>
                  <p className="text-sm text-slate-400">{assignedUser.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Unassigned Customers</h2>
          {customers.filter(c => !c.assigned_admin_id).length === 0 ? (
            <p className="text-slate-400">All customers are assigned.</p>
          ) : (
            <div className="grid gap-3">
              {customers.filter(c => !c.assigned_admin_id).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between rounded-lg border border-slate-600/50 bg-slate-700/30 p-4">
                  <div>
                    <p className="text-white font-medium">{customer.first_name} {customer.last_name}</p>
                    <p className="text-sm text-slate-400">{customer.email}</p>
                  </div>
                  <button
                    onClick={() => handleAssignUser(customer.id)}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
                  >
                    Assign to Me
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}