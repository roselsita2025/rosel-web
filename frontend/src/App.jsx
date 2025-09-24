import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import FloatingShape from "./components/FloatingShape";
import NavBar from "./components/NavBar";
import MainContent from "./components/MainContent.jsx";
import { SidebarProvider, useSidebar } from "./contexts/SidebarContext.jsx";

import LoginPage from "./pages/AuthPages/LoginPage.jsx";
import SignUpPage from "./pages/AuthPages/SignUpPage.jsx";
import EmailVerificationPage from "./pages/AuthPages/EmailVerificationPage.jsx";
import ForgotPasswordPage from "./pages/AuthPages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/AuthPages/ResetPasswordPage.jsx";

import DashboardPage from "./pages/AdminPages/DashboardPage.jsx";
import ManageProductsPage from "./pages/AdminPages/ManageProductsPage.jsx";
import OrderManagementPage from "./pages/AdminPages/OrderManagementPage.jsx";
import CouponsPage from "./pages/AdminPages/CouponsPage.jsx";
import AdminReplacementRequestsPage from "./pages/AdminPages/ReplacementRequestsPage.jsx";
import ReplacementRequestDetailsPage from "./pages/AdminPages/ReplacementRequestDetailsPage.jsx";
import ChatManagementPage from "./pages/AdminPages/ChatManagementPage.jsx";
import POSPage from "./pages/AdminPages/POSPage.jsx";
import POSHistoryPage from "./pages/AdminPages/POSHistoryPage.jsx";

import ProfilePage from "./pages/ProfilePage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import CategoryPage from "./pages/GuestPages/CategoryPage.jsx";
import ProductDetailPage from "./pages/GuestPages/ProductDetailPage.jsx";
import CartsPage from "./pages/CustomerPages/CartsPage.jsx";
import InformationPage from "./pages/CustomerPages/InformationPage.jsx";
import ShippingOptionsPage from "./pages/CustomerPages/ShippingOptionsPage.jsx";
import PaymentPage from "./pages/CustomerPages/PaymentPage.jsx";
import PurchaseSuccessPage from "./pages/CustomerPages/PurchaseSuccessPage.jsx";
import PurchaseCancelPage from "./pages/CustomerPages/PurchaseCancelPage.jsx";
import TrackOrdersPage from "./pages/CustomerPages/TrackOrdersPage.jsx";
import CustomerReplacementRequestsPage from "./pages/CustomerPages/ReplacementRequestsPage.jsx";
import ReplacementRequestPage from "./pages/CustomerPages/ReplacementRequestPage.jsx";
import NotificationCenterPage from "./pages/CustomerPages/NotificationCenterPage.jsx";
import AdminNotificationCenterPage from "./pages/AdminPages/NotificationCenterPage.jsx";
import WelcomePage from "./pages/GuestPages/WelcomePage.jsx";
import ProductsPage from "./pages/GuestPages/ProductsPage.jsx";
import SearchResultsPage from "./pages/GuestPages/SearchResultsPage.jsx";
import AboutPage from "./pages/GuestPages/AboutPage.jsx";
import ContactUsPage from "./pages/GuestPages/ContactUsPage.jsx";
import OrderGuidelinesPage from "./pages/GuestPages/OrderGuidelinesPage.jsx";
import PrivacyPolicyPage from "./pages/GuestPages/PrivacyPolicyPage.jsx";
import ReplacementPolicyPage from "./pages/GuestPages/ReplacementPolicyPage.jsx";
import TermsOfServicePage from "./pages/GuestPages/TermsOfServicePage.jsx";

import LoadingSpinner from "./components/LoadingSpinner";
import ChatFloatingButton from "./components/ChatFloatingButton.jsx";
import ChatModal from "./components/ChatModal.jsx";

import { Toaster } from 'react-hot-toast';
import { useAuthStore } from "./store/authStore.js";
import { useChatStore } from "./store/chatStore.js";
import { useEffect, useRef } from "react";
import { cartStore } from "./store/cartStore.js";





// Redirect unauthenticated user
const ProtectedRoute = ({children}) => {
  const {isAuthenticated,user} = useAuthStore();

  if(!isAuthenticated){
    return <Navigate to="/login" replace />;
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  return children;
};

//Redirect authenticated user 
const RedirectAuthenticatedUser = ({children}) => {
  const {isAuthenticated,user} = useAuthStore();

  if(isAuthenticated && user.isVerified){
    return <Navigate to='/' replace />;
  }

  return children; 
};

// Admin-only route - only admins can access, others redirected to appropriate pages
const AdminRoute = ({children}) => {
  const {isAuthenticated, user} = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Customer-only route - only customers can access, others redirected to appropriate pages
const CustomerRoute = ({children}) => {
  const {isAuthenticated, user} = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (user.role !== "customer") {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Guest-only route - only non-authenticated users can access
const GuestRoute = ({children}) => {
  const {isAuthenticated, user} = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    if (user.role === "admin") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

// Admin restricted route - admins cannot access, others can
const AdminRestrictedRoute = ({children}) => {
  const {isAuthenticated, user} = useAuthStore();

  if (isAuthenticated && user.isVerified && user.role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Customer restricted route - customers cannot access, others can
const CustomerRestrictedRoute = ({children}) => {
  const {isAuthenticated, user} = useAuthStore();

  if (isAuthenticated && user.isVerified && user.role === "customer") {
    return <Navigate to="/" replace />;
  }

  return children;
};


function App() {
  const {isCheckingAuth, checkAuth, user} = useAuthStore();
  const {getCartItems, mergeGuestCartToServer} = cartStore();
  const {initializeSocket, disconnectSocket} = useChatStore();
  const socketInitialized = useRef(false);

  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const isAdminPage = ["/dashboard", "/analytics", "/profile", "/account-settings", "/coupons", "/manage-products", "/order-management", "/admin/replacement-requests", "/admin/chat-management"].includes(location.pathname) || location.pathname.startsWith("/admin/replacement-requests/");

  const hideNavbar = ["/login", "/signup", "/forgot-password", "/verify-email"].includes(location.pathname);

  useEffect(()=>{
    checkAuth();
  },[checkAuth]);

  useEffect(() => {
    getCartItems();
  }, [getCartItems]);
 
  // After authentication, if customer, merge any guest cart
  useEffect(() => {
    if (user && user.isVerified && user.role === 'customer') {
      mergeGuestCartToServer();
    }
  }, [user, mergeGuestCartToServer]);

  // Initialize socket connection globally when user is authenticated
  useEffect(() => {
    // Only proceed if authentication check is complete
    if (isCheckingAuth) return;
    
    if (user && user.isVerified && !socketInitialized.current) {
      // Get socket token from backend
      const getSocketToken = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/socket-token`, {
            credentials: 'include' // Include cookies for authentication
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.token) {
              console.log('🚀 Initializing global socket connection for user:', user.name, 'Role:', user.role);
              initializeSocket(data.token);
              socketInitialized.current = true;
            } else {
              console.error('❌ Failed to get socket token:', data.message);
            }
          } else {
            console.error('❌ Failed to get socket token: HTTP', response.status);
          }
        } catch (error) {
          console.error('❌ Error getting socket token:', error);
        }
      };
      
      getSocketToken();
    } else if (!user && !isCheckingAuth) {
      // Guest user - no socket connection needed (only log when auth check is complete)
      console.log('👤 Guest user - no socket connection required');
    }

    return () => {
      if (user && socketInitialized.current) {
        console.log('🛑 Disconnecting global socket for user:', user.name);
        disconnectSocket();
        socketInitialized.current = false;
      }
    };
  }, [user?.id, user?.isVerified, isCheckingAuth]); // Include isCheckingAuth in dependencies
    

  if (isCheckingAuth) return <LoadingSpinner />; 

  return (
    <div className={`min-h-screen ${isAdmin && isAdminPage ? 'bg-[#fffefc]' : 'bg-[#f8f3ed]'} relative`}>

      {!hideNavbar && <NavBar />}

      <MainContent isAdmin={isAdmin} isAdminPage={isAdminPage}>
        <Routes> 
        {/* Public routes - accessible to all users except admins */}
        <Route path = '/' element = { <AdminRestrictedRoute> <WelcomePage /> </AdminRestrictedRoute> } />
        <Route path = '/welcome' element = { <AdminRestrictedRoute> <WelcomePage /> </AdminRestrictedRoute>  } />
        <Route path = '/products' element = { <AdminRestrictedRoute> <ProductsPage /> </AdminRestrictedRoute>  } />
        <Route path = '/search' element = { <AdminRestrictedRoute> <SearchResultsPage /> </AdminRestrictedRoute> } />
        <Route path = '/category/:category' element = { <AdminRestrictedRoute> <CategoryPage /> </AdminRestrictedRoute> } />
        <Route path = '/product/:productId' element = { <AdminRestrictedRoute> <ProductDetailPage /> </AdminRestrictedRoute> } />
        <Route path = '/about' element = { <AdminRestrictedRoute> <AboutPage /> </AdminRestrictedRoute> } />
        <Route path = '/contactus' element = { <AdminRestrictedRoute> <ContactUsPage /> </AdminRestrictedRoute> } />
        <Route path = '/order-guidelines' element = { <AdminRestrictedRoute> <OrderGuidelinesPage /> </AdminRestrictedRoute> } />
        <Route path = '/privacy-policy' element = { <AdminRestrictedRoute> <PrivacyPolicyPage /> </AdminRestrictedRoute> } />
        <Route path = '/replacement-policy' element = { <AdminRestrictedRoute> <ReplacementPolicyPage /> </AdminRestrictedRoute> } />
        <Route path = '/product-replacement-policy' element = { <AdminRestrictedRoute> <ReplacementPolicyPage /> </AdminRestrictedRoute> } />
        <Route path = '/terms-of-service' element = { <AdminRestrictedRoute> <TermsOfServicePage /> </AdminRestrictedRoute> } />

        {/* Admin-only routes */}
        <Route path = '/dashboard' element = { <AdminRoute> <DashboardPage /> </AdminRoute> } />
        <Route path = '/manage-products' element = { <AdminRoute> <ManageProductsPage /> </AdminRoute> } />
        <Route path = '/order-management' element = { <AdminRoute> <OrderManagementPage /> </AdminRoute> } />
        <Route path = '/coupons' element = { <AdminRoute> <CouponsPage /> </AdminRoute> } />
        <Route path = '/pos' element = { <AdminRoute> <POSPage /> </AdminRoute> } />
        <Route path = '/pos/history' element = { <AdminRoute> <POSHistoryPage /> </AdminRoute> } />
        <Route path = '/admin/replacement-requests' element = { <AdminRoute> <AdminReplacementRequestsPage /> </AdminRoute> } />
        <Route path = '/admin/replacement-requests/:requestId' element = { <AdminRoute> <ReplacementRequestDetailsPage /> </AdminRoute> } />
        <Route path = '/admin/chat-management' element = { <AdminRoute> <ChatManagementPage /> </AdminRoute> } />
        <Route path = '/admin/notifications' element = { <AdminRoute> <AdminNotificationCenterPage /> </AdminRoute> } />
        
        {/* Customer-only routes */}
        <Route path = '/profile' element = { <ProtectedRoute> <ProfilePage /> </ProtectedRoute> } />
        <Route path = '/account-settings' element = { <ProtectedRoute> <AccountSettingsPage /> </ProtectedRoute> } />
        <Route path = '/carts' element = { <AdminRestrictedRoute> <CartsPage /> </AdminRestrictedRoute> } />
        <Route path = '/information' element = { <CustomerRoute> <InformationPage /> </CustomerRoute> } />
        <Route path = '/shipping-options' element = { <CustomerRoute> <ShippingOptionsPage /> </CustomerRoute> } />
        <Route path = '/payment' element = { <CustomerRoute> <PaymentPage /> </CustomerRoute> } />
        <Route path = '/purchase-success' element = { <CustomerRoute> <PurchaseSuccessPage /> </CustomerRoute> } />
        <Route path = '/purchase-cancel' element = { <CustomerRoute> <PurchaseCancelPage /> </CustomerRoute> } />
        <Route path = '/track-orders' element = { <CustomerRoute> <TrackOrdersPage /> </CustomerRoute> } />
        <Route path = '/replacement-requests' element = { <CustomerRoute> <CustomerReplacementRequestsPage /> </CustomerRoute> } />
        <Route path = '/replacement-request/new' element = { <CustomerRoute> <ReplacementRequestPage /> </CustomerRoute> } />
        <Route path = '/notifications' element = { <CustomerRoute> <NotificationCenterPage /> </CustomerRoute> } />
        
        {/* Auth pages - only accessible to non-authenticated users */}
        <Route path = '/signup' element = { <GuestRoute> <SignUpPage /> </GuestRoute> } />
        <Route path = '/login' element = { <GuestRoute> <LoginPage /> </GuestRoute> } />
        <Route path = '/verify-email' element = { <GuestRoute> <EmailVerificationPage /> </GuestRoute> } />
        <Route path = '/forgot-password' element = { <GuestRoute> <ForgotPasswordPage /> </GuestRoute> } />
        <Route path='/reset-password/:token' element = { <GuestRoute> <ResetPasswordPage /> </GuestRoute> } />
        </Routes>
      </MainContent>

      <Toaster />
      
      {/* Chat Components */}
      <ChatFloatingButton />
      <ChatModal />
    </div>
  );
}

const AppWithProvider = () => {
  return (
    <SidebarProvider>
      <App />
    </SidebarProvider>
  );
};

export default AppWithProvider;
