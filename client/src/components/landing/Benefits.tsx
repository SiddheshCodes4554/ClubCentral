// client/src/components/landing/Benefits.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Calendar,
    DollarSign,
    Building2,
    CheckCircle2,
    ArrowUpRight,
    Lock,
    BrainCircuit
} from "lucide-react";

// DATA SOURCE: Based strictly on README.md
const benefits = [
    {
        id: "01",
        title: "Member & Role Mastery",
        shortTitle: "Membership",
        description: "Streamline onboarding with unique club codes. Manage granularity with Role-Based Access Control (RBAC) for Presidents, VPs, and custom roles.",
        icon: Users,
        color: "bg-blue-500",
        textColor: "text-blue-400",
        gradient: "from-blue-500/20 to-blue-600/5",
        tags: ["Application Workflow", "Custom Roles", "Member Directory"]
    },
    {
        id: "02",
        title: "Event & AI Intelligence",
        shortTitle: "Events + AI",
        description: "Plan events with status tracking. Use the new AI Assistant to automatically break down complex events into actionable task lists.",
        icon: Calendar,
        color: "bg-purple-500",
        textColor: "text-purple-400",
        gradient: "from-purple-500/20 to-purple-600/5",
        tags: ["AI Task Generation", "Budget Planning", "Team Assignment"]
    },
    {
        id: "03",
        title: "Financial Integrity",
        shortTitle: "Finance",
        description: "Track income and expenses with strict approval workflows. Upload receipts, manage transaction statuses, and export reports for audits.",
        icon: DollarSign,
        color: "bg-emerald-500",
        textColor: "text-emerald-400",
        gradient: "from-emerald-500/20 to-emerald-600/5",
        tags: ["Approval Workflows", "Receipt Storage", "Export Data"]
    },
    {
        id: "04",
        title: "Institution Mode",
        shortTitle: "Institution",
        description: "A centralized dashboard for colleges. Manage multiple clubs, view aggregate analytics, and organize departments from a single view.",
        icon: Building2,
        color: "bg-orange-500",
        textColor: "text-orange-400",
        gradient: "from-orange-500/20 to-orange-600/5",
        tags: ["Multi-Club View", "Performance Index", "Dept Organization"]
    }
];

// --- CUSTOM VISUALS FOR EACH CARD ---

const MemberVisual = () => (
    <div className="w-full h-full p-4 flex flex-col gap-3">
        {/* Mock User List */}
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600" />
                <div className="flex-1">
                    <div className="h-2 w-24 bg-slate-700 rounded mb-1.5" />
                    <div className="h-1.5 w-16 bg-slate-800 rounded" />
                </div>
                {i === 1 && <Lock className="w-3 h-3 text-blue-400" />}
            </div>
        ))}
        {/* RBAC Badge */}
        <div className="mt-auto self-start px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-mono">
            ACCESS_LEVEL: ADMIN
        </div>
    </div>
);

const EventVisual = () => (
    <div className="w-full h-full p-4 relative overflow-hidden">
        {/* AI Pulse */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />

        <div className="flex items-center gap-2 mb-4 text-purple-300">
            <BrainCircuit className="w-4 h-4" />
            <span className="text-xs font-bold">AI TASK GENERATOR</span>
        </div>

        <div className="space-y-2">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-purple-500' : 'bg-slate-700'}`} />
                    <div className="h-1.5 w-full bg-slate-800 rounded overflow-hidden">
                        {i === 1 && <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} className="h-full bg-purple-500" />}
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="text-[10px] text-purple-300 mb-1">GENERATING TASKS...</div>
            <div className="flex gap-1">
                <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    </div>
);

const FinanceVisual = () => (
    <div className="w-full h-full p-4 flex flex-col justify-end">
        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-32 mb-2">
            {[40, 70, 50, 90, 60].map((height, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.1 }}
                    className={`w-full rounded-t-sm ${i === 3 ? 'bg-emerald-500' : 'bg-slate-800'}`}
                />
            ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="text-xs text-slate-400">Total Balance</div>
            <div className="text-sm font-bold text-emerald-400">$12,450</div>
        </div>
    </div>
);

const InstitutionVisual = () => (
    <div className="w-full h-full p-4 relative">
        {/* Network Graph */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-32 h-32">
                {/* Center Node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.4)] z-10" />

                {/* Satellite Nodes */}
                {[0, 90, 180, 270].map((deg, i) => (
                    <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-24 h-0.5 bg-gradient-to-r from-orange-500/50 to-transparent origin-left"
                        style={{ rotate: `${deg + 45}deg` }}
                    >
                        <div className="absolute right-0 -top-1.5 w-3 h-3 bg-slate-700 border border-orange-500/30 rounded-full" />
                    </motion.div>
                ))}
            </div>
        </div>
        <div className="absolute bottom-4 left-4">
            <div className="text-[10px] font-bold text-orange-400 tracking-widest">MULTI-TENANT</div>
        </div>
    </div>
);

export const Benefits = () => {
    const [activeId, setActiveId] = useState("01");

    return (
        <section id="benefits" className="py-32 bg-[#020617] relative overflow-hidden">

            {/* Background Textures */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="mb-16 md:flex items-end justify-between">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Everything is <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
                                under control.
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400">
                            From individual member roles to university-wide analytics.
                        </p>
                    </div>
                    <div className="hidden md:block text-right">
                        <div className="text-sm font-mono text-slate-500">SYSTEM STATUS</div>
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            OPERATIONAL
                        </div>
                    </div>
                </div>

                {/* --- ACCORDION DECK --- */}
                <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[500px]">
                    {benefits.map((benefit) => {
                        const isActive = activeId === benefit.id;

                        return (
                            <motion.div
                                key={benefit.id}
                                layout
                                onClick={() => setActiveId(benefit.id)}
                                className={`relative rounded-3xl overflow-hidden cursor-pointer border transition-colors duration-500 ease-out
                                    ${isActive
                                        ? "flex-[3] bg-slate-900 border-white/10"
                                        : "flex-[1] bg-slate-950 border-transparent hover:border-white/5"
                                    }
                                `}
                            >
                                {/* INACTIVE STATE (Vertical Strip) */}
                                {!isActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-4 opacity-60 hover:opacity-100 transition-opacity">
                                        <div className={`w-10 h-10 rounded-full ${benefit.color} bg-opacity-20 flex items-center justify-center`}>
                                            <benefit.icon className={`w-5 h-5 ${benefit.textColor}`} />
                                        </div>
                                        <div className="lg:[writing-mode:vertical-rl] lg:rotate-180 text-lg font-bold text-slate-400 tracking-wide whitespace-nowrap">
                                            {benefit.shortTitle}
                                        </div>
                                        <div className="mt-auto text-xs font-mono text-slate-600">{benefit.id}</div>
                                    </div>
                                )}

                                {/* ACTIVE STATE (Expanded Content) */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.4, delay: 0.1 }}
                                            className="relative h-full p-8 flex flex-col justify-between z-10"
                                        >
                                            {/* Gradient Background */}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-10`} />

                                            {/* Header */}
                                            <div className="relative">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-10 h-10 rounded-xl ${benefit.color} bg-opacity-20 flex items-center justify-center`}>
                                                        <benefit.icon className={`w-5 h-5 ${benefit.textColor}`} />
                                                    </div>
                                                    <span className="text-sm font-mono text-slate-500">FEATURE {benefit.id}</span>
                                                </div>
                                                <h3 className="text-3xl font-bold text-white mb-4">{benefit.title}</h3>
                                                <p className="text-lg text-slate-400 leading-relaxed max-w-md">
                                                    {benefit.description}
                                                </p>
                                            </div>

                                            {/* Dynamic Visual Container */}
                                            <div className="mt-8 flex-1 w-full max-w-md bg-slate-950/50 rounded-xl border border-white/5 backdrop-blur-sm overflow-hidden">
                                                {benefit.id === "01" && <MemberVisual />}
                                                {benefit.id === "02" && <EventVisual />}
                                                {benefit.id === "03" && <FinanceVisual />}
                                                {benefit.id === "04" && <InstitutionVisual />}
                                            </div>

                                            {/* Tags Footer */}
                                            <div className="mt-8 flex flex-wrap gap-2 relative">
                                                {benefit.tags.map((tag, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-slate-300 flex items-center gap-1.5">
                                                        <CheckCircle2 className={`w-3 h-3 ${benefit.textColor}`} />
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};