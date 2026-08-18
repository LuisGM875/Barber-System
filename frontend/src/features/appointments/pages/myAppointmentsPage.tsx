import { useEffect, useState } from "react";
import MainLayout from "../../shared/layouts/mainLayout";
import { useAuth } from "../../../app/providers/authProvider";
import { getMyAppointments } from "../services/appointmentService";
import type { Appointment } from "../types/appointmentTypes";

function formatDate(dateValue: string) {
	const date = new Date(`${dateValue}T12:00:00`);

	return new Intl.DateTimeFormat("es-MX", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

function statusLabel(status: string) {
	const labels: Record<string, string> = {
		PENDING: "Pendiente",
		CONFIRMED: "Confirmada",
		CANCELLED: "Cancelada",
		COMPLETED: "Finalizada",
	};

	return labels[status] ?? status;
}

export default function MyAppointmentsPage() {
	const { user } = useAuth();

	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function loadAppointments() {
			try {
				setError(null);

				const response = await getMyAppointments();

				if (!cancelled) {
					setAppointments(response);
				}
			} catch (err) {
				if (!cancelled) {
					setError(
						err instanceof Error
							? err.message
							: "No se pudieron cargar tus citas"
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		loadAppointments();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<MainLayout>
			<section
				className="min-h-screen px-6 py-20"
				style={{ backgroundColor: "#111111" }}
			>
				<div className="max-w-6xl mx-auto">

					{/* Header */}
					<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
						<div>
							<h1
								className="font-display text-4xl lg:text-5xl font-bold"
								style={{ color: "#F8F5F0" }}
							>
								Mis citas
							</h1>

							<p
								className="mt-3 text-sm"
								style={{ color: "#A1A1AA" }}
							>
								{user?.name
									? `Hola, ${user.name}. Aquí están tus reservas.`
									: "Aquí están tus reservas."}
							</p>
						</div>

						{/* Reservar nueva cita */}
						{/*<button
							onClick={() => navigate("/booking")}
							className="self-start md:self-auto px-4 py-2.5 rounded-xl text-sm font-medium"
							style={{
								backgroundColor: "#C9A96E",
								color: "#111111",
							}}
						>
							Reservar nueva cita
						</button>*/}
					</div>

					{/* Loading */}
					{loading ? (
						<div
							className="rounded-3xl p-6"
							style={{
								backgroundColor: "#1C1C1C",
								border:
									"1px solid rgba(248,245,240,0.06)",
							}}
						>
							<p style={{ color: "#A1A1AA" }}>
								Cargando tus citas...
							</p>
						</div>

					) : error ? (

						/* Error */
						<div className="rounded-3xl p-6 border border-red-500/20 bg-red-500/10 text-red-200">
							{error}
						</div>

					) : appointments.length === 0 ? (

						/* Sin citas */
						<div
							className="rounded-3xl p-8 text-center"
							style={{
								backgroundColor: "#1C1C1C",
								border:
									"1px solid rgba(248,245,240,0.06)",
							}}
						>
							<h2
								className="font-display text-2xl font-semibold"
								style={{ color: "#F8F5F0" }}
							>
								Todavía no tienes citas
							</h2>

							<p
								className="mt-3 text-sm"
								style={{ color: "#A1A1AA" }}
							>
								Reserva tu primera cita y aparecerá aquí.
							</p>

						</div>

					) : (

						/* Citas */
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							{appointments.map((appointment) => (
								<div
									key={appointment.id}
									className="rounded-3xl overflow-hidden"
									style={{
										backgroundColor: "#1C1C1C",
										border:
											"1px solid rgba(248,245,240,0.06)",
									}}
								>
									<img
										src={`http://localhost:8080${appointment.serviceImage}`}
										alt={appointment.serviceName}
										className="w-full h-48 object-cover"
									/>

									<div className="p-5">

										<div className="flex items-start justify-between gap-4 mb-3">
											<div>
												<h3
													className="font-display text-xl font-semibold"
													style={{
														color: "#F8F5F0",
													}}
												>
													{appointment.serviceName}
												</h3>

												<p
													className="text-sm mt-1"
													style={{
														color: "#A1A1AA",
													}}
												>
													{formatDate(
														appointment.appointmentDate
													)}{" "}
													·{" "}
													{appointment.startTime}
												</p>
											</div>

											<span
												className="px-3 py-1.5 rounded-full text-xs font-medium"
												style={{
													backgroundColor:
														"rgba(201,169,110,0.12)",
													color: "#C9A96E",
												}}
											>
												{statusLabel(
													appointment.status
												)}
											</span>
										</div>

										<div className="flex items-center justify-between text-sm">
											<span
												style={{
													color: "#A1A1AA",
												}}
											>
												Duración
											</span>

											<span
												style={{
													color: "#F8F5F0",
												}}
											>
												{appointment.serviceDuration}
											</span>
										</div>

										<div className="flex items-center justify-between text-sm mt-2">
											<span
												style={{
													color: "#A1A1AA",
												}}
											>
												Precio
											</span>

											<span
												style={{
													color: "#F8F5F0",
												}}
											>
												${appointment.servicePrice}
											</span>
										</div>

										{appointment.notes ? (
											<p
												className="mt-4 text-sm"
												style={{
													color: "#A1A1AA",
												}}
											>
												{appointment.notes}
											</p>
										) : null}

									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</section>
		</MainLayout>
	);
}