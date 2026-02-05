import React, { useState, useEffect } from 'react';
import { Bug, X, Send, MessageSquareText, AlertCircle, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BugReport = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState('bug'); // bug, improvement
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Simple Anti-Spam (Math Captcha + Honeypot)
    const [captcha, setCaptcha] = useState({ q: '', a: 0 });
    const [userCaptcha, setUserCaptcha] = useState('');
    const [honeypot, setHoneypot] = useState('');

    const generateCaptcha = () => {
        const n1 = Math.floor(Math.random() * 10) + 1;
        const n2 = Math.floor(Math.random() * 10) + 1;
        setCaptcha({ q: `${n1} + ${n2}`, a: n1 + n2 });
        setUserCaptcha('');
    };

    useEffect(() => {
        if (isOpen) {
            generateCaptcha();
            setHoneypot('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Anti-spam checks
        if (honeypot) return; // Silent fail for bots
        if (parseInt(userCaptcha) !== captcha.a) {
            alert("Pogrešan odgovor na sigurnosno pitanje.");
            generateCaptcha();
            return;
        }

        if (!message || submitting) return;

        setSubmitting(true);
        try {
            const reportData = {
                type,
                message,
                email: email || 'anonymous',
                url: window.location.href,
                userAgent: navigator.userAgent,
                status: 'new',
                createdAt: serverTimestamp()
            };

            // 1. Save to Firestore
            await addDoc(collection(db, "reports"), reportData);

            // 2. Send Telegram Notification
            const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
            const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

            if (token && chatId) {
                const telegramMessage = `🚨 *NOVA PRIJAVA (${type === 'bug' ? 'GREŠKA' : 'UNAPRIJEĐENJE'})*\n\n` +
                    `📝 *Poruka:* ${message}\n` +
                    `📧 *Email:* ${email || 'anonymous'}\n` +
                    `🔗 *URL:* ${window.location.href}\n` +
                    `🕒 *Vrijeme:* ${new Date().toLocaleString('bs-BA')}`;

                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: telegramMessage,
                        parse_mode: 'Markdown'
                    })
                });
            }

            setSuccess(true);
            setMessage('');
            setEmail('');
            setTimeout(() => {
                setSuccess(false);
                setIsOpen(false);
            }, 3000);
        } catch (err) {
            console.error("Error submitting report:", err);
            alert("Greška pri slanju prijave. Pokušajte ponovo.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[9999] bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-3 group border border-white/10 dark:border-slate-800"
            >
                <Bug size={24} className="group-hover:rotate-12 transition-transform" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-black uppercase text-[10px] tracking-widest">
                    Prijavi Grešku
                </span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-lg text-white">
                                    <MessageSquareText size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase italic tracking-tighter text-lg text-slate-900 dark:text-white leading-none">Prijavi Problem</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Hvala vam što pomažete u razvoju platforme</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            {success ? (
                                <div className="text-center py-10 space-y-4 animate-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                                        <Sparkles size={40} />
                                    </div>
                                    <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Uspješno Poslano!</h4>
                                    <p className="text-sm text-slate-500 font-medium">Hvala vam na povratnim informacijama. Naš tim će istražiti prijavu što je prije moguće.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Type Selection */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setType('bug')}
                                            className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${type === 'bug' ? 'bg-red-50 dark:bg-red-500/10 border-red-500 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                        >
                                            <AlertCircle size={18} /> Greška
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setType('improvement')}
                                            className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${type === 'improvement' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'}`}
                                        >
                                            <Sparkles size={18} /> Ideja
                                        </button>
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Opis Problema / Ideje</label>
                                        <textarea 
                                            required
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={4}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                                            placeholder={type === 'bug' ? "Opišite šta se desilo i kako da reproduciramo grešku..." : "Opišite vašu ideju za unaprijeđenje platforme..."}
                                        />
                                    </div>

                                    {/* Email (Optional) */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Vaš Email (Opcionalno)</label>
                                        <input 
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                            placeholder="email@example.com"
                                        />
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider px-1">
                                            Ostavite email ako želite da vas kontaktiramo povodom ove prijave.
                                        </p>
                                    </div>

                                    {/* Anti-Spam Section */}
                                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                                        {/* Honeypot (Hidden) */}
                                        <input 
                                            type="text" 
                                            value={honeypot} 
                                            onChange={(e) => setHoneypot(e.target.value)} 
                                            className="hidden" 
                                            tabIndex="-1" 
                                            autoComplete="off" 
                                        />
                                        
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <ShieldCheck size={12} className="text-emerald-500" /> Sigurnosna provjera
                                                </label>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    Koliko je <span className="text-blue-600 dark:text-blue-400 font-black">{captcha.q}</span>?
                                                </p>
                                            </div>
                                            <input 
                                                required
                                                type="number"
                                                value={userCaptcha}
                                                onChange={(e) => setUserCaptcha(e.target.value)}
                                                className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center text-slate-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                                placeholder="?"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={submitting || !message}
                                        className="w-full bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Slanje...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Pošalji Prijavu
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BugReport;
