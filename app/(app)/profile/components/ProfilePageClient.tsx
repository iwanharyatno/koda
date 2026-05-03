'use client';

import { useState, useTransition } from "react";
import KodaAvatar from "@/components/koda/KodaAvatar";
import { updateProfile } from "../actions";

export default function ProfilePageClient({ initialUser = {} }: { initialUser: any }) {
    const [isPending, startTransition] = useTransition();

    // State aligned with the new Zod schema
    const [name, setName] = useState(initialUser.name || "");
    const [productiveHours, setProductiveHours] = useState<string[]>(initialUser.productiveHours || []);
    const [recurringBlocks, setRecurringBlocks] = useState<any[]>(initialUser.recurringBlocks || []);

    // Handlers for Productive Hours (Array of strings)
    const handleAddHourWindow = () => {
        setProductiveHours([...productiveHours, ""]);
    };

    const handleRemoveHourWindow = (index: number) => {
        setProductiveHours(productiveHours.filter((_, i) => i !== index));
    };

    // Handlers for Recurring Blocks (Array of {day, block})
    const handleAddBlock = () => {
        setRecurringBlocks([...recurringBlocks, { day: "Monday", block: "" }]);
    };

    const handleRemoveBlock = (index: number) => {
        setRecurringBlocks(recurringBlocks.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        startTransition(async () => {
            await updateProfile({ name, productiveHours, recurringBlocks });
            alert("Profile updated! Koda will remember this for next week.");
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-500">
            <header className="flex items-center gap-6 mb-12">
                <KodaAvatar mood="steady" className="scale-125" />
                <div>
                    <h1 className="text-3xl font-outfit font-bold text-koda-charcoal">Profile Settings</h1>
                    <p className="text-koda-bear font-medium text-sm">Help Koda understand your rhythm.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info & Productive Hours */}
                <section className="space-y-6">
                    <div className="border-card p-6">
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-widest text-koda-bear">Basic Info</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-koda-charcoal mb-1">Your Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white border border-koda-border rounded-lg px-4 py-2 text-sm focus:border-koda-bear outline-none transition-all"
                                />
                            </div>

                            <div className="pt-4 border-t border-koda-border">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-xs font-bold text-koda-charcoal uppercase tracking-widest">Productive Windows</label>
                                    <button onClick={handleAddHourWindow} className="text-[10px] font-bold text-koda-bear hover:underline">+ Add Window</button>
                                </div>
                                <div className="space-y-2">
                                    {productiveHours.map((window, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={window}
                                                placeholder="e.g., 9 AM - 2 PM or Late at night"
                                                onChange={(e) => {
                                                    const newHours = [...productiveHours];
                                                    newHours[idx] = e.target.value;
                                                    setProductiveHours(newHours);
                                                }}
                                                className="flex-1 bg-white border border-koda-border rounded-lg px-3 py-2 text-sm focus:border-koda-bear outline-none"
                                            />
                                            <button onClick={() => handleRemoveHourWindow(idx)} className="text-status-skipped px-2 text-sm">×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Weekly Constraints */}
                <section className="border-card p-6 flex flex-col h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-koda-bear">Weekly Constraints</h3>
                        <button onClick={handleAddBlock} className="text-xs font-bold text-koda-charcoal hover:text-koda-bear">+ Add Block</button>
                    </div>

                    <div className="space-y-3">
                        {recurringBlocks.length === 0 && (
                            <p className="text-sm text-center text-koda-bear/50 py-8 italic">No recurring constraints added yet.</p>
                        )}
                        {recurringBlocks.map((block, idx) => (
                            <div key={idx} className="p-3 bg-white border border-koda-border rounded-lg group">
                                <div className="flex gap-2 mb-2">
                                    <select
                                        value={block.day}
                                        onChange={(e) => {
                                            const newBlocks = [...recurringBlocks];
                                            newBlocks[idx].day = e.target.value;
                                            setRecurringBlocks(newBlocks);
                                        }}
                                        className="text-[10px] uppercase font-bold bg-koda-bear/10 text-koda-bear rounded px-1 outline-none h-6"
                                    >
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => handleRemoveBlock(idx)} className="ml-auto opacity-0 group-hover:opacity-100 text-status-skipped text-xs font-bold transition-opacity">Remove</button>
                                </div>
                                <input
                                    type="text"
                                    value={block.block}
                                    placeholder="e.g., Morning Classes or 3 PM Group Meeting"
                                    onChange={(e) => {
                                        const newBlocks = [...recurringBlocks];
                                        newBlocks[idx].block = e.target.value;
                                        setRecurringBlocks(newBlocks);
                                    }}
                                    className="w-full text-sm font-bold bg-transparent outline-none border-b border-transparent focus:border-koda-bear py-1"
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="mt-6">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="w-full bg-koda-bear text-white font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-sm disabled:opacity-50"
                >
                    {isPending ? "Syncing..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}