import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';

import AuthProvider from '../providers/authProvider';
import HomePage from "../../features/home/pages/homePage";
import LoginPage from "../../features/auth/pages/loginPage";
import RegisterPage from "../../features/auth/pages/registerPage";
import VerifyEmailPage from "../../features/auth/pages/verifyEmailPage";
import ForgotPasswordPage from "../../features/auth/pages/forgotPasswordPage";
import ResetPasswordPage from "../../features/auth/pages/resetPasswordPage";
import ServicesPage from "../../features/services/pages/servicesPage";
import FeedPage from '../../features/posts/pages/feedPage';
import ContactPage from '../../features/home/pages/contactPage';
import ProtectedRoute from './ProtectedRoute';
import BookingPage from '../../features/appointments/pages/bookingPage';
import ClientDashboard from '../../features/dashboard/pages/clientDashboard';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>

                    <Route 
                        path="/" 
                        element={<HomePage />} 
                    />

                    <Route
                        path="/login"
                        element={<LoginPage />}
                    />

                    <Route
                        path="/register"
                        element={<RegisterPage />}
                    />

                    <Route
                        path="/verify-email"
                        element={<VerifyEmailPage />}
                    />

                    <Route
                        path="/forgot-password"
                        element={<ForgotPasswordPage />}
                    />

                    <Route
                        path="/reset-password"
                        element={<ResetPasswordPage />}
                    />

                    <Route 
                        path="/services" 
                        element={<ServicesPage/>} 
                    />

                    <Route 
                        path="/feed" 
                        element={<FeedPage/>} 
                    />

                    <Route
                        path="/contact"
                        element={<ContactPage />}
                    />

                    <Route
                        path="/booking"
                        element={
                            <ProtectedRoute>
                                <BookingPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <ClientDashboard />
                            </ProtectedRoute>
                        }
                    />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
