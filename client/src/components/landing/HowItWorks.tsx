// HowItWorks.tsx
import { motion } from "framer-motion";

export const HowItWorks = () => {
    const steps = [
        { num: "01", title: "Onboard", desc: "Register your club and invite your core council members via email." },
        { num: "02", title: "Structure", desc: "Set up your departments, assign roles, and allocate budget caps." },
        { num: "03", title: "Execute", desc: "Launch events, manage tasks, and track your club's growth." },
    ];

    return (
        <section className="py-32 bg-slate-950 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Get setup in <span className="text-blue-500">minutes</span>.
                    </h2>
                </div>

                <div className="relative grid md:grid-cols-3 gap-8">
                    {/* Connecting Line */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-800">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        />
                    </div>

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className="relative pt-8"
                        >
                            <div className="relative z-10 w-10 h-10 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center text-white font-bold mb-6 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                                {i + 1}
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-slate-400">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};