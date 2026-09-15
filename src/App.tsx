import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './hooks/useCart'
import { ToastProvider } from './hooks/useToast'
import { CustomerLayout } from './layouts/CustomerLayout'
import { AdminLayout, RequireSection } from './layouts/AdminLayout'

import Home from './pages/customer/Home'
import MenuPage from './pages/customer/MenuPage'
import About from './pages/customer/About'
import GalleryPage from './pages/customer/GalleryPage'
import ReviewsPage from './pages/customer/ReviewsPage'
import Contact from './pages/customer/Contact'
import Reservations from './pages/customer/Reservations'
import Checkout from './pages/customer/Checkout'
import PaymentSuccess from './pages/customer/PaymentSuccess'
import TrackOrder from './pages/customer/TrackOrder'
import { Login, Register } from './pages/customer/Auth'
import {
  AccountLayout,
  AccountProfile,
  AccountOrders,
  AccountReservations,
  AccountReviews,
  AccountFavorites,
} from './pages/customer/Account'

import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminMenu from './pages/admin/AdminMenu'
import AdminCategories from './pages/admin/AdminCategories'
import AdminReservations from './pages/admin/AdminReservations'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminInventory from './pages/admin/AdminInventory'
import AdminReports from './pages/admin/AdminReports'
import AdminReviews from './pages/admin/AdminReviews'
import AdminGallery from './pages/admin/AdminGallery'
import AdminContent from './pages/admin/AdminContent'
import AdminStaff from './pages/admin/AdminStaff'
import AdminSettings from './pages/admin/AdminSettings'
import AdminBranches from './pages/admin/AdminBranches'
import AdminProcurement from './pages/admin/AdminProcurement'
import AdminKitchen from './pages/admin/AdminKitchen'
import AdminDelivery from './pages/admin/AdminDelivery'
import AdminLoyalty from './pages/admin/AdminLoyalty'
import AdminPromotions from './pages/admin/AdminPromotions'
import AdminB2B from './pages/admin/AdminB2B'
import AdminFinance from './pages/admin/AdminFinance'
import AdminOwnerCockpit from './pages/admin/AdminOwnerCockpit'
import AdminArchitecture from './pages/admin/AdminArchitecture'
import AdminIntegrations from './pages/admin/AdminIntegrations'
import AdminDemoCenter from './pages/admin/AdminDemoCenter'
import AdminAudit from './pages/admin/AdminAudit'

import Launcher from './pages/Launcher'
import POS from './pages/pos/POS'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Launcher />} />
              <Route path="/pos" element={<POS />} />

              <Route element={<CustomerLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/reservations" element={<Reservations />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/success/:orderId" element={<PaymentSuccess />} />
                <Route path="/track" element={<TrackOrder />} />
                <Route path="/track/:orderNumber" element={<TrackOrder />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/account" element={<AccountLayout />}>
                  <Route index element={<AccountProfile />} />
                  <Route path="orders" element={<AccountOrders />} />
                  <Route path="reservations" element={<AccountReservations />} />
                  <Route path="reviews" element={<AccountReviews />} />
                  <Route path="favorites" element={<AccountFavorites />} />
                </Route>
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<RequireSection section="orders"><AdminOrders /></RequireSection>} />
                <Route path="menu" element={<RequireSection section="menu"><AdminMenu /></RequireSection>} />
                <Route path="categories" element={<RequireSection section="categories"><AdminCategories /></RequireSection>} />
                <Route path="reservations" element={<RequireSection section="reservations"><AdminReservations /></RequireSection>} />
                <Route path="customers" element={<RequireSection section="customers"><AdminCustomers /></RequireSection>} />
                <Route path="inventory" element={<RequireSection section="inventory"><AdminInventory /></RequireSection>} />
                <Route path="reports" element={<RequireSection section="reports"><AdminReports /></RequireSection>} />
                <Route path="reviews" element={<RequireSection section="reviews"><AdminReviews /></RequireSection>} />
                <Route path="gallery" element={<RequireSection section="gallery"><AdminGallery /></RequireSection>} />
                <Route path="content" element={<RequireSection section="content"><AdminContent /></RequireSection>} />
                <Route path="staff" element={<RequireSection section="staff"><AdminStaff /></RequireSection>} />
                <Route path="settings" element={<RequireSection section="settings"><AdminSettings /></RequireSection>} />
                <Route path="branches" element={<RequireSection section="branches"><AdminBranches /></RequireSection>} />
                <Route path="procurement" element={<RequireSection section="procurement"><AdminProcurement /></RequireSection>} />
                <Route path="kitchen" element={<RequireSection section="kitchen"><AdminKitchen /></RequireSection>} />
                <Route path="delivery" element={<RequireSection section="delivery"><AdminDelivery /></RequireSection>} />
                <Route path="loyalty" element={<RequireSection section="loyalty"><AdminLoyalty /></RequireSection>} />
                <Route path="promotions" element={<RequireSection section="promotions"><AdminPromotions /></RequireSection>} />
                <Route path="b2b" element={<RequireSection section="b2b"><AdminB2B /></RequireSection>} />
                <Route path="finance" element={<RequireSection section="finance"><AdminFinance /></RequireSection>} />
                <Route path="owner-cockpit" element={<RequireSection section="owner_cockpit"><AdminOwnerCockpit /></RequireSection>} />
                <Route path="architecture" element={<RequireSection section="architecture"><AdminArchitecture /></RequireSection>} />
                <Route path="integrations" element={<RequireSection section="integrations"><AdminIntegrations /></RequireSection>} />
                <Route path="demo-center" element={<RequireSection section="demo_center"><AdminDemoCenter /></RequireSection>} />
                <Route path="audit" element={<RequireSection section="audit"><AdminAudit /></RequireSection>} />
              </Route>

              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
