import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../shared/layouts/mainLayout";
import { useAuth } from "../../../app/providers/authProvider";
import { getImageUrl } from "../../../app/router/api";
import {
	getServices,
	createService,
	updateService,
	deleteService,
} from "../services/serviceService";
import type { Service, ServicePayload } from "../types/serviceTypes";

const EMPTY_FORM: ServicePayload = {
	name: "",
	description: "",
	price: 0,
	duration: "",
	isActive: true,
	imageFile: null,
};


export default function ServicesPage() {
	const navigate = useNavigate();
	const { user } = useAuth();

	const isAdmin = user?.role?.trim().toUpperCase() === "ADMIN";

	const [services, setServices] = useState<Service[]>([]);
    console.log("SERVICES:", services);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

	const [form, setForm] = useState<ServicePayload>(EMPTY_FORM);
	const [saving, setSaving] = useState(false);

	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	// =========================
	// CARGAR SERVICIOS
	// =========================

	useEffect(() => {
		let cancelled = false;

		async function loadServices() {
			try {
				setError(null);

				const response = await getServices();

				if (!cancelled) {
					setServices(response);
				}
			} catch (err) {
				if (!cancelled) {
					setError(
						err instanceof Error
							? err.message
							: "No se pudieron cargar los servicios"
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		loadServices();

		return () => {
			cancelled = true;
		};
	}, []);

	// =========================
	// ABRIR CREAR
	// =========================

	const openCreateModal = () => {
		setEditingServiceId(null);
		setForm({
			...EMPTY_FORM,
			imageFile: null,
		});
		setImageFile(null);
		setImagePreview(null);
		setError(null);
		setModalOpen(true);
	};

	// =========================
	// ABRIR EDITAR
	// =========================

	const openEditModal = (service: Service) => {
		setEditingServiceId(service.id);

		setForm({
			name: service.name,
			description: service.description,
			price: service.price,
			duration: service.duration,
			isActive: service.isActive,
			imageFile: null,
		});

		setImageFile(null);
		setImagePreview(getImageUrl(service.image));

		setError(null);
		setModalOpen(true);
	};

	// =========================
	// CERRAR MODAL
	// =========================

	const closeModal = () => {
		setModalOpen(false);
		setEditingServiceId(null);

		setForm({
			...EMPTY_FORM,
			imageFile: null,
		});

		setImageFile(null);
		setImagePreview(null);
	};

	// =========================
	// CAMBIAR IMAGEN
	// =========================

	const handleImageChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0] ?? null;

		if (!file) {
			return;
		}

		if (!file.type.startsWith("image/")) {
			setError("El archivo seleccionado no es una imagen.");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			setError("La imagen no puede superar los 5 MB.");
			return;
		}

		setError(null);

		setImageFile(file);

		setForm((current) => ({
			...current,
			imageFile: file,
		}));

		const previewUrl = URL.createObjectURL(file);

		setImagePreview(previewUrl);
	};

	// =========================
	// GUARDAR
	// =========================

	const handleSubmit = async (
		event: FormEvent<HTMLFormElement>
	) => {
		event.preventDefault();

		setError(null);
		setSaving(true);

		try {
			if (editingServiceId) {
				await updateService(
					editingServiceId,
					form,
					imageFile
				);
			} else {
				if (!imageFile) {
					setError("Debes seleccionar una imagen.");
					setSaving(false);
					return;
				}

				await createService(
					form,
					imageFile
				);
			}

			const response = await getServices();

			setServices(response);

			closeModal();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "No se pudo guardar el servicio"
			);
		} finally {
			setSaving(false);
		}
	};

	// =========================
	// ELIMINAR
	// =========================

    const handleDelete = async (serviceId: string) => {
        const service = services.find(
            (service) => service.id === serviceId
        );

        const confirmed = window.confirm(
            `¿Estás seguro de eliminar el servicio "${service?.name ?? "este servicio"}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError(null);

            await deleteService(serviceId);

            setServices((current) =>
                current.filter(
                    (service) => service.id !== serviceId
                )
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo eliminar el servicio"
            );
        }
    };

	const visibleServices = isAdmin
		? services
		: services.filter((service) => service.isActive);

	// =========================
	// VISTA
	// =========================

	return (
		<MainLayout>
			<section
                className="min-h-screen px-6 py-20"
                style={{ backgroundColor: "#111111" }}
                >
				<div className="max-w-7xl mx-auto">

					{/* HEADER */}
					<div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-16">
						<div>
							<p
								className="text-xs font-medium tracking-[0.2em] uppercase mb-3"
								style={{ color: "#C9A96E" }}
							>
								Menú de servicios
							</p>

							<h2
								className="font-display text-4xl lg:text-5xl font-bold"
								style={{ color: "#F8F5F0" }}
							>
								Lo que hacemos mejor
							</h2>
						</div>

						{isAdmin && (
							<button
								onClick={openCreateModal}
								className="self-start md:self-auto px-4 py-3 rounded-xl text-sm font-medium"
								style={{
									backgroundColor: "#C9A96E",
									color: "#111111",
								}}
							>
								Nuevo servicio
							</button>
						)}
					</div>

					{/* ERROR GENERAL */}
					{error && !modalOpen && (
						<div className="mb-6 rounded-2xl p-5 border border-red-500/20 bg-red-500/10 text-red-200">
							{error}
						</div>
					)}

					{/* LOADING */}
					{loading ? (
						<div
							className="rounded-3xl p-8"
							style={{
								backgroundColor: "#1C1C1C",
								border:
									"1px solid rgba(248,245,240,0.06)",
							}}
						>
							<p style={{ color: "#A1A1AA" }}>
								Cargando servicios...
							</p>
						</div>
					) : visibleServices.length === 0 ? (
						<div
							className="rounded-3xl p-8 text-center"
							style={{
								backgroundColor: "#1C1C1C",
								border:
									"1px solid rgba(248,245,240,0.06)",
							}}
						>
							<h3
								className="font-display text-2xl font-semibold"
								style={{ color: "#F8F5F0" }}
							>
								No hay servicios disponibles
							</h3>

							<p
								className="mt-3 text-sm"
								style={{ color: "#A1A1AA" }}
							>
								{isAdmin
									? "Crea un servicio nuevo para que aparezca en la lista."
									: "No hay servicios disponibles por el momento"}
							</p>

							{isAdmin && (
								<button
									onClick={openCreateModal}
									className="mt-6 px-5 py-3 rounded-xl text-sm font-medium"
									style={{
										backgroundColor: "#C9A96E",
										color: "#111111",
									}}
								>
									Crear nuevo servicio
								</button>
							)}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

							{visibleServices.map((service) => (
								<div
									key={service.id}
									className="group rounded-2xl overflow-hidden transition-all duration-300"
									style={{
										backgroundColor: "#1C1C1C",
										border:
											"1px solid rgba(248,245,240,0.06)",
									}}
								>

									{/* IMAGEN */}
									<div
										className="relative overflow-hidden"
										style={{ height: "180px" }}
									>
                                        
										<img
											src={getImageUrl(service.image)}
											alt={service.name}
											className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
										/>

										<div
											className="absolute inset-0"
											style={{
												background:
													"linear-gradient(to top, rgba(28,28,28,0.8), transparent)",
											}}
										/>

										{isAdmin && (
											<span
												className="absolute top-4 right-4 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
												style={{
													backgroundColor:
														service.isActive
															? "rgba(34,197,94,0.15)"
															: "rgba(248,113,113,0.15)",
													color:
														service.isActive
															? "#4ADE80"
															: "#F87171",
												}}
											>
												{service.isActive
													? "Activo"
													: "Inactivo"}
											</span>
										)}
									</div>

									{/* INFORMACIÓN */}
									<div className="p-5">

										<div className="flex items-start justify-between mb-2 gap-4">
											<h3
												className="font-display text-lg font-semibold"
												style={{ color: "#F8F5F0" }}
											>
												{service.name}
											</h3>

											<span
												className="text-lg font-bold"
												style={{ color: "#C9A96E" }}
											>
												${service.price}
											</span>
										</div>

										<p
											className="text-sm mb-4"
											style={{ color: "#A1A1AA" }}
										>
											{service.description}
										</p>

										<div className="flex flex-wrap items-center justify-between gap-3">

											<span
												className="text-xs flex items-center gap-1.5"
												style={{ color: "#A1A1AA" }}
											>
												{service.duration}
											</span>

											<div className="flex items-center gap-2">

												<button
													onClick={() =>
														navigate("/booking")
													}
													className="text-xs px-3 py-1.5 rounded-lg font-medium"
													style={{
														backgroundColor:
															"rgba(201,169,110,0.12)",
														color: "#C9A96E",
													}}
												>
													Reservar
												</button>

												{isAdmin && (
													<>
														<button
															onClick={() =>
																openEditModal(
																	service
																)
															}
															className="text-xs px-3 py-1.5 rounded-lg font-medium"
															style={{
																backgroundColor:
																	"rgba(59,130,246,0.12)",
																color: "#60A5FA",
															}}
														>
															Editar
														</button>

														<button
															onClick={() =>
																handleDelete(
																	service.id
																)
															}
															className="text-xs px-3 py-1.5 rounded-lg font-medium"
															style={{
																backgroundColor:
																	"rgba(239,68,68,0.12)",
																color: "#F87171",
															}}
														>
															Eliminar
														</button>
													</>
												)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* ========================= */}
				{/* MODAL */}
				{/* ========================= */}

				{modalOpen && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
						style={{
							backgroundColor: "rgba(0,0,0,0.72)",
						}}
					>
						<div
							className="w-full max-w-xl max-h-[90vh] rounded-3xl flex flex-col overflow-hidden"
							style={{
								backgroundColor: "#111111",
								border:
									"1px solid rgba(248,245,240,0.08)",
							}}
						>

							{/* HEADER FIJO */}
							<div
								className="flex items-center justify-between px-6 py-5 shrink-0 border-b"
								style={{
									borderColor:
										"rgba(248,245,240,0.08)",
								}}
							>
								<div>
									<p
										className="text-xs font-medium tracking-[0.2em] uppercase mb-2"
										style={{ color: "#C9A96E" }}
									>
										{editingServiceId
											? "Editar servicio"
											: "Nuevo servicio"}
									</p>

									<h3
										className="font-display text-2xl font-semibold"
										style={{ color: "#F8F5F0" }}
									>
										Información del servicio
									</h3>
								</div>

								<button
									type="button"
									onClick={closeModal}
									className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
									style={{
										backgroundColor: "#1C1C1C",
										color: "#A1A1AA",
									}}
								>
									×
								</button>
							</div>

							{/* ========================= */}
							{/* CONTENIDO CON SCROLL */}
							{/* ========================= */}

							<form
								onSubmit={handleSubmit}
								className="flex flex-col min-h-0"
							>

								<div className="overflow-y-auto px-6 py-5 space-y-5">

									{/* ERROR DEL FORMULARIO */}
									{error && (
										<div className="rounded-xl p-4 border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
											{error}
										</div>
									)}

									{/* NOMBRE */}
									<div>
										<label
											className="block text-xs font-medium mb-1.5"
											style={{
												color: "#A1A1AA",
											}}
										>
											Nombre
										</label>

										<input
											type="text"
											value={form.name}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													name: event.target.value,
												}))
											}
											placeholder="Corte clásico"
											required
											className="w-full px-4 py-3 rounded-xl text-sm outline-none"
											style={{
												backgroundColor: "#1C1C1C",
												color: "#F8F5F0",
												border:
													"1px solid rgba(248,245,240,0.08)",
											}}
										/>
									</div>

									{/* DESCRIPCIÓN */}
									<div>
										<label
											className="block text-xs font-medium mb-1.5"
											style={{
												color: "#A1A1AA",
											}}
										>
											Descripción
										</label>

										<textarea
											value={form.description}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													description:
														event.target.value,
												}))
											}
											placeholder="Descripción del servicio..."
											required
											rows={4}
											className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
											style={{
												backgroundColor: "#1C1C1C",
												color: "#F8F5F0",
												border:
													"1px solid rgba(248,245,240,0.08)",
											}}
										/>
									</div>

									{/* PRECIO */}
									<div>
										<label
											className="block text-xs font-medium mb-1.5"
											style={{
												color: "#A1A1AA",
											}}
										>
											Precio
										</label>

										<div className="relative">
											<span
												className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
												style={{
													color: "#A1A1AA",
												}}
											>
												$
											</span>

											<input
												type="number"
												min="0"
												step="0.01"
												value={form.price}
												onChange={(event) =>
													setForm((current) => ({
														...current,
														price: Number(
															event.target.value
														),
													}))
												}
												required
												className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none"
												style={{
													backgroundColor:
														"#1C1C1C",
													color: "#F8F5F0",
													border:
														"1px solid rgba(248,245,240,0.08)",
												}}
											/>
										</div>
									</div>

									{/* DURACIÓN */}
									<div>
										<label
											className="block text-xs font-medium mb-1.5"
											style={{
												color: "#A1A1AA",
											}}
										>
											Duración
										</label>

										<input
											type="text"
											value={form.duration}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													duration:
														event.target.value,
												}))
											}
											placeholder="30 min"
											required
											className="w-full px-4 py-3 rounded-xl text-sm outline-none"
											style={{
												backgroundColor: "#1C1C1C",
												color: "#F8F5F0",
												border:
													"1px solid rgba(248,245,240,0.08)",
											}}
										/>
									</div>

									{/* IMAGEN */}
									<div>
										<label
											className="block text-xs font-medium mb-1.5"
											style={{
												color: "#A1A1AA",
											}}
										>
											Imagen del servicio
										</label>

										<input
											type="file"
											accept="image/png,image/jpeg,image/jpg,image/webp"
											onChange={handleImageChange}
											className="w-full px-4 py-3 rounded-xl text-sm text-[#F8F5F0] bg-[#1C1C1C] border border-[rgba(248,245,240,0.08)] file:mr-4 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-sm"
										/>

										<p
											className="mt-2 text-xs"
											style={{
												color: "#71717A",
											}}
										>
											PNG, JPG, JPEG o WEBP. Máximo 5 MB.
											{editingServiceId &&
												" Si no seleccionas una nueva imagen, se conservará la actual."}
										</p>
									</div>

									{/* PREVIEW */}
									{imagePreview && (
										<div>
											<p
												className="text-xs font-medium mb-2"
												style={{
													color: "#A1A1AA",
												}}
											>
												{editingServiceId
													? "Vista previa"
													: "Imagen seleccionada"}
											</p>

											<div className="relative">
												<img
													src={imagePreview}
													alt="Vista previa"
													className="w-full h-48 sm:h-56 rounded-2xl object-cover"
												/>

												{imageFile && (
													<div
														className="absolute bottom-3 left-3 right-3 rounded-xl px-3 py-2 text-xs backdrop-blur-md"
														style={{
															backgroundColor:
																"rgba(17,17,17,0.8)",
															color: "#F8F5F0",
														}}
													>
														{imageFile.name}
													</div>
												)}
											</div>
										</div>
									)}

									{/* ACTIVO */}
									<div className="flex items-center gap-3">
										<input
											id="isActive"
											type="checkbox"
											checked={form.isActive}
											onChange={(event) =>
												setForm((current) => ({
													...current,
													isActive:
														event.target.checked,
												}))
											}
											className="w-4 h-4"
										/>

										<label
											htmlFor="isActive"
											className="text-sm"
											style={{
												color: "#F8F5F0",
											}}
										>
											Servicio activo
										</label>
									</div>
								</div>

								{/* ========================= */}
								{/* BOTONES FIJOS */}
								{/* ========================= */}

								<div
									className="flex gap-3 px-6 py-4 shrink-0 border-t"
									style={{
										borderColor:
											"rgba(248,245,240,0.08)",
										backgroundColor: "#111111",
									}}
								>
									<button
										type="button"
										onClick={closeModal}
										disabled={saving}
										className="px-4 py-3 rounded-xl text-sm font-medium border"
										style={{
											color: "#F8F5F0",
											borderColor:
												"rgba(248,245,240,0.12)",
										}}
									>
										Cancelar
									</button>

									<button
										type="submit"
										disabled={saving}
										className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
										style={{
											backgroundColor: "#C9A96E",
											color: "#111111",
										}}
									>
										{saving
											? "Guardando..."
											: editingServiceId
												? "Guardar cambios"
												: "Crear servicio"}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</section>
		</MainLayout>
	);
}
