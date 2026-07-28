import MainLayout from "../../shared/layouts/mainLayout";


export default function HomePage(){

    return (

        <MainLayout>

            <section className="min-h-[80vh] flex items-center justify-center">

                <div className="text-center">

                    <h1 className="text-6xl font-bold">
                        Tu próximo corte
                        <span className="text-yellow-500">
                            {" "}está aquí
                        </span>
                    </h1>


                    <p className="mt-5 text-gray-600 text-lg">
                        Agenda tu cita en la mejor barbería
                        de tu ciudad.
                    </p>


                    <button className="
                        mt-8
                        bg-black
                        text-white
                        px-8
                        py-3
                        rounded-xl
                        hover:bg-zinc-800
                    ">
                        Iniciar sesión
                    </button>

                </div>

            </section>

        </MainLayout>

    )
}