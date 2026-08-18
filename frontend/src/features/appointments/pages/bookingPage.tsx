import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../shared/layouts/mainLayout";
import {
	createAppointment,
	getMyAppointments,
	getAvailability,
} from "../services/appointmentService";
import type { Appointment, AppointmentPayload } from "../types/appointmentTypes";
import { getServices } from "../../services/services/serviceService";
import type { Service } from "../../services/types/serviceTypes";

const AVAILABLE_TIMES = [
    "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30",
    "13:00", "14:00", "14:30", "15:00",
    "15:30", "16:00", "16:30", "17:00",
    "17:30", "18:00"
];
function formatLongDate(dateValue: string) {
	const date = new Date(`${dateValue}T12:00:00`);
	return new Intl.DateTimeFormat("es-MX", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}
const BUSINESS_CLOSE_TIME = "18:00";

export default function BookingPage() {
	const navigate = useNavigate();
	const [step, setStep] = useState(1);
	const [services, setServices] = useState<Service[]>([]);
	const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
	const [loadingServices, setLoadingServices] = useState(true);
	const [selectedDate, setSelectedDate] = useState("");
	const [selectedTime, setSelectedTime] = useState("");
	const [calendarDate, setCalendarDate] = useState(new Date());
	const [notes, setNotes] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
	const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
	const [loadingAppointments, setLoadingAppointments] = useState(true);

	const [bookedTimes, setBookedTimes] = useState<string[]>([]);
	const [loadingTimes, setLoadingTimes] = useState(false);

	const selectedService = useMemo(
		() => services.find((service) => service.id === selectedServiceId) ?? null,
		[services, selectedServiceId]
	);

	useEffect(() => {
		let cancelled = false;

		async function loadServices() {
			try {
				const response = await getServices();
				const activeServices = response.filter((service) => service.isActive);
				if (!cancelled) {
					setServices(activeServices);
					setSelectedServiceId((current) => current ?? activeServices[0]?.id ?? null);
				}
			} catch {
				if (!cancelled) {
					setServices([]);
				}
			}
			finally {
				if (!cancelled) {
					setLoadingServices(false);
				}
			}
		}

		loadServices();

		return () => {
			cancelled = true;
		};
	}, []);

	function timeToMinutes(time: string): number {
		const [hours, minutes] = time.split(":").map(Number);

		return hours * 60 + minutes;
	}

	const isTimePast = (time: string): boolean => {
		if (!selectedDate) {
			return false;
		}

		const todayValue = [
			today.getFullYear(),
			String(today.getMonth() + 1).padStart(2, "0"),
			String(today.getDate()).padStart(2, "0"),
		].join("-");

		// Si no es hoy, el horario todavía no ha pasado
		if (selectedDate !== todayValue) {
			return false;
		}

		const now = new Date();

		const currentMinutes =
			now.getHours() * 60 + now.getMinutes();

		const selectedMinutes = timeToMinutes(time);

		return selectedMinutes <= currentMinutes;
	};

	const isTodayClosed = (): boolean => {
		const now = new Date();

		const currentMinutes =
			now.getHours() * 60 + now.getMinutes();

		const closeMinutes = timeToMinutes(
			BUSINESS_CLOSE_TIME
		);

		return currentMinutes >= closeMinutes;
	};

	useEffect(() => {
		let cancelled = false;

		async function loadAppointments() {
			try {
				const appointments = await getMyAppointments();
				if (!cancelled) {
					setExistingAppointments(appointments);
				}
			} catch {
				if (!cancelled) {
					setExistingAppointments([]);
				}
			} finally {
				if (!cancelled) {
					setLoadingAppointments(false);
				}
			}
		}

		loadAppointments();

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!selectedDate || !selectedServiceId) {
			setBookedTimes([]);
			return;
		}

		const serviceId = selectedServiceId;

		let cancelled = false;

		async function loadAvailability() {
			try {
				setLoadingTimes(true);

				const response = await getAvailability(
					selectedDate,
					serviceId
				);

				if (!cancelled) {
					setBookedTimes(response.bookedTimes);
				}
			} catch {
				if (!cancelled) {
					setBookedTimes([]);
				}
			} finally {
				if (!cancelled) {
					setLoadingTimes(false);
				}
			}
		}

		loadAvailability();

		return () => {
			cancelled = true;
		};
	}, [selectedDate, selectedServiceId]);

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const currentYear = calendarDate.getFullYear();
	const currentMonth = calendarDate.getMonth();

	const firstDayOfMonth = new Date(
		currentYear,
		currentMonth,
		1
	);

	// Domingo = 0, Lunes = 1...
	const firstDayIndex = firstDayOfMonth.getDay();

	const daysInMonth = new Date(
		currentYear,
		currentMonth + 1,
		0
	).getDate();

	const calendarDays = Array.from(
		{ length: firstDayIndex + daysInMonth },
		(_, index) => {
			if (index < firstDayIndex) {
				return null;
			}

			return index - firstDayIndex + 1;
		}
	);

	const monthName = new Intl.DateTimeFormat("es-MX", {
		month: "long",
	}).format(calendarDate);

	const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

	const goToPreviousMonth = () => {
		const previousMonth = new Date(
			currentYear,
			currentMonth - 1,
			1
		);

		// No permitir navegar antes del mes actual
		const currentMonthDate = new Date(
			today.getFullYear(),
			today.getMonth(),
			1
		);

		if (previousMonth >= currentMonthDate) {
			setCalendarDate(previousMonth);
		}
	};

	const goToNextMonth = () => {
		setCalendarDate(
			new Date(currentYear, currentMonth + 1, 1)
		);
	};

	const handleSelectDate = (day: number) => {
		const date = new Date(
			currentYear,
			currentMonth,
			day
		);

		date.setHours(0, 0, 0, 0);

		// No permitir fechas pasadas
		if (date < today) {
			return;
		}
		const isToday =
			date.getTime() === today.getTime();

		if (isToday && isTodayClosed()) {
			return;
		}

		const dateValue = [
			date.getFullYear(),
			String(date.getMonth() + 1).padStart(2, "0"),
			String(date.getDate()).padStart(2, "0"),
		].join("-");

		setSelectedDate(dateValue);
		setSelectedTime("");
	};

	const handleConfirm = async () => {
		if (!selectedService || !selectedDate || !selectedTime) {
			return;
		}

		if (isTimePast(selectedTime)) {
			setSelectedTime("");
			setError("Ese horario ya pasó. Selecciona uno posterior a la hora actual.");
			return;
		}

		setLoading(true);
		setError(null);

		const payload: AppointmentPayload = {
			serviceId: selectedService.id,
			serviceName: selectedService.name,
			servicePrice: selectedService.price,
			serviceDuration: selectedService.duration,
			serviceImage: selectedService.image,
			appointmentDate: selectedDate,
			startTime: selectedTime,
			notes,
		};

		try {
			const appointment = await createAppointment(payload);
			setCreatedAppointment(appointment);
			setExistingAppointments((current) => [appointment, ...current]);
			setStep(4);
		} catch (err) {
			setError(err instanceof Error ? err.message : "No se pudo crear la cita");
		} finally {
			setLoading(false);
		}
	};

	if (createdAppointment) {
		return (
			<MainLayout>
				<section className="flex-1 px-6 py-20" style={{ backgroundColor: "#111111" }}>
					<div className="max-w-2xl mx-auto text-center">
						<div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(201,169,110,0.15)", border: "2px solid #C9A96E" }}>
							<svg width="36" height="36" fill="none" stroke="#C9A96E" strokeWidth="2.5" viewBox="0 0 24 24">
								<path d="M20 6L9 17l-5-5" />
							</svg>
						</div>
						<h1 className="font-display text-3xl font-bold mb-3" style={{ color: "#F8F5F0" }}>¡Cita creada!</h1>
						<p className="mb-8" style={{ color: "#A1A1AA" }}>Tu reserva quedó registrada para el usuario autenticado.</p>

						<div className="rounded-2xl p-6 text-left" style={{ backgroundColor: "#1C1C1C", border: "1px solid rgba(248,245,240,0.06)" }}>
							<div className="flex items-center gap-4">
								<img src={`http://localhost:8080${createdAppointment.serviceImage}`} alt={createdAppointment.serviceName} className="w-20 h-20 rounded-xl object-cover" />
								<div>
									<h2 className="font-display text-xl font-semibold" style={{ color: "#F8F5F0" }}>{createdAppointment.serviceName}</h2>
									<p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>{formatLongDate(createdAppointment.appointmentDate)} · {createdAppointment.startTime}</p>
									<p className="text-sm mt-1" style={{ color: "#C9A96E" }}>${createdAppointment.servicePrice}</p>
								</div>
							</div>
						</div>

						<div className="flex gap-3 justify-center mt-8">
							<button onClick={() => navigate("/my-appointments")} className="px-5 py-3 rounded-xl font-medium text-sm" style={{ backgroundColor: "#C9A96E", color: "#111111" }}>
								Ver mis citas
							</button>
							<button onClick={() => window.location.reload()} className="px-5 py-3 rounded-xl font-medium text-sm border" style={{ color: "#F8F5F0", borderColor: "rgba(248,245,240,0.12)" }}>
								Reservar otra
							</button>
						</div>
					</div>
				</section>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			<section className="px-6 py-20" style={{ backgroundColor: "#111111" }}>
				<div className="max-w-5xl mx-auto">
							{services.length === 0 && !loadingServices ? (
								<div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
									No hay servicios activos disponibles todavía.
								</div>
							) : null}
					<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
						<div>
							<p className="text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: "#C9A96E" }}>Reservas</p>
							<h1 className="font-display text-4xl lg:text-5xl font-bold" style={{ color: "#F8F5F0" }}>Reserva tu próxima cita</h1>
						</div>
						{!loadingAppointments && existingAppointments.length > 0 ? (
							<button onClick={() => navigate("/my-appointments")} className="self-start md:self-auto px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E" }}>
								Tienes {existingAppointments.length} cita{existingAppointments.length > 1 ? "s" : ""}
							</button>
						) : null}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
						<div className="rounded-3xl p-6 md:p-8" style={{ backgroundColor: "#1C1C1C", border: "1px solid rgba(248,245,240,0.06)" }}>
							<div className="flex gap-2 mb-8">
								{[1, 2, 3, 4].map((currentStep) => (
									<div key={currentStep} className="h-1 flex-1 rounded-full" style={{ backgroundColor: currentStep <= step ? "#C9A96E" : "rgba(248,245,240,0.1)" }} />
								))}
							</div>

							{step === 1 ? (
								<div>
									<h2 className="font-display text-2xl font-semibold mb-6" style={{ color: "#F8F5F0" }}>Elige un servicio</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{services.map((service) => {
											const selected = selectedServiceId === service.id;
											return (
												<button key={service.id} onClick={() => {setSelectedServiceId(service.id); setSelectedTime("");}} className="text-left p-4 rounded-2xl transition-all" style={{ backgroundColor: selected ? "rgba(201,169,110,0.08)" : "#111111", border: `1px solid ${selected ? "#C9A96E" : "rgba(248,245,240,0.06)"}` }}>
													<div className="flex items-start gap-3">
														<img src={`http://localhost:8080${service.image}`} alt={service.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
														<div className="flex-1 min-w-0">
															<div className="font-semibold text-sm mb-0.5" style={{ color: "#F8F5F0" }}>{service.name}</div>
															<div className="text-xs mb-2" style={{ color: "#A1A1AA" }}>{service.duration}</div>
															<div className="font-mono-data font-bold text-base" style={{ color: "#C9A96E" }}>${service.price}</div>
														</div>
														{selected ? (
															<div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#C9A96E" }}>
																<svg width="10" height="10" fill="none" stroke="#111" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
															</div>
														) : null}
													</div>
												</button>
										);
										})}
									</div>
									<button disabled={!selectedService} onClick={() => setStep(2)} className="w-full mt-8 py-3.5 rounded-xl font-semibold text-sm transition-all" style={{ backgroundColor: selectedService ? "#C9A96E" : "rgba(201,169,110,0.3)", color: selectedService ? "#111111" : "#A1A1AA", cursor: selectedService ? "pointer" : "not-allowed" }}>
										Continuar
									</button>
								</div>
							) : null}

							{step === 2 ? (
							<div>
								<h2
									className="font-display text-2xl font-semibold mb-6"
									style={{ color: "#F8F5F0" }}
								>
									Elige la fecha
								</h2>

								{/* CALENDARIO */}
								<div
									className="rounded-2xl p-4 sm:p-6"
									style={{
										backgroundColor: "#111111",
										border: "1px solid rgba(248,245,240,0.06)",
									}}
								>
									{/* CABECERA DEL CALENDARIO */}
									<div className="flex items-center justify-between mb-6">
										<button
											type="button"
											onClick={goToPreviousMonth}
											disabled={
												currentYear === today.getFullYear() &&
												currentMonth === today.getMonth()
											}
											className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
											style={{
												color: "#F8F5F0",
												backgroundColor: "rgba(248,245,240,0.04)",
											}}
										>
											‹
										</button>

										<div className="text-center">
											<p
												className="text-sm font-medium"
												style={{ color: "#A1A1AA" }}
											>
												{currentYear}
											</p>

											<h3
												className="font-display text-xl font-semibold"
												style={{ color: "#F8F5F0" }}
											>
												{formattedMonth}
											</h3>
										</div>

										<button
											type="button"
											onClick={goToNextMonth}
											className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
											style={{
												color: "#F8F5F0",
												backgroundColor: "rgba(248,245,240,0.04)",
											}}
										>
											›
										</button>
									</div>

									{/* DÍAS DE LA SEMANA */}
									<div className="grid grid-cols-7 mb-3">
										{[
											"Dom",
											"Lun",
											"Mar",
											"Mié",
											"Jue",
											"Vie",
											"Sáb",
										].map((day) => (
											<div
												key={day}
												className="text-center text-xs font-medium py-2"
												style={{ color: "#71717A" }}
											>
												{day}
											</div>
										))}
									</div>

									{/* DÍAS */}
									<div className="grid grid-cols-7 gap-1 sm:gap-2">
										{calendarDays.map((day, index) => {
											if (day === null) {
												return (
													<div
														key={`empty-${index}`}
														className="aspect-square"
													/>
												);
											}

											const date = new Date(
												currentYear,
												currentMonth,
												day
											);

											date.setHours(0, 0, 0, 0);

											const dateValue = [
												currentYear,
												String(currentMonth + 1).padStart(2, "0"),
												String(day).padStart(2, "0"),
											].join("-");

											const isPast = date < today;

											const isToday =
												date.getTime() === today.getTime();

											const isClosedToday =
												isToday && isTodayClosed();

											const isDisabled =
												isPast || isClosedToday;

											const isSelected =
												selectedDate === dateValue;

											return (
												<button
													key={dateValue}
													type="button"
													disabled={isDisabled}
													onClick={() =>
														handleSelectDate(day)
													}
													className="aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative"
													style={{
														backgroundColor: isSelected
															? "#C9A96E"
															: isToday
																? "rgba(201,169,110,0.12)"
																: "transparent",

														color: isSelected
															? "#111111"
															: isDisabled
																? "#3F3F46"
																: "#F8F5F0",

														border: isToday && !isSelected
															? "1px solid rgba(201,169,110,0.35)"
															: "1px solid transparent",

														cursor: isDisabled
															? "not-allowed"
															: "pointer",
													}}
												>
													<span className="text-sm font-medium">
														{day}
													</span>

													{/* INDICADOR DEL DÍA ACTUAL */}
													{isToday && !isSelected && (
														<span
															className="absolute bottom-1 w-1 h-1 rounded-full"
															style={{
																backgroundColor:
																	"#C9A96E",
															}}
														/>
													)}
												</button>
											);
										})}
									</div>

									{/* LEYENDA */}
									<div className="flex items-center gap-5 mt-5 pt-4 border-t"
										style={{
											borderColor:
												"rgba(248,245,240,0.06)",
										}}
									>
										<div className="flex items-center gap-2">
											<div
												className="w-3 h-3 rounded-full"
												style={{
													backgroundColor: "#C9A96E",
												}}
											/>

											<span
												className="text-xs"
												style={{ color: "#A1A1AA" }}
											>
												Seleccionado
											</span>
										</div>

										<div className="flex items-center gap-2">
											<div
												className="w-3 h-3 rounded-full"
												style={{
													backgroundColor:
														"rgba(201,169,110,0.35)",
												}}
											/>

											<span
												className="text-xs"
												style={{ color: "#A1A1AA" }}
											>
												Hoy
											</span>
										</div>
									</div>
								</div>

								{/* FECHA SELECCIONADA */}
								{selectedDate && (
									<div
										className="mt-4 rounded-xl px-4 py-3"
										style={{
											backgroundColor:
												"rgba(201,169,110,0.08)",
											border:
												"1px solid rgba(201,169,110,0.16)",
										}}
									>
										<p
											className="text-xs"
											style={{ color: "#A1A1AA" }}
										>
											Fecha seleccionada
										</p>

										<p
											className="text-sm font-medium mt-1"
											style={{ color: "#C9A96E" }}
										>
											{formatLongDate(selectedDate)}
										</p>
									</div>
								)}

								{/* BOTONES */}
								<div className="flex gap-3 mt-8">
									<button
										type="button"
										onClick={() => setStep(1)}
										className="px-5 py-3 rounded-xl text-sm font-medium border"
										style={{
											color: "#F8F5F0",
											borderColor:
												"rgba(248,245,240,0.12)",
										}}
									>
										Atrás
									</button>

									<button
										type="button"
										disabled={!selectedDate}
										onClick={() => setStep(3)}
										className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
										style={{
											backgroundColor: selectedDate
												? "#C9A96E"
												: "rgba(201,169,110,0.3)",
											color: selectedDate
												? "#111111"
												: "#A1A1AA",
											cursor: selectedDate
												? "pointer"
												: "not-allowed",
										}}
									>
										Continuar
									</button>
								</div>
							</div>
						) : null}

							{step === 3 ? (
								<div>
									<h2 className="font-display text-2xl font-semibold mb-3" style={{ color: "#F8F5F0" }}>Elige el horario</h2>
									<p className="text-sm mb-6" style={{ color: "#A1A1AA" }}>{selectedDate ? formatLongDate(selectedDate) : ""}</p>
									{loadingTimes ? (
										<p
											className="mb-4 text-sm"
											style={{ color: "#A1A1AA" }}
										>
											Consultando horarios disponibles...
										</p>
									) : null}
									<div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
										{AVAILABLE_TIMES.map((time) => {
											const selected = selectedTime === time;
											const booked = bookedTimes.includes(time);
											const past = isTimePast(time);
											const unavailable = booked || past;

											return (
												<button
													key={time}
													type="button"
													disabled={unavailable || loadingTimes}
													onClick={() => {
														if (!unavailable) {
															setSelectedTime(time);
														}
													}}
													className="py-3 rounded-xl text-sm font-medium transition-all font-mono-data"
													style={{
														backgroundColor: selected
															? "#C9A96E"
															: unavailable
																? "#080808"
																: "#111111",

														color: selected
															? "#111111"
															: unavailable
																? "#52525B"
																: "#F8F5F0",

														border: `1px solid ${
															selected
																? "#C9A96E"
																: unavailable
																	? "rgba(248,245,240,0.03)"
																	: "rgba(248,245,240,0.06)"
														}`,

														cursor: unavailable
															? "not-allowed"
															: "pointer",

														opacity: unavailable ? 0.5 : 1,
													}}
												>
													{unavailable ? "🔒 " : ""}
													{time}
												</button>
											);
										})}
									</div>
									<div className="mt-6">
										<label className="block text-xs font-medium mb-1.5" style={{ color: "#A1A1AA" }}>Notas opcionales</label>
										<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ backgroundColor: "#111111", color: "#F8F5F0", border: "1px solid rgba(248,245,240,0.08)" }} placeholder="Algún detalle para tu cita..." />
									</div>
									{error ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
									<div className="flex gap-3 mt-8">
										<button onClick={() => setStep(2)} className="px-5 py-3 rounded-xl text-sm font-medium border" style={{ color: "#F8F5F0", borderColor: "rgba(248,245,240,0.12)" }}>
											Atrás
										</button>
										<button disabled={!selectedTime || loading} onClick={handleConfirm} className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all" style={{ backgroundColor: selectedTime ? "#C9A96E" : "rgba(201,169,110,0.3)", color: selectedTime ? "#111111" : "#A1A1AA", cursor: selectedTime && !loading ? "pointer" : "not-allowed" }}>
											{loading ? "Reservando..." : "Confirmar cita"}
										</button>
									</div>
								</div>
							) : null}

							{step === 4 ? (
								<div className="rounded-2xl p-6 border" style={{ backgroundColor: "rgba(201,169,110,0.08)", borderColor: "rgba(201,169,110,0.2)" }}>
									<p className="text-sm uppercase tracking-[0.18em] mb-3" style={{ color: "#C9A96E" }}>Confirmada</p>
									<p className="text-lg font-semibold" style={{ color: "#F8F5F0" }}>{selectedService?.name}</p>
									<p className="text-sm mt-2" style={{ color: "#A1A1AA" }}>{selectedDate ? formatLongDate(selectedDate) : ""} · {selectedTime}</p>
								</div>
							) : null}
						</div>

						<div className="rounded-3xl p-6 md:p-8 h-fit" style={{ backgroundColor: "#1C1C1C", border: "1px solid rgba(248,245,240,0.06)" }}>
							<h3 className="font-display text-xl font-semibold mb-4" style={{ color: "#F8F5F0" }}>Resumen</h3>
							{selectedService ? (
								<div className="space-y-4">
									<img src={`http://localhost:8080${selectedService.image}`} alt={selectedService.name} className="w-full h-48 rounded-2xl object-cover" />
									<div className="space-y-3 text-sm">
										<div className="flex justify-between gap-4"><span style={{ color: "#A1A1AA" }}>Servicio</span><span style={{ color: "#F8F5F0" }}>{selectedService.name}</span></div>
										<div className="flex justify-between gap-4"><span style={{ color: "#A1A1AA" }}>Duración</span><span style={{ color: "#F8F5F0" }}>{selectedService.duration}</span></div>
										<div className="flex justify-between gap-4"><span style={{ color: "#A1A1AA" }}>Precio</span><span style={{ color: "#F8F5F0" }}>${selectedService.price}</span></div>
										<div className="flex justify-between gap-4"><span style={{ color: "#A1A1AA" }}>Fecha</span><span style={{ color: "#F8F5F0" }}>{selectedDate ? formatLongDate(selectedDate) : "Pendiente"}</span></div>
										<div className="flex justify-between gap-4"><span style={{ color: "#A1A1AA" }}>Hora</span><span style={{ color: "#F8F5F0" }}>{selectedTime || "Pendiente"}</span></div>
									</div>
								</div>
							) : null}

							{loadingAppointments && !createdAppointment ? (
								<p className="mt-6 text-sm" style={{ color: "#A1A1AA" }}>Cargando tus citas...</p>
							) : null}

							{!loadingAppointments && existingAppointments.length > 0 && !createdAppointment ? (
								<div className="mt-6 rounded-2xl p-4" style={{ backgroundColor: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.16)" }}>
									<p className="text-sm font-medium" style={{ color: "#F8F5F0" }}>Ya tienes {existingAppointments.length} cita{existingAppointments.length > 1 ? "s" : ""} registrada{existingAppointments.length > 1 ? "s" : ""}.</p>
									<button onClick={() => navigate("/my-appointments")} className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: "#C9A96E", color: "#111111" }}>
										Ver mis citas
									</button>
								</div>
							) : null}
						</div>
					</div>
				</div>
			</section>
		</MainLayout>
	);
}
