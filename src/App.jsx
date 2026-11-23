import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Collection from './pages/Collection'
import ProductDetail from './pages/ProductDetail'
import OfferPage from './pages/OfferPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ComingSoon from './pages/ComingSoon'
import AdminLogin from './pages/admin/AdminLogin'
import AdminSetup from './pages/admin/AdminSetup'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageAdmins from './pages/admin/ManageAdmins'

import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOffers from './pages/admin/AdminOffers'
import AdminOrders from './pages/admin/AdminOrders'
import SquadOrders from './pages/SquadOrders'
import SquadJoin from './pages/SquadJoin'
import SquadDashboard from './pages/SquadDashboard'
import SizeGuide from './pages/SizeGuide'
import Wishlist from './pages/Wishlist'
import AdminSquads from './pages/admin/AdminSquads'
import AdminChats from './pages/admin/AdminChats'

export default function App() {
  return (
    <Routes>
      {/* Shop: header and footer on every page */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Collection />} />
        <Route path="/category/:categoryId" element={<Collection />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/offers/:offerId" element={<OfferPage />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/squad-orders" element={<SquadOrders />} />
        <Route path="/squad/join/:code" element={<SquadJoin />} />
        <Route path="/squads/:id" element={<ProtectedRoute><SquadDashboard /></ProtectedRoute>} />
        <Route path="/size-guide" element={<SizeGuide />} />
        <Route path="*" element={<ComingSoon title="Page not found" text="We couldn't find that page." />} />
      </Route>

      {/* Customer sign-in pages: split-screen design, no shop header */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin portal */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/setup" element={<AdminSetup />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="admins" element={<ManageAdmins />} />
       
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="offers" element={<AdminOffers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="squads" element={<AdminSquads />} />
        <Route path="chats" element={<AdminChats />} />
      </Route>
    </Routes>
  )
}
