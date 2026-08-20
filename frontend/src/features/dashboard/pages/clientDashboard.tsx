import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/authProvider";
import { getImageUrl } from "../../../app/router/api";
import AdminAgenda from "../../appointments/components/adminAgenda";
import { confirmAppointment, getAllAppointments, getAvailability, getMyAppointments, rescheduleAppointment, updateAppointmentStatus } from "../../appointments/services/appointmentService";
import type { Appointment } from "../../appointments/types/appointmentTypes";
import MainLayout from "../../shared/layouts/mainLayout";
import ChatBox from "../../chat/components/chatBox";

type Section = "home" | "agenda" | "appointments" | "messages" | "profile";

const SECTIONS: { id: Section; label: string }[] = [
    { id: "home", label: "Inicio" },
    { id: "agenda", label: "Agenda" },
    { id: "appointments", label: "Mis citas" },
    { id: "messages", label: "Mensajes" },
    { id: "profile", label: "Mi Perfil" },
];

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmada",
    COMPLETED: "Finalizada",
    CANCELLED: "Cancelada",
    NO_SHOW: "No completada",
};

const AVAILABLE_TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];

function formatDate(value: string) {
    return new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function AppointmentRow({ appointment, isAdmin, onConfirm, onStatus, onReschedule }: { appointment: Appointment; isAdmin: boolean; onConfirm: (id: string) => void; onStatus: (id: string, status: "CONFIRMED" | "COMPLETED" | "NO_SHOW") => void; onReschedule: (appointment: Appointment) => void }) {
    const status = appointment.status.toUpperCase();
    const statusColor = status === "COMPLETED" ? "#4ADE80" : status === "CONFIRMED" ? "#FACC15" : status === "PENDING" ? "#60A5FA" : "#F87171";
    return (
        <article className="flex flex-col gap-4 rounded-2xl border border-white/[.06] bg-[#1C1C1C] p-4 sm:flex-row sm:items-center">
            <img src={getImageUrl(appointment.serviceImage)} alt={appointment.serviceName} className="h-24 w-full rounded-xl object-cover sm:h-20 sm:w-24" />
            <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold">{appointment.serviceName}</h3>
                {isAdmin && <p className="mt-1 text-xs font-medium text-[#C9A96E]">Cliente: {appointment.userName || appointment.userId}</p>}
                <p className="mt-1 text-sm text-zinc-400">{formatDate(appointment.appointmentDate)} · {appointment.startTime}</p>
                <p className="mt-1 text-xs text-zinc-500">Duración: {appointment.serviceDuration}{appointment.notes ? ` · ${appointment.notes}` : ""}</p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <span className="font-mono-data font-semibold text-[#C9A96E]">${appointment.servicePrice}</span>
                <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ color: statusColor, backgroundColor: `${statusColor}18` }}>{STATUS_LABELS[status] ?? appointment.status}</span>
                {!isAdmin && appointment.canConfirm && <button onClick={() => onConfirm(appointment.id)} className="rounded-lg bg-[#C9A96E] px-3 py-2 text-xs font-semibold text-black">Confirmar asistencia</button>}
                {!isAdmin && status === "PENDING" && !appointment.isPast && <button onClick={() => onReschedule(appointment)} className="rounded-lg border border-[#C9A96E]/30 px-3 py-2 text-xs font-medium text-[#C9A96E]">Reagendar</button>}
                {isAdmin && status !== "COMPLETED" && status !== "CANCELLED" && <div className="flex flex-wrap justify-end gap-2">{status !== "CONFIRMED" && !appointment.isPast && <button onClick={() => onStatus(appointment.id, "CONFIRMED")} className="rounded-lg border border-yellow-400/20 px-3 py-2 text-xs font-medium text-yellow-300">Confirmar</button>}{appointment.canComplete && <button onClick={() => onStatus(appointment.id, "COMPLETED")} className="rounded-lg border border-green-400/20 px-3 py-2 text-xs font-medium text-green-400">Completada</button>}{status !== "NO_SHOW" || appointment.needsReview ? <button onClick={() => onStatus(appointment.id, "NO_SHOW")} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-medium text-red-400">No completada</button> : null}</div>}
            </div>
        </article>
    );
}

export default function ClientDashboard() {
    const { user, updateProfile, deleteProfile } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isAdmin = user?.role?.trim().toUpperCase() === "ADMIN";
    const visibleSections = SECTIONS.filter((section) => isAdmin || section.id !== "agenda");
    const requestedSection = searchParams.get("section") as Section | null;
    const activeSection = visibleSections.some((item) => item.id === requestedSection) ? requestedSection! : "home";
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profileModal, setProfileModal] = useState<"edit" | "confirm-edit" | "delete" | null>(null);
    const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [adminView, setAdminView] = useState<"upcoming" | "past">("upcoming");
    const [agendaRefreshKey, setAgendaRefreshKey] = useState(0);
    const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [bookedTimes, setBookedTimes] = useState<string[]>([]);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);

    useEffect(() => {
        (isAdmin ? getAllAppointments() : getMyAppointments()).then(setAppointments)
            .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar tus citas"))
            .finally(() => setLoading(false));
    }, [isAdmin]);

    const totals = useMemo(() => ({
        all: appointments.length,
        completed: appointments.filter((item) => item.status.toUpperCase() === "COMPLETED").length,
        pending: appointments.filter((item) => ["PENDING", "CONFIRMED"].includes(item.status.toUpperCase())).length,
    }), [appointments]);

    const initials = (user?.name ?? "Usuario").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const changeSection = (section: Section) => setSearchParams(section === "home" ? {} : { section });
    const displayedAppointments = isAdmin ? appointments.filter((item) => adminView === "past" ? item.isPast && !item.needsReview : !item.isPast || item.needsReview) : appointments;

    const replaceAppointment = (updated: Appointment) => setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
    const handleConfirmAppointment = async (id: string) => {
        try { replaceAppointment(await confirmAppointment(id)); }
        catch (err) { setError(err instanceof Error ? err.message : "No se pudo confirmar la cita"); }
    };
    const handleAppointmentStatus = async (id: string, status: "CONFIRMED" | "COMPLETED" | "NO_SHOW") => {
        try { replaceAppointment(await updateAppointmentStatus(id, status)); }
        catch (err) { setError(err instanceof Error ? err.message : "No se pudo actualizar la cita"); }
    };
    const openReschedule = (appointment: Appointment) => {
        setRescheduling(appointment);
        setRescheduleDate(appointment.appointmentDate);
        setRescheduleTime("");
        setBookedTimes([]);
        setRescheduleLoading(true);
        setError(null);
    };

    const changeRescheduleDate = (date: string) => {
        setRescheduleLoading(true);
        setRescheduleTime("");
        setRescheduleDate(date);
    };

    useEffect(() => {
        if (!rescheduling || !rescheduleDate) return;
        getAvailability(rescheduleDate, rescheduling.serviceId, rescheduling.id)
            .then((response) => setBookedTimes(response.bookedTimes))
            .catch((err) => setError(err instanceof Error ? err.message : "No se pudo consultar la disponibilidad"))
            .finally(() => setRescheduleLoading(false));
    }, [rescheduleDate, rescheduling]);

    const saveReschedule = async () => {
        if (!rescheduling || !rescheduleDate || !rescheduleTime) return;
        setRescheduleLoading(true);
        try {
            replaceAppointment(await rescheduleAppointment(rescheduling.id, rescheduleDate, rescheduleTime));
            setAgendaRefreshKey((current) => current + 1);
            setRescheduling(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo reagendar la cita");
        } finally { setRescheduleLoading(false); }
    };

    const todayValue = new Date().toLocaleDateString("en-CA");
    const isPastTime = (time: string) => rescheduleDate === todayValue && time <= new Date().toTimeString().slice(0, 5);

    const openEditProfile = () => {
        setProfileForm({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
        setProfileError(null);
        setProfileModal("edit");
    };

    const saveProfile = async () => {
        setProfileSaving(true);
        setProfileError(null);
        try {
            await updateProfile(profileForm);
            setProfileModal(null);
        } catch (err) {
            setProfileError(err instanceof Error ? err.message : "No se pudo actualizar el perfil");
            setProfileModal("edit");
        } finally {
            setProfileSaving(false);
        }
    };

    const removeAccount = async () => {
        setProfileSaving(true);
        setProfileError(null);
        try {
            await deleteProfile();
            navigate("/");
        } catch (err) {
            setProfileError(err instanceof Error ? err.message : "No se pudo eliminar la cuenta");
            setProfileModal(null);
        } finally {
            setProfileSaving(false);
        }
    };

    return (
        <MainLayout>
            <section className="flex-1 bg-[#111111] px-6 pb-20 pt-24">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-8 flex w-fit max-w-full gap-2 overflow-x-auto rounded-2xl border border-white/[.06] bg-[#0D0D0D] p-2">
                        {visibleSections.map((section) => <button key={section.id} onClick={() => changeSection(section.id)} className="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm" style={{ color: activeSection === section.id ? "#111111" : "#A1A1AA", backgroundColor: activeSection === section.id ? "#C9A96E" : "transparent" }}>{section.id === "appointments" && isAdmin ? "Citas" : section.label}</button>)}
                    </div>

                    {activeSection === "home" && <div className="animate-fadeIn">
                        <h1 className="font-display text-3xl font-bold">¡Hola, {user?.name ?? "Usuario"}!</h1>
                        <p className="mt-2 text-sm text-zinc-400">Este es el resumen de tus citas.</p>
                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            {[
                                { label: "Total de citas", value: totals.all, icon: CalendarDays },
                                { label: "Completadas", value: totals.completed, icon: CheckCircle2 },
                                { label: "Pendientes", value: totals.pending, icon: Clock3 },
                            ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-white/[.06] bg-[#1C1C1C] p-5"><Icon size={22} className="mb-4 text-[#C9A96E]" /><strong className="font-mono-data text-3xl">{value}</strong><p className="mt-1 text-sm text-zinc-400">{label}</p></div>)}
                        </div>
                        <div className="mt-10 flex items-center justify-between"><h2 className="font-display text-2xl font-semibold">Tus citas</h2><button onClick={() => navigate("/booking")} className="flex items-center gap-2 rounded-xl bg-[#C9A96E] px-4 py-2.5 text-sm font-semibold text-black"><Plus size={16} /> Nueva cita</button></div>
                        <div className="mt-5 space-y-3">{loading ? <p className="text-zinc-400">Cargando citas...</p> : error ? <p className="text-red-300">{error}</p> : appointments.length ? appointments.slice(0, 5).map((item) => <AppointmentRow key={item.id} appointment={item} isAdmin={isAdmin} onConfirm={handleConfirmAppointment} onStatus={handleAppointmentStatus} onReschedule={openReschedule} />) : <p className="rounded-2xl bg-[#1C1C1C] p-6 text-zinc-400">Todavía no tienes citas registradas.</p>}</div>
                    </div>}

                    {activeSection === "agenda" && isAdmin && <AdminAgenda onReschedule={openReschedule} onAppointmentUpdated={replaceAppointment} refreshKey={agendaRefreshKey} />}

                    {activeSection === "appointments" && <div className="animate-fadeIn"><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-display text-3xl font-bold">{isAdmin ? "Citas de clientes" : "Mis citas"}</h1>{isAdmin ? <div className="flex rounded-xl bg-[#1C1C1C] p-1"><button onClick={() => setAdminView("upcoming")} className={`rounded-lg px-4 py-2 text-sm ${adminView === "upcoming" ? "bg-[#C9A96E] text-black" : "text-zinc-400"}`}>Próximas</button><button onClick={() => setAdminView("past")} className={`rounded-lg px-4 py-2 text-sm ${adminView === "past" ? "bg-[#C9A96E] text-black" : "text-zinc-400"}`}>Pasadas</button></div> : <button onClick={() => navigate("/booking")} className="rounded-xl bg-[#C9A96E] px-4 py-2.5 text-sm font-semibold text-black">+ Nueva cita</button>}</div>{error && <p className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}<div className="mt-7 space-y-3">{loading ? <p className="text-zinc-400">Cargando citas...</p> : displayedAppointments.length ? displayedAppointments.map((item) => <AppointmentRow key={item.id} appointment={item} isAdmin={isAdmin} onConfirm={handleConfirmAppointment} onStatus={handleAppointmentStatus} onReschedule={openReschedule} />) : <p className="text-zinc-400">No hay citas en esta sección.</p>}</div></div>}

                    {activeSection === "messages" && <div className="animate-fadeIn"><h1 className="font-display text-3xl font-bold">Mensajes</h1><p className="mt-2 text-sm text-zinc-400">{isAdmin ? "Responde las conversaciones de tus clientes." : "Conversa directamente con la barbería."}</p><div className="mt-7">{user && <ChatBox user={user} />}</div></div>}

                    {activeSection === "profile" && <div className="animate-fadeIn max-w-2xl"><h1 className="font-display text-3xl font-bold">Mi perfil</h1>{profileError && <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{profileError}</p>}<div className="mt-7 rounded-2xl border border-white/[.06] bg-[#1C1C1C] p-6"><div className="mb-7 flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A96E] text-xl font-bold text-black">{initials || <UserRound />}</div><div><h2 className="font-display text-xl font-semibold">{user?.name}</h2><p className="text-sm text-zinc-400">{user?.role === "ADMIN" ? "Administrador" : "Cliente"}</p></div></div><dl className="grid gap-5 sm:grid-cols-2">{[["Nombre completo", user?.name], ["Correo electrónico", user?.email], ["Teléfono", user?.phone], ["Estado", "Activo"]].map(([label, value]) => <div key={label}><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-1 rounded-xl bg-[#111111] px-4 py-3 text-sm">{value || "No registrado"}</dd></div>)}</dl><div className="mt-7 flex flex-wrap gap-3"><button onClick={openEditProfile} className="inline-flex items-center gap-2 rounded-xl bg-[#C9A96E] px-5 py-3 text-sm font-semibold text-black"><Pencil size={16} /> Editar datos</button><button onClick={() => { setProfileError(null); setProfileModal("delete"); }} className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 px-5 py-3 text-sm font-medium text-red-400"><Trash2 size={16} /> Eliminar cuenta</button></div></div></div>}
                </div>

                {rescheduling && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"><div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#171717] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div><p className="text-xs uppercase tracking-[.18em] text-[#C9A96E]">Reagendar cita</p><h2 className="mt-1 font-display text-2xl font-semibold">{rescheduling.serviceName}</h2></div><button onClick={() => setRescheduling(null)} className="rounded-full bg-white/5 p-2 text-zinc-400"><X size={18} /></button></div><div className="space-y-5 px-6 py-5"><label className="block text-xs text-zinc-400">Nueva fecha<input type="date" min={todayValue} value={rescheduleDate} onChange={(event) => changeRescheduleDate(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-white outline-none" /></label>{error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}<div><p className="mb-3 text-xs text-zinc-400">Horario disponible</p>{rescheduleLoading ? <p className="text-sm text-zinc-500">Consultando horarios...</p> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{AVAILABLE_TIMES.map((time) => { const unavailable = bookedTimes.includes(time) || isPastTime(time); return <button key={time} disabled={unavailable} onClick={() => setRescheduleTime(time)} className="rounded-lg border px-2 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-35" style={{ borderColor: rescheduleTime === time ? "#C9A96E" : "rgba(255,255,255,.1)", backgroundColor: rescheduleTime === time ? "#C9A96E" : "#0D0D0D", color: rescheduleTime === time ? "#111" : "#F8F5F0" }}>{unavailable ? "🔒 " : ""}{time}</button>; })}</div>}</div><p className="text-xs text-zinc-500">El horario anterior queda disponible durante esta consulta. El nuevo horario respeta las demás citas registradas.</p></div><div className="flex gap-3 border-t border-white/10 px-6 py-4"><button onClick={() => setRescheduling(null)} className="rounded-xl border border-white/10 px-4 py-3 text-sm">Cancelar</button><button disabled={!rescheduleTime || rescheduleLoading} onClick={saveReschedule} className="flex-1 rounded-xl bg-[#C9A96E] px-4 py-3 text-sm font-semibold text-black disabled:opacity-40">Guardar nuevo horario</button></div></div></div>}

                {profileModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"><div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#171717] shadow-2xl">
                    {profileModal === "edit" ? <form onSubmit={(event) => { event.preventDefault(); setProfileModal("confirm-edit"); }}><div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div><p className="text-xs uppercase tracking-[.18em] text-[#C9A96E]">Perfil</p><h2 className="mt-1 font-display text-2xl font-semibold">Editar datos</h2></div><button type="button" onClick={() => setProfileModal(null)} className="rounded-full bg-white/5 p-2 text-zinc-400"><X size={18} /></button></div><div className="space-y-4 px-6 py-5">{profileError && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{profileError}</p>}<label className="block text-xs text-zinc-400">Nombre completo<input required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-sm text-white outline-none focus:border-[#C9A96E]" /></label><label className="block text-xs text-zinc-400">Correo electrónico<input required type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-sm text-white outline-none focus:border-[#C9A96E]" /></label><label className="block text-xs text-zinc-400">Teléfono<input required value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0D0D0D] px-4 py-3 text-sm text-white outline-none focus:border-[#C9A96E]" /></label></div><div className="flex gap-3 border-t border-white/10 px-6 py-4"><button type="button" onClick={() => setProfileModal(null)} className="rounded-xl border border-white/10 px-4 py-3 text-sm">Cancelar</button><button className="flex-1 rounded-xl bg-[#C9A96E] px-4 py-3 text-sm font-semibold text-black">Revisar cambios</button></div></form>
                    : <div><div className="px-6 pb-3 pt-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: profileModal === "delete" ? "rgba(248,113,113,.12)" : "rgba(201,169,110,.14)", color: profileModal === "delete" ? "#F87171" : "#C9A96E" }}><AlertTriangle size={26} /></div><h2 className="mt-5 font-display text-2xl font-semibold">{profileModal === "delete" ? "¿Eliminar tu cuenta?" : "¿Guardar estos cambios?"}</h2><p className="mt-3 text-sm leading-6 text-zinc-400">{profileModal === "delete" ? "Esta acción cerrará tu sesión y no podrás volver a acceder con esta cuenta. No se puede deshacer." : "Confirma que deseas actualizar tu nombre, correo electrónico y teléfono."}</p></div><div className="flex gap-3 px-6 py-5"><button disabled={profileSaving} onClick={() => setProfileModal(profileModal === "delete" ? null : "edit")} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm">No, regresar</button><button disabled={profileSaving} onClick={profileModal === "delete" ? removeAccount : saveProfile} className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: profileModal === "delete" ? "#EF4444" : "#C9A96E", color: profileModal === "delete" ? "white" : "black" }}>{profileSaving ? "Procesando..." : "Sí, confirmar"}</button></div></div>}
                </div></div>}
            </section>
        </MainLayout>
    );
}
