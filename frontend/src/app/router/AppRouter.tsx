import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';

import HomePage from "../../features/home/pages/homePage";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>

                <Route 
                    path="/" 
                    element={<HomePage />} 
                />

            </Routes>
        </BrowserRouter>
    );
}