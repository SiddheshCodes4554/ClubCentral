// FinalCTA.tsx
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export const FinalCTA = () => {
    return (
        <section className="py-32 bg-[#020617] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />

            <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight"
                >
                    Ready to lead <br /> the <span className="text-blue-500">next gen?</span>
                </motion.h2>

                <p className="text-xl text-slate-400 mb-10">
                    Join 500+ forward-thinking student clubs using ClubCentral today.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/signup">
                        <Button className="h-14 px-10 text-lg rounded-full bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all">
                            Get Started Free
                        </Button>
                    </Link>
                    <Link href="/contact">
                        <Button variant="ghost" className="h-14 px-10 text-lg rounded-full text-white hover:bg-white/10">
                            Contact Sales
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};