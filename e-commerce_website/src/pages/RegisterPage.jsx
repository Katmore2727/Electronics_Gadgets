import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import Button from '../components/common/Button.jsx';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login: setUser, getPendingCartAction, clearPendingCartAction } = useAuth();
  const { addItem } = useCart();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await register(form);
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      setUser(data.data.user);

      await new Promise((resolve) => setTimeout(resolve, 400));

      const pending = getPendingCartAction();
      if (pending) {
        toast.success('Welcome! Adding your item to cart...');
        await addItem(pending.productId, pending.quantity);
        clearPendingCartAction();
        navigate(pending.fromPage || '/cart');
      } else {
        toast.success('Account created successfully!');
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      const errs = err.response?.data?.errors;
      const errorText = errs ? errs.map((e) => e.message).join('. ') : msg;
      setError(errorText);
      toast.error(errorText);
    } finally {
      setLoading(false);
    }
  };

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Create Account</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              name="firstName"
              placeholder="First name"
              required
              value={form.firstName}
              onChange={update}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              name="lastName"
              placeholder="Last name"
              required
              value={form.lastName}
              onChange={update}
              className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={update}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 8 chars, uppercase, lowercase, number, special)"
            required
            value={form.password}
            onChange={update}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create Account
          </Button>
        </form>
        <p className="mt-4 text-center text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
