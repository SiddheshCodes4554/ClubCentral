// DashboardShowcase.tsx
import { motion } from "framer-motion";
import { LayoutDashboard, Calendar, CheckSquare, DollarSign, Share2, UserCheck, Network, BarChart3 } from "lucide-react";

export const DashboardShowcase = () => {
    const modules = [
        { name: "Overview", icon: LayoutDashboard, color: "text-blue-400", border: "group-hover:border-blue-500/50" },
        { name: "Events", icon: Calendar, color: "text-purple-400", border: "group-hover:border-purple-500/50" },
        { name: "Tasks", icon: CheckSquare, color: "text-emerald-400", border: "group-hover:border-emerald-500/50" },
        { name: "Finance", icon: DollarSign, color: "text-amber-400", border: "group-hover:border-amber-500/50" },
        { name: "Socials", icon: Share2, color: "text-pink-400", border: "group-hover:border-pink-500/50" },
        { name: "Members", icon: UserCheck, color: "text-cyan-400", border: "group-hover:border-cyan-500/50" },
        { name: "Hierarchy", icon: Network, color: "text-indigo-400", border: "group-hover:border-indigo-500/50" },
        { name: "Analytics", icon: BarChart3, color: "text-rose-400", border: "group-hover:border-rose-500/50" }
    ];

    return (
        <section className="py-24 bg-[#020617] border-y border-white/5">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Your Command Center
                    </h2>
                    <p className="text-lg text-slate-400">
                        Every tool integrated into one seamless operating system.
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {modules.map((module, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            className={`group bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 cursor-pointer transition-all duration-300 ${module.border}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <module.icon className={`w-6 h-6 ${module.color}`} />
                                </div>
                                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                                    {module.name}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};