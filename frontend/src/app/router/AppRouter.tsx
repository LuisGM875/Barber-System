import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';

import HomePage from "../../features/home/pages/homePage";
import LoginPage from "../../features/auth/pages/loginPage";
import RegisterPage from "../../features/auth/pages/registerPage";

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

            </Routes>
        </BrowserRouter>
    );
}