// Navbar.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Menu, X, Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = [
        { label: "Features", href: "#features" },
        { label: "Workflow", href: "#how-it-works" },
        { label: "Benefits", href: "#benefits" }
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-6 inset-x-0 z-50 mx-auto max-w-5xl px-6"
            >
                <div className="relative flex items-center justify-between h-14 px-6 rounded-full bg-slate-950/70 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                            <Sparkles className="w-4 h-4 text-white fill-white/20" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">
                            Club<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Central</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-300"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login">
                            <span className="text-sm font-medium text-slate-300 hover:text-white cursor-pointer transition-colors">Login</span>
                        </Link>
                        <Link href="/signup">
                            <Button className="h-8 px-4 text-xs font-semibold rounded-full bg-white text-slate-950 hover:bg-blue-50 transition-all hover:scale-105 active:scale-95">
                                Get Started
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white">
                        {mobileOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-x-4 top-24 z-50 rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl md:hidden"
                    >
                        <div className="flex flex-col gap-4">
                            {navItems.map((item) => (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center justify-between text-lg font-medium text-slate-300"
                                >
                                    {item.label}
                                    <ChevronRight className="w-4 h-4 opacity-50" />
                                </a>
                            ))}
                            <div className="h-px bg-white/10 my-2" />
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                                Get Started Now
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};