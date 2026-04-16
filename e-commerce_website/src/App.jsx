import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { WishlistProvider } from './contexts/WishlistContext.jsx';
import UserLayout from './components/layout/UserLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import RequireRole from './routes/RequireRole.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';
import AdminProductsPage from './pages/AdminProductsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import Chatbot from './components/chatbot/Chatbot.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                {/* Public routes with UserLayout */}
                <Route path="/" element={<UserLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/:id" element={<ProductDetailPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route
                    path="cart"
                    element={
                      <RequireRole>
                        <CartPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="wishlist"
                    element={
                      <RequireRole>
                        <WishlistPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="checkout"
                    element={
                      <RequireRole>
                        <CheckoutPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="orders"
                    element={
                      <RequireRole>
                        <OrdersPage />
                      </RequireRole>
                    }
                  />
                  {/* Redirect admin users away from user routes */}
                  <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>

                {/* Admin routes with AdminLayout */}
                <Route
                  path="/admin"
                  element={
                    <RequireRole roles={['admin']}>
                      <AdminLayout />
                    </RequireRole>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>
              </Routes>
              <Chatbot />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
