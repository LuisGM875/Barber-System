import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';

import HomePage from "../../features/home/pages/homePage";
import LoginPage from "../../features/auth/pages/loginPage";
import RegisterPage from "../../features/auth/pages/registerPage";
import ServicesPage from "../../features/services/pages/servicesPage";
import FeedPage from '../../features/posts/pages/feedPage';
import ContactPage from '../../features/home/pages/contactPage';

export default function AppRouter() {
    return (
        <BrowserRouter>
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

            </Routes>
        </BrowserRouter>
    );
}