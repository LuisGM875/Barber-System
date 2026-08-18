import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';

import AuthProvider from '../providers/authProvider';
import HomePage from "../../features/home/pages/homePage";
import LoginPage from "../../features/auth/pages/loginPage";
import RegisterPage from "../../features/auth/pages/registerPage";
import ServicesPage from "../../features/services/pages/servicesPage";
import FeedPage from '../../features/posts/pages/feedPage';
import ContactPage from '../../features/home/pages/contactPage';
import ProtectedRoute from './ProtectedRoute';
import BookingPage from '../../features/appointments/pages/bookingPage';
import MyAppointmentsPage from '../../features/appointments/pages/myAppointmentsPage';
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

                    <Route
                        path="/my-appointments"
                        element={
                            <ProtectedRoute>
                                <MyAppointmentsPage />
                            </ProtectedRoute>
                        }
                    />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
