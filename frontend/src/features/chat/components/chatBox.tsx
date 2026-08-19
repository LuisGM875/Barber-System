import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import type { AuthUser } from "../../auth/types/authTypes";
import { getConversations, getMessages, getMyConversation, sendMessage } from "../services/chatService";
import type { ChatConversation, ChatMessage } from "../types/messageTypes";

const API_URL = "http://localhost:8080";

export default function ChatBox({ user }: { user: AuthUser }) {
    const isAdmin = user.role?.trim().toUpperCase() === "ADMIN";
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const messagesRef = useRef<HTMLDivElement | null>(null);

    const scrollToLatest = (behavior: ScrollBehavior = "auto") => {
        const container = messagesRef.current;
        if (!container) return;
        window.requestAnimationFrame(() => {
            container.scrollTo({ top: container.scrollHeight, behavior });
        });
    };

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                if (!isAdmin) await getMyConversation();
                const items = await getConversations();
                if (!active) return;
                setConversations(items);
                setSelectedId((current) => current ?? items[0]?.id ?? null);
            } catch (err) { if (active) setError(err instanceof Error ? err.message : "No se pudieron cargar las conversaciones"); }
        };
        load();
        const timer = window.setInterval(load, 5000);
        return () => { active = false; window.clearInterval(timer); };
    }, [isAdmin]);

    useEffect(() => {
        if (!selectedId) { setMessages([]); return; }
        let active = true;
        const load = () => getMessages(selectedId).then((items) => { if (active) setMessages(items); }).catch((err) => { if (active) setError(err instanceof Error ? err.message : "No se pudieron cargar los mensajes"); });
        load();
        const timer = window.setInterval(load, 3000);
        return () => { active = false; window.clearInterval(timer); };
    }, [selectedId]);

    useEffect(() => {
        scrollToLatest();
    }, [messages]);

    const selected = conversations.find((item) => item.id === selectedId);
    const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; if (!file) return;
        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setError("Selecciona una imagen válida de máximo 5 MB."); return; }
        setImageFile(file); setImagePreview(URL.createObjectURL(file)); setError(null);
    };
    const submit = async () => {
        if (!selectedId || (!content.trim() && !imageFile)) return;
        setSending(true); setError(null);
        try { const created = await sendMessage(selectedId, content, imageFile); setMessages((current) => [...current, created]); setContent(""); setImageFile(null); setImagePreview(null); window.setTimeout(() => scrollToLatest("smooth"), 50); }
        catch (err) { setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje"); }
        finally { setSending(false); }
    };

    return <div className={`${isAdmin ? "grid md:grid-cols-[280px_minmax(0,1fr)]" : "flex"} h-[calc(100vh-250px)] min-h-[500px] max-h-[680px] overflow-hidden rounded-2xl border border-white/[.06] bg-[#1C1C1C]`}>
        {isAdmin && <aside className="border-b border-white/[.06] bg-[#151515] md:border-b-0 md:border-r"><div className="border-b border-white/[.06] p-4"><h2 className="font-display text-lg font-semibold">Conversaciones</h2><p className="mt-1 text-xs text-zinc-500">{conversations.length} clientes</p></div><div className="max-h-52 overflow-auto md:max-h-[560px]">{conversations.map((conversation) => <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className="flex w-full items-center gap-3 border-b border-white/[.04] p-4 text-left" style={{ backgroundColor: selectedId === conversation.id ? "rgba(201,169,110,.1)" : "transparent" }}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C9A96E] font-semibold text-black">{conversation.clientName?.[0]?.toUpperCase() || "C"}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{conversation.clientName || "Cliente"}</p><p className="truncate text-xs text-zinc-500">{conversation.lastMessage || conversation.clientEmail}</p></div>{conversation.unreadCount > 0 && <span className="rounded-full bg-[#C9A96E] px-2 py-0.5 text-xs font-bold text-black">{conversation.unreadCount}</span>}</button>)}</div></aside>}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"><header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[.06] px-5"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C9A96E] font-bold text-black">{isAdmin ? selected?.clientName?.[0]?.toUpperCase() || "C" : "B"}</div><div><p className="text-sm font-semibold">{isAdmin ? selected?.clientName || "Selecciona un cliente" : "BarberFlow Studio"}</p><p className="text-xs text-green-400">Chat interno</p></div></header>
            <div ref={messagesRef} className="min-h-0 flex-1 space-y-3 overflow-y-scroll overscroll-contain bg-[#111111] p-5">{messages.length === 0 && <p className="py-20 text-center text-sm text-zinc-500">Aún no hay mensajes. Inicia la conversación.</p>}{messages.map((message) => { const mine = isAdmin ? message.senderId !== selected?.clientId : message.senderId === user.id; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className="max-w-[82%] rounded-2xl px-3 py-2 text-sm" style={{ backgroundColor: mine ? "#C9A96E" : "#27272A", color: mine ? "#111" : "#F8F5F0" }}>{message.image && <img src={`${API_URL}${message.image}`} alt="Imagen enviada" onLoad={() => scrollToLatest()} className="mb-2 max-h-72 max-w-full rounded-xl object-cover" />}{message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}<div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-65"><span>{new Date(message.timestamp).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>{mine && <span>{message.isRead ? "✓✓ Leído" : "✓ Enviado"}</span>}</div></div></div>; })}</div>
            {imagePreview && <div className="relative border-t border-white/[.06] px-4 pt-3"><img src={imagePreview} alt="Imagen por enviar" className="h-20 w-20 rounded-xl object-cover" /><button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute left-[76px] top-1 rounded-full bg-red-500 p-1 text-white"><X size={13} /></button></div>}
            {error && <p className="px-4 pt-2 text-xs text-red-300">{error}</p>}
            <footer className="flex shrink-0 items-end gap-2 border-t border-white/[.06] p-4"><label className="cursor-pointer rounded-xl p-3 text-zinc-400 hover:bg-white/5"><ImagePlus size={20} /><input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" onChange={handleImage} className="hidden" /></label><textarea rows={1} maxLength={2000} value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder="Escribe un mensaje..." disabled={!selectedId} className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-white/10 bg-[#27272A] px-4 py-3 text-sm outline-none focus:border-[#C9A96E]" /><button onClick={submit} disabled={sending || !selectedId || (!content.trim() && !imageFile)} className="rounded-xl bg-[#C9A96E] p-3 text-black disabled:opacity-40"><Send size={20} /></button></footer>
        </div>
    </div>;
}
