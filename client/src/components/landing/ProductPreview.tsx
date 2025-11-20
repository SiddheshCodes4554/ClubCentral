// client/src/components/landing/ProductPreview.tsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Calendar, DollarSign, Users, ChevronRight, Zap } from "lucide-react";
import { imageConfig } from "./constants";

// Define the features with distinct colors/themes
const features = [
    {
        id: 0,
        title: "Command Center",
        description: "The pulse of your organization. Get a bird's eye view of active events, pending approvals, and club health metrics in one unified interface.",
        icon: LayoutDashboard,
        color: "bg-blue-500",
        gradient: "from-blue-500/20 to-blue-600/5",
        borderColor: "group-hover:border-blue-500/50",
        textColor: "text-blue-400"
    },
    {
        id: 1,
        title: "Event Management",
        description: "From brainstorming to post-event analysis. Track RSVPs, manage check-ins via QR code, and automate attendee certificates.",
        icon: Calendar,
        color: "bg-purple-500",
        gradient: "from-purple-500/20 to-purple-600/5",
        borderColor: "group-hover:border-purple-500/50",
        textColor: "text-purple-400"
    },
    {
        id: 2,
        title: "Financial Suite",
        description: "Transparency built-in. Track every reimbursement, sponsorship inflow, and expense with institution-grade audit logs.",
        icon: DollarSign,
        color: "bg-emerald-500",
        gradient: "from-emerald-500/20 to-emerald-600/5",
        borderColor: "group-hover:border-emerald-500/50",
        textColor: "text-emerald-400"
    }
];

export const ProductPreview = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [progress, setProgress] = useState(0);

    // Auto-rotate tabs
    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((old) => {
                if (old >= 100) {
                    setActiveTab((prev) => (prev + 1) % features.length);
                    return 0;
                }
                return old + 1; // Adjust speed here (1% every X ms)
            });
        }, 50); // 50ms * 100 = 5 seconds per slide

        return () => clearInterval(timer);
    }, [activeTab]);

    // Reset progress when user manually clicks
    const handleTabClick = (index: number) => {
        setActiveTab(index);
        setProgress(0);
    };

    return (
        <section className="py-32 bg-[#020617] relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="mb-20 md:text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
                        <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                        <span className="text-sm font-medium text-slate-300">Built for Power Users</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                        One interface. <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                            Infinite possibilities.
                        </span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Switch perspectives instantly. Whether you're planning the next big hackathon or balancing the books, ClubCentral adapts to your role.
                    </p>
                </div>

                {/* --- MAIN CONTENT LAYOUT --- */}
                <div className="grid lg:grid-cols-12 gap-12 items-center">

                    {/* LEFT: Interactive Tabs */}
                    <div className="lg:col-span-5 space-y-4">
                        {features.map((feature, index) => {
                            const isActive = activeTab === index;
                            return (
                                <div
                                    key={feature.id}
                                    onClick={() => handleTabClick(index)}
                                    className={`group relative p-6 rounded-2xl cursor-pointer border transition-all duration-500 overflow-hidden ${isActive
                                            ? "bg-slate-800/40 border-white/10"
                                            : "bg-transparent border-transparent hover:bg-white/5"
                                        }`}
                                >
                                    {/* Progress Bar Background (Only active) */}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 h-1 bg-slate-700 w-full">
                                            <motion.div
                                                className={`h-full ${feature.color}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${isActive ? feature.color + " text-white" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
                                            }`}>
                                            <feature.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-bold mb-2 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                                                {feature.title}
                                            </h3>
                                            <p className={`text-sm leading-relaxed transition-colors ${isActive ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"}`}>
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* RIGHT: The "Screen" */}
                    <div className="lg:col-span-7 relative perspective-[1000px]">
                        <div className="relative rounded-2xl bg-slate-950 border border-white/10 shadow-2xl aspect-[4/3] md:aspect-[16/10] overflow-hidden group">

                            {/* Window Controls */}
                            <div className="absolute top-0 left-0 right-0 h-10 bg-slate-900/90 backdrop-blur-md border-b border-white/5 flex items-center px-4 z-20">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                                </div>
                            </div>

                            {/* Dynamic Image Switching */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="absolute inset-0 top-10 bg-slate-900"
                                >
                                    {/* We use the index to pick from your image array. Fallback to placeholder if array is short */}
                                    <img
                                        src={imageConfig.productImages[activeTab] || "/placeholder.png"}
                                        alt={features[activeTab].title}
                                        className="w-full h-full object-cover object-top"
                                    />

                                    {/* Inner Glow Overlay based on active feature color */}
                                    <div className={`absolute inset-0 bg-gradient-to-tr ${features[activeTab].gradient} opacity-20 pointer-events-none`} />
                                </motion.div>
                            </AnimatePresence>

                            {/* Glass Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-10" />
                        </div>

                        {/* Glow Behind the Device */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className={`absolute -inset-4 blur-3xl -z-10 rounded-full ${features[activeTab].color}`}
                            />
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </section>
    );
};