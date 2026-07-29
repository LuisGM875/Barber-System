import MainLayout from "../../shared/layouts/mainLayout";
import HeroSection from "../../shared/components/heroSection";


export default function HomePage(){

    return (
        <MainLayout>
            <section>
                <HeroSection onNavigate={(value) => console.log(value)}/>
            </section>
        </MainLayout>
    )
}