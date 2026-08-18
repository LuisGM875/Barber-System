import Navbar from "../components/navBar";
import Footer from "../components/footer";

interface Props {
    children: React.ReactNode;
}


export default function MainLayout({ children }: Props) {
    
    return (
        <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#111111" }}>
            <Navbar />
            <main className="flex flex-1 flex-col">
                {children}
            </main>
            <Footer/>
        </div>
    );
}
