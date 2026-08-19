import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface AuthLayoutProps {
	title: string;
	subtitle: string;
	children: ReactNode;
	footerQuestion: string;
	footerActionLabel: string;
	footerActionTo: string;
}

export default function AuthLayout({
	title,
	subtitle,
	children,
	footerQuestion,
	footerActionLabel,
	footerActionTo,
}: AuthLayoutProps) {
	return (
		<div className="flex h-[100dvh] overflow-hidden bg-[#111111]">
			<div className="relative hidden flex-1 overflow-hidden lg:flex">
				<img
					src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=1000&fit=crop&auto=format"
					alt="Barberia"
					className="absolute inset-0 h-full w-full object-cover"
				/>
				<div
					className="absolute inset-0"
					style={{
						background:
							"linear-gradient(to right, rgba(17,17,17,0) 60%, #111111)",
					}}
				/>
				<div className="absolute inset-0 flex flex-col justify-end p-12">
					<div className="flex items-center gap-2 mb-6">
						<div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#C9A96E]">
							<span className="text-sm text-[#111111]">✂</span>
						</div>
						<span className="font-display text-xl font-semibold text-[#F8F5F0]">
							BarberFlow
						</span>
					</div>
					<blockquote className="font-display text-2xl font-medium italic max-w-xs leading-snug text-[#F8F5F0]">
						"El estilo no es solo apariencia, es actitud."
					</blockquote>
				</div>
			</div>

			<div className="h-full w-full max-w-lg flex-1 overflow-y-auto overscroll-contain">
				<div className="flex min-h-full items-center justify-center px-5 py-6 sm:px-8">
				<div className="w-full max-w-sm animate-fadeInUp">
					<Link
						to="/"
						className="mb-6 inline-flex items-center gap-2 text-sm text-[#A1A1AA] transition-colors hover:text-[#F8F5F0]"
					>
						<svg
							width="14"
							height="14"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path d="M19 12H5M12 19l-7-7 7-7" />
						</svg>
						Volver al inicio
					</Link>

					<div className="mb-6 flex items-center gap-2 lg:hidden">
						<div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#C9A96E]">
							<span className="text-xs text-[#111111]">✂</span>
						</div>
						<span className="font-display text-lg font-semibold text-[#F8F5F0]">
							BarberFlow
						</span>
					</div>

					<h1 className="font-display text-3xl font-bold mb-2 text-[#F8F5F0]">
						{title}
					</h1>
					<p className="mb-6 text-sm text-[#A1A1AA]">{subtitle}</p>

					{children}

					<p className="text-center text-sm mt-6 text-[#A1A1AA]">
						{footerQuestion}{" "}
						<Link to={footerActionTo} className="text-[#C9A96E] hover:underline">
							{footerActionLabel}
						</Link>
					</p>
				</div>
				</div>
			</div>
		</div>
	);
}
