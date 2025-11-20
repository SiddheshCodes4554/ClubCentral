// FeatureGrid.tsx
import { motion } from "framer-motion";
import { Calendar, CheckSquare, Users, Wallet, Share2, ShieldCheck } from "lucide-react";

const FeatureCard = ({ title, description, icon: Icon, className, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className={`group relative overflow-hidden rounded-3xl bg-slate-900 border border-white/5 p-8 hover:border-white/10 transition-all duration-500 ${className}`}
    >
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/0 blur-2xl group-hover:from-blue-500/40 transition-all duration-500" />

        <div className="relative z-10">
            <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 text-blue-400 group-hover:text-white group-hover:bg-blue-500 transition-colors duration-300">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

export const FeatureGrid = () => {
    return (
        <section className="py-32 bg-[#020617] relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Everything you need. <br />
                        <span className="text-slate-500">Nothing you don't.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Large Item 1 */}
                    <FeatureCard
                        className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800"
                        title="Smart Event Management"
                        description="Create events, manage RSVPs via QR codes, and track attendance stats in real-time. Automatically generate certificates for attendees."
                        icon={Calendar}
                        delay={0.1}
                    />
                    {/* Small Item 1 */}
                    <FeatureCard
                        title="Finance & Budgeting"
                        description="Track every penny. Manage sponsorships, reimbursements, and create transparent financial reports."
                        icon={Wallet}
                        delay={0.2}
                    />
                    {/* Small Item 2 */}
                    <FeatureCard
                        title="Task Boards"
                        description="Kanban-style task management built specifically for club hierarchies and sub-teams."
                        icon={CheckSquare}
                        delay={0.3}
                    />
                    {/* Large Item 2 */}
                    <FeatureCard
                        className="md:col-span-2"
                        title="Team Hierarchy & Roles"
                        description="Define granular permissions for President, Treasurer, and Leads. Ensure data security and proper handover year over year."
                        icon={Users}
                        delay={0.4}
                    />
                    <FeatureCard
                        title="Social Automation"
                        description="Schedule posts for Instagram and LinkedIn directly from your club dashboard."
                        icon={Share2}
                        delay={0.5}
                    />
                    <FeatureCard
                        className="md:col-span-2"
                        title="Institutional Oversight"
                        description="For Deans and Faculty Advisors: Get a bird's eye view of all clubs on campus without micromanaging."
                        icon={ShieldCheck}
                        delay={0.6}
                    />
                </div>
            </div>
        </section>
    );
};