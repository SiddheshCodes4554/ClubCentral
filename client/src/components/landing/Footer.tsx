// Footer.tsx
import { Link } from "wouter";
import { Github, Twitter, Linkedin, Heart } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="bg-[#020617] border-t border-white/10 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-16">

                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="font-bold text-white text-lg">C</span>
                            </div>
                            <span className="text-xl font-bold text-white">ClubCentral</span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            The modern operating system for student organizations. Built for speed, transparency, and continuity.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-white mb-4">Product</h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Integrations</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Changelog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-white mb-4">Company</h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-white mb-4">Legal</h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} ClubCentral Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Made with</span>
                        <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
                        <span>for students.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};