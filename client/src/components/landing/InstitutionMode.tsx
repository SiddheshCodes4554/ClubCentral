// InstitutionMode.tsx
import { motion } from "framer-motion";
import { Building2, ChevronRight, Users2, LayoutTemplate } from "lucide-react";

export const InstitutionMode = () => {
    return (
        <section className="py-32 bg-slate-950 border-t border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium">
                        <Building2 className="w-4 h-4" />
                        For Institutions
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                        Total visibility across campus.
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Standardize workflows for every club. Assign faculty advisors, audit finances, and ensure smooth leadership transitions year over year.
                    </p>

                    <div className="grid gap-4">
                        {[
                            "Centralized Governance",
                            "Real-time Oversight",
                            "Standardized Workflows"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 text-purple-400" />
                                </div>
                                <span className="text-slate-200 font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Diagram Side */}
                <div className="relative">
                    <div className="relative bg-slate-900 rounded-3xl border border-white/10 p-8 md:p-12 overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

                        <div className="relative space-y-8 z-10">
                            {/* Top Node */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="mx-auto w-64 bg-slate-800 rounded-2xl p-6 border border-purple-500/30 shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)] text-center"
                            >
                                <Building2 className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                                <h3 className="font-bold text-white">University Admin</h3>
                            </motion.div>

                            {/* Connector */}
                            <div className="h-8 w-px bg-gradient-to-b from-purple-500/50 to-blue-500/50 mx-auto" />

                            {/* Middle Node */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mx-auto w-64 bg-slate-800 rounded-2xl p-6 border border-blue-500/30 text-center"
                            >
                                <Users2 className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                                <h3 className="font-bold text-white">Student Council</h3>
                            </motion.div>

                            {/* Connector */}
                            <div className="h-8 w-px bg-gradient-to-b from-blue-500/50 to-slate-500/50 mx-auto" />

                            {/* Bottom Node */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mx-auto w-64 bg-slate-800 rounded-2xl p-6 border border-slate-600/30 text-center opacity-80"
                            >
                                <LayoutTemplate className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                                <h3 className="font-bold text-slate-200">Individual Clubs</h3>
                            </motion.div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};