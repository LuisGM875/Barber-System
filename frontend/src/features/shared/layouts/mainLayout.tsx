import Navbar from "../components/navBar";

interface Props {
    children: React.ReactNode;
}


export default function MainLayout({children}: Props){

    return (
        <div className="min-h-screen bg-zinc-50">

            <Navbar />

            <main>
                {children}
            </main>

        </div>
    );
}