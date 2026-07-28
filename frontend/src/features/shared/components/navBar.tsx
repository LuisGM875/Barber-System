export default function Navbar() {
    return (
        <nav className="w-full border-b bg-black text-white">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                <h1 className="text-2xl font-bold">
                    Barber<span className="text-yellow-500">
                        Flow
                    </span>
                </h1>
                <div className="flex gap-6">
                    <a href="#">
                        Inicio
                    </a>
                    <a href="#">
                        Iniciar sesión
                    </a>
                </div>
            </div>
        </nav>
    );
}