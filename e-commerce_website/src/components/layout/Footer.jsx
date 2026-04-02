import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../../api/productApi.js';

export default function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories((data.data || []).slice(0, 2)))
      .catch(() => setCategories([]));
  }, []);

  return (
    <footer className="bg-slate-900/50 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-white mb-4">YasHub</h4>
            <p className="text-slate-400 text-sm">
              Your premium destination for electronics and gadgets.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-slate-400 hover:text-cyan-400 text-sm">All Products</Link></li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="text-slate-400 hover:text-cyan-400 text-sm"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-slate-400 hover:text-cyan-400 text-sm">Login</Link></li>
              <li><Link to="/register" className="text-slate-400 hover:text-cyan-400 text-sm">Register</Link></li>
              <li><Link to="/cart" className="text-slate-400 hover:text-cyan-400 text-sm">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <p className="text-slate-400 text-sm">support@yasHub.com</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} YasHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
