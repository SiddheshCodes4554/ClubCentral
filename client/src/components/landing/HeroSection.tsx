// client/src/components/landing/HeroSection.tsx

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Play } from "lucide-react";
import { imageConfig } from "./constants";

// --- 1. MAGNETIC BUTTON COMPONENT ---
const MagneticButton = ({ children, className = "", variant = "primary" }: any) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        x.set((e.clientX - centerX) * 0.3);
        y.set((e.clientY - centerY) * 0.3);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const baseStyles = "relative px-8 py-4 rounded-full font-bold text-lg transition-colors duration-300 flex items-center gap-2 overflow-hidden group";
    const variants: Record<string, string> = {
        primary: "bg-white text-black hover:bg-blue-50",
        outline: "border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: mouseXSpring, y: mouseYSpring }}
            className="inline-block"
        >
            <button className={`${baseStyles} ${variants[variant]} ${className}`}>
                {variant === 'primary' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out -z-10" />
                )}
                <span className="relative z-10 flex items-center gap-2">{children}</span>
            </button>
        </motion.div>
    );
};

// --- 2. HOLOGRAPHIC CARD COMPONENT ---
const HolographicCard = ({ image }: { image: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(x, [-0.5, 0.5], ["-15deg", "15deg"]);
    const glareX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
    const glareY = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        x.set(mouseX / width - 0.5);
        y.set(mouseY / height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative w-full max-w-[900px] aspect-[16/9] mx-auto cursor-pointer perspective-1000"
        >
            <div className="absolute inset-0 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
                <img
                    src={image || "/placeholder.png"}
                    alt="Dashboard"
                    className="w-full h-full object-fit"
                />
                <motion.div
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                                600px circle at ${glareX} ${glareY}, 
                                rgba(255, 255, 255, 0.15), 
                                transparent 80%
                            )
                        `
                    }}
                    className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-10 pointer-events-none" />
                <div className="absolute inset-0 border border-white/10 rounded-2xl z-30" />
            </div>
            <motion.div
                style={{ zIndex: -1, x: useTransform(x, [-0.5, 0.5], [-40, 40]), y: useTransform(y, [-0.5, 0.5], [-40, 40]) }}
                className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl"
            />
            <motion.div
                style={{ zIndex: -1, x: useTransform(x, [-0.5, 0.5], [40, -40]), y: useTransform(y, [-0.5, 0.5], [40, -40]) }}
                className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/30 rounded-full blur-2xl"
            />
        </motion.div>
    );
};

// --- 3. MAIN HERO SECTION ---
export const HeroSection = () => {
    return (
        <section className="relative min-h-screen w-full bg-[#020617] overflow-hidden pt-32 pb-20 flex flex-col items-center justify-center">

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                <div className="absolute left-1/4 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
                <div className="absolute right-1/4 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center">

                <div className="flex flex-col items-center justify-center mb-16 relative">

                    {/* FIX: Made text visible with fill + brighter stroke */}
                    <motion.h1
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="text-6xl md:text-8xl lg:text-[10rem] font-bold text-white/5 leading-[0.85] tracking-tighter select-none"
                        style={{
                            WebkitTextStroke: "2px rgba(255,255,255,0.6)",
                            paintOrder: "stroke fill"
                        }}
                    >
                        MANAGE
                    </motion.h1>

                    <div className="flex items-center gap-4 md:gap-8">
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="font-serif italic text-4xl md:text-6xl lg:text-8xl text-blue-400"
                        >
                            your
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="text-6xl md:text-8xl lg:text-[10rem] font-bold text-white leading-[0.85] tracking-tighter"
                        >
                            CLUB
                        </motion.h1>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 text-lg md:text-xl text-slate-400 max-w-xl mx-auto font-light tracking-wide"
                    >
                        THE OPERATING SYSTEM FOR STUDENT AMBITION
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 100, rotateX: 20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="mb-16 perspective-[1000px]"
                >
                    <HolographicCard image={imageConfig.heroDashboard} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex flex-wrap justify-center gap-6"
                >
                    {/* <Link href="/signup">
                        <MagneticButton variant="primary">
                            Start Free Trial <ArrowRight className="w-5 h-5" />
                        </MagneticButton>
                    </Link> */}

                    {/* <Link href="#how-it-works">
                        <MagneticButton variant="outline">
                            <Play className="w-4 h-4 fill-current" /> See How It Works
                        </MagneticButton>
                    </Link> */}
                </motion.div>

            </div>
        </section>
    );
};