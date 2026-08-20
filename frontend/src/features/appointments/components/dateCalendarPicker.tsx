import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DateCalendarPickerProps = {
	value: string;
	min: string;
	onChange: (value: string) => void;
};

const WEEK_DAYS = ["D", "L", "M", "M", "J", "V", "S"];

function parseLocalDate(value: string) {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year, month - 1, day, 12);
}

function formatDate(year: number, month: number, day: number) {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DateCalendarPicker({ value, min, onChange }: DateCalendarPickerProps) {
	const minimumDate = parseLocalDate(min);
	const selectedDate = parseLocalDate(value);
	const initialDate = selectedDate < minimumDate ? minimumDate : selectedDate;
	const [visibleMonth, setVisibleMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1, 12));

	const year = visibleMonth.getFullYear();
	const month = visibleMonth.getMonth();
	const firstDayIndex = new Date(year, month, 1, 12).getDay();
	const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
	const calendarDays = [
		...Array.from({ length: firstDayIndex }, () => null),
		...Array.from({ length: daysInMonth }, (_, index) => index + 1),
	];
	const minimumMonth = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), 1, 12);
	const previousDisabled = visibleMonth.getTime() <= minimumMonth.getTime();
	const monthLabel = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(visibleMonth);

	return (
		<div>
			<p className="mb-2 text-xs text-zinc-400">Nueva fecha</p>
			<div className="rounded-2xl border border-white/10 bg-[#0D0D0D] p-3">
				<div className="mb-3 flex items-center justify-between">
					<button type="button" disabled={previousDisabled} onClick={() => setVisibleMonth(new Date(year, month - 1, 1, 12))} aria-label="Mes anterior" className="rounded-lg border border-white/10 p-1.5 text-zinc-300 disabled:cursor-not-allowed disabled:opacity-25"><ChevronLeft size={18} /></button>
					<p className="text-sm font-semibold capitalize">{monthLabel}</p>
					<button type="button" onClick={() => setVisibleMonth(new Date(year, month + 1, 1, 12))} aria-label="Mes siguiente" className="rounded-lg border border-white/10 p-1.5 text-zinc-300"><ChevronRight size={18} /></button>
				</div>
				<div className="grid grid-cols-7 gap-1">{WEEK_DAYS.map((day, index) => <span key={`${day}-${index}`} className="pb-1 text-center text-[10px] font-semibold text-zinc-500">{day}</span>)}{calendarDays.map((day, index) => {
					if (!day) return <span key={`empty-${index}`} />;
					const date = formatDate(year, month, day);
					const disabled = date < min;
					const selected = date === value;
					return <button key={date} type="button" disabled={disabled} onClick={() => onChange(date)} className="aspect-square rounded-lg text-xs transition disabled:cursor-not-allowed disabled:text-zinc-700" style={{ backgroundColor: selected ? "#C9A96E" : "transparent", color: selected ? "#111111" : undefined, fontWeight: selected ? 700 : 400 }}>{day}</button>;
				})}</div>
			</div>
		</div>
	);
}
