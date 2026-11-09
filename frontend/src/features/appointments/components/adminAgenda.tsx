import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Mail, Phone, UserRound } from "lucide-react";
import { getImageUrl } from "../../../app/router/api";
import { createAppointment, getAdminAgenda, updateAppointmentStatus } from "../services/appointmentService";
import type { Appointment } from "../types/appointmentTypes";
import { getServices } from "../../services/services/serviceService";
import type { Service } from "../../services/types/serviceTypes";

type AppointmentStatus = "CONFIRMED" | "COMPLETED" | "NO_SHOW";

type AdminAgendaProps = {
	onReschedule: (appointment: Appointment) => void;
	onAppointmentUpdated: (appointment: Appointment) => void;
	refreshKey?: number;
};

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });
const DAY_FORMATTER = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" });

const STATUS_LABELS: Record<string, string> = {
	PENDING: "Pendiente",
	CONFIRMED: "Confirmada",
	COMPLETED: "Completada",
	NO_SHOW: "No asistió",
	CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
	PENDING: "#60A5FA",
	CONFIRMED: "#FACC15",
	COMPLETED: "#4ADE80",
	NO_SHOW: "#F87171",
	CANCELLED: "#A1A1AA",
};
function appointmentClientName(appointment: Appointment) {
	return appointment.isManual ? appointment.serviceName : appointment.userName || "Cliente";
}

function appointmentServices(appointment: Appointment) {
	return appointment.items?.length
		? appointment.items.map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(" + ")
		: appointment.serviceName;
}
const AVAILABLE_TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];

function dateValue(year: number, month: number, day: number) {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function localToday() {
	const today = new Date();
	return dateValue(today.getFullYear(), today.getMonth(), today.getDate());
}

function parseDate(value: string) {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year, month - 1, day, 12);
}

export default function AdminAgenda({ onReschedule, onAppointmentUpdated, refreshKey = 0 }: AdminAgendaProps) {
	const now = new Date();
	const [visibleMonth, setVisibleMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
	const [selectedDate, setSelectedDate] = useState(localToday);
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const [manualOpen, setManualOpen] = useState(false);
	const [manualName, setManualName] = useState("");
	const [manualDate, setManualDate] = useState(localToday);
	const [manualTime, setManualTime] = useState("");
	const [manualServices, setManualServices] = useState<Service[]>([]);
	const [manualQuantities, setManualQuantities] = useState<Record<string, number>>({});
	const [manualSaving, setManualSaving] = useState(false);

	const year = visibleMonth.getFullYear();
	const month = visibleMonth.getMonth();
	const monthStart = dateValue(year, month, 1);
	const monthEnd = dateValue(year, month, new Date(year, month + 1, 0).getDate());

	useEffect(() => {
		let active = true;
		getAdminAgenda(monthStart, monthEnd)
			.then((items) => { if (active) setAppointments(items); })
			.catch((err) => { if (active) setError(err instanceof Error ? err.message : "No se pudo cargar la agenda"); })
			.finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, [monthStart, monthEnd, refreshKey]);

	const appointmentsByDate = useMemo(() => {
		const grouped = new Map<string, Appointment[]>();
		for (const appointment of appointments) {
			const items = grouped.get(appointment.appointmentDate) ?? [];
			items.push(appointment);
			grouped.set(appointment.appointmentDate, items);
		}
		return grouped;
	}, [appointments]);

	const calendarDays = useMemo(() => {
		const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		return [
			...Array.from({ length: firstWeekday }, () => null),
			...Array.from({ length: daysInMonth }, (_, index) => index + 1),
		];
	}, [year, month]);

	const selectedAppointments = appointmentsByDate.get(selectedDate) ?? [];
	const selectedManualItems = manualServices
		.filter((service) => (manualQuantities[service.id] ?? 0) > 0)
		.map((service) => ({ service, quantity: manualQuantities[service.id] ?? 0 }));
	const moveMonth = (offset: number) => {
		const nextMonth = new Date(year, month + offset, 1);
		const nextStart = dateValue(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
		const nextEnd = dateValue(nextMonth.getFullYear(), nextMonth.getMonth(), new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate());
		const today = localToday();
		setLoading(true);
		setError(null);
		setVisibleMonth(nextMonth);
		setSelectedDate(today >= nextStart && today <= nextEnd ? today : nextStart);
	};
	const goToday = () => {
		const today = new Date();
		setLoading(true);
		setError(null);
		setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
		setSelectedDate(localToday());
	};

	const updateStatus = async (id: string, status: AppointmentStatus) => {
		setUpdatingId(id);
		setError(null);
		try {
			const updated = await updateAppointmentStatus(id, status);
			setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
			onAppointmentUpdated(updated);
		} catch (err) {
			setError(err instanceof Error ? err.message : "No se pudo actualizar la cita");
		} finally {
			setUpdatingId(null);
		}
	};

	const openManualForm = async () => {
		setError(null);
		try {
			const services = (await getServices()).filter((service) => service.isActive);
			setManualServices(services);
			setManualQuantities({});
			setManualDate(selectedDate);
			setManualTime("");
			setManualName("");
			setManualOpen(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "No se pudieron cargar los servicios");
		}
	};

	const saveManualAppointment = async () => {
		const first = selectedManualItems[0];
		if (!manualName.trim() || !manualDate || !manualTime || !first) {
			setError("Agrega el nombre del cliente, servicios, fecha y horario.");
			return;
		}
		setManualSaving(true);
		setError(null);
		try {
			const appointment = await createAppointment({
				serviceId: first.service.id,
				serviceName: first.service.name,
				servicePrice: first.service.price,
				serviceDuration: first.service.duration,
				serviceImage: first.service.image,
				appointmentDate: manualDate,
				startTime: manualTime,
				notes: "",
				clientName: manualName.trim(),
				items: selectedManualItems.map(({ service, quantity }) => ({ serviceId: service.id, quantity })),
			});
			setAppointments((current) => [...current, appointment]);
			setSelectedDate(manualDate);
			setManualOpen(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "No se pudo crear la cita");
		} finally {
			setManualSaving(false);
		}
	};

	return (
		<div className="animate-fadeIn">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div><p className="text-xs uppercase tracking-[.2em] text-[#C9A96E]">Administración</p><h1 className="mt-2 font-display text-3xl font-bold">Agenda de citas</h1><p className="mt-2 text-sm text-zinc-400">Selecciona un día para ver clientes, servicios y horarios.</p></div>
				<div className="flex gap-2"><button onClick={openManualForm} className="rounded-xl bg-[#C9A96E] px-4 py-2.5 text-sm font-semibold text-black">Nueva cita</button><button onClick={goToday} className="rounded-xl border border-[#C9A96E]/30 px-4 py-2.5 text-sm text-[#C9A96E]">Ir a hoy</button></div>
			</div>

			{error && <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

			{manualOpen && <div className="mt-6 rounded-3xl border border-[#C9A96E]/20 bg-[#1C1C1C] p-5 sm:p-6">
				<div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-[#C9A96E]">Captura manual</p><h2 className="mt-1 font-display text-2xl font-semibold">Nueva cita para cliente</h2></div><button onClick={() => setManualOpen(false)} className="text-sm text-zinc-400">Cerrar</button></div>
				<div className="mt-5 grid gap-4 md:grid-cols-3">
					<label className="text-sm text-zinc-300">Nombre del cliente<input value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="Ej. María López" className="mt-2 w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2.5 text-sm outline-none focus:border-[#C9A96E]" /></label>
					<label className="text-sm text-zinc-300">Fecha<input type="date" value={manualDate} onChange={(event) => { setManualDate(event.target.value); setManualTime(""); }} className="mt-2 w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2.5 text-sm outline-none focus:border-[#C9A96E]" /></label>
					<div><p className="text-sm text-zinc-300">Servicios</p><div className="mt-2 space-y-2">{manualServices.map((service) => { const quantity = manualQuantities[service.id] ?? 0; return <div key={service.id} className="flex items-center justify-between rounded-xl bg-[#111] px-3 py-2"><span className="text-sm">{service.name} <span className="text-xs text-zinc-500">({service.duration})</span></span><span className="flex items-center gap-2"><button type="button" onClick={() => setManualQuantities((current) => ({ ...current, [service.id]: Math.max(0, quantity - 1) }))} className="h-7 w-7 rounded-full border border-white/10">−</button><span className="w-4 text-center text-[#C9A96E]">{quantity}</span><button type="button" onClick={() => setManualQuantities((current) => ({ ...current, [service.id]: quantity + 1 }))} className="h-7 w-7 rounded-full bg-[#C9A96E] text-black">+</button></span></div>; })}</div></div>
				</div>
				<div className="mt-4"><p className="text-sm text-zinc-300">Horario</p><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">{AVAILABLE_TIMES.map((time) => <button key={time} type="button" onClick={() => setManualTime(time)} className="rounded-lg border px-2 py-2 text-sm" style={{ borderColor: manualTime === time ? "#C9A96E" : "rgba(255,255,255,.1)", backgroundColor: manualTime === time ? "#C9A96E" : "#111", color: manualTime === time ? "#111" : "#F8F5F0" }}>{time}</button>)}</div></div>
				<div className="mt-5 flex justify-end gap-3"><button onClick={() => setManualOpen(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm">Cancelar</button><button disabled={manualSaving} onClick={saveManualAppointment} className="rounded-xl bg-[#C9A96E] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50">{manualSaving ? "Guardando..." : "Guardar cita"}</button></div>
			</div>}

			<div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
				<section className="rounded-3xl border border-white/[.06] bg-[#1C1C1C] p-4 sm:p-6">
					<header className="mb-5 flex items-center justify-between"><button onClick={() => moveMonth(-1)} aria-label="Mes anterior" className="rounded-xl border border-white/10 p-2 text-zinc-300"><ChevronLeft size={20} /></button><h2 className="font-display text-xl font-semibold capitalize">{MONTH_FORMATTER.format(visibleMonth)}</h2><button onClick={() => moveMonth(1)} aria-label="Mes siguiente" className="rounded-xl border border-white/10 p-2 text-zinc-300"><ChevronRight size={20} /></button></header>
					<div className="grid grid-cols-7 gap-1 sm:gap-2">{WEEK_DAYS.map((day) => <div key={day} className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-xs">{day}</div>)}{calendarDays.map((day, index) => {
						if (!day) return <div key={`empty-${index}`} />;
						const value = dateValue(year, month, day);
						const dayAppointments = appointmentsByDate.get(value) ?? [];
						const selected = value === selectedDate;
						const today = value === localToday();
						return <button key={value} onClick={() => setSelectedDate(value)} className="relative min-h-16 rounded-xl border p-1.5 text-left transition sm:min-h-24 sm:p-2" style={{ borderColor: selected ? "#C9A96E" : "rgba(255,255,255,.06)", backgroundColor: selected ? "rgba(201,169,110,.12)" : "#151515" }}><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${today ? "bg-[#C9A96E] font-bold text-black" : "text-zinc-300"}`}>{day}</span>{dayAppointments.length > 0 && <div className="mt-1 space-y-1"><span className="block text-[10px] font-semibold text-[#C9A96E] sm:hidden">{dayAppointments.length} cita{dayAppointments.length === 1 ? "" : "s"}</span>{dayAppointments.slice(0, 2).map((appointment) => <span key={appointment.id} className="hidden truncate rounded bg-black/25 px-1.5 py-1 text-[10px] text-zinc-300 sm:block"><span className="text-[#C9A96E]">{appointment.startTime}</span> 												{appointmentClientName(appointment)}</span>)}{dayAppointments.length > 2 && <span className="hidden text-[10px] text-zinc-500 sm:block">+{dayAppointments.length - 2} más</span>}</div>}</button>;
					})}</div>
				</section>

				<aside className="rounded-3xl border border-white/[.06] bg-[#1C1C1C] p-5 sm:p-6">
					<div className="flex items-center gap-3"><div className="rounded-xl bg-[#C9A96E]/10 p-2 text-[#C9A96E]"><CalendarDays size={20} /></div><div><p className="font-display text-lg font-semibold capitalize">{DAY_FORMATTER.format(parseDate(selectedDate))}</p><p className="text-xs text-zinc-500">{selectedAppointments.length} cita{selectedAppointments.length === 1 ? "" : "s"}</p></div></div>
					<div className="mt-5 max-h-[590px] space-y-3 overflow-y-auto pr-1">{loading ? <p className="rounded-2xl bg-[#111] p-5 text-sm text-zinc-400">Cargando agenda...</p> : selectedAppointments.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center"><CalendarDays className="mx-auto text-zinc-600" /><p className="mt-3 text-sm text-zinc-400">No hay citas para este día.</p></div> : selectedAppointments.map((appointment) => {
						const status = appointment.status.toUpperCase();
						const clientName = appointmentClientName(appointment);
						const servicesLabel = appointmentServices(appointment);
						const color = STATUS_COLORS[status] ?? "#A1A1AA";
						return <article key={appointment.id} className="rounded-2xl border border-white/[.06] bg-[#111] p-4"><div className="flex items-start gap-3"><img src={getImageUrl(appointment.serviceImage)} alt={appointment.serviceName} className="h-14 w-14 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="font-mono-data text-lg font-semibold text-[#C9A96E]">{appointment.startTime}</p><span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ color, backgroundColor: `${color}18` }}>{STATUS_LABELS[status] ?? status}</span></div>						<p className="mt-1 text-sm font-semibold">{servicesLabel}</p><p className="mt-1 flex items-center gap-1 text-xs text-white-500"><Clock3 size={12} /> {appointment.serviceDuration} · ${appointment.servicePrice}</p></div></div><div className="mt-4 rounded-xl bg-[#181818] p-3"><p className="flex items-center gap-2 text-sm font-medium"><UserRound size={14} className="text-[#C9A96E]" 						/> {clientName}</p>{appointment.items && appointment.items.length > 0 && <div className="mt-2 border-t border-white/[.06] pt-2 text-xs text-zinc-400">{appointment.items.map((item) => <p key={item.serviceId}>{item.name} x{item.quantity} · ${(item.price * item.quantity).toFixed(2)}</p>)}</div>}{appointment.userPhone && <p className="mt-2 flex items-center gap-2 text-xs text-white-400"><Phone size={13} /> {appointment.userPhone}</p>}{appointment.userEmail && <p className="mt-2 flex items-center gap-2 break-all text-xs text-white-400"><Mail size={13} /> {appointment.userEmail}</p>}{appointment.notes && <p className="mt-3 border-t border-white/[.06] pt-3 text-xs leading-5 text-zinc-400">Nota: {appointment.notes}</p>}</div><div className="mt-3 flex flex-wrap gap-2"><button disabled={updatingId === appointment.id} onClick={() => onReschedule(appointment)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 disabled:opacity-40">Reagendar</button>{status === "PENDING" && !appointment.isPast && <button disabled={updatingId === appointment.id} onClick={() => updateStatus(appointment.id, "CONFIRMED")} className="rounded-lg border border-yellow-400/20 px-3 py-2 text-xs text-yellow-300 disabled:opacity-40">Confirmar</button>}{appointment.canComplete && <button disabled={updatingId === appointment.id} onClick={() => updateStatus(appointment.id, "COMPLETED")} className="rounded-lg border border-green-400/20 px-3 py-2 text-xs text-green-400 disabled:opacity-40">Completar</button>}{status !== "COMPLETED" && (appointment.isPast || appointment.needsReview) && <button disabled={updatingId === appointment.id} onClick={() => updateStatus(appointment.id, "NO_SHOW")} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-400 disabled:opacity-40">No asistió</button>}</div></article>;
					})}</div>
				</aside>
			</div>
		</div>
	);
}
