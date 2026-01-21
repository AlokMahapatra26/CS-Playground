'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lightbulb, Play, Pause } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function BinaryVisualization() {
    // State for 8 bits, initialized to 0 (false)
    // Index 0 is MSB (128), Index 7 is LSB (1)
    const [bits, setBits] = useState<boolean[]>(new Array(8).fill(false));
    const [autoMode, setAutoMode] = useState<'idle' | 'increment' | 'decrement'>('idle');

    const updateBitsFromValue = (val: number) => {
        return new Array(8).fill(false).map((_, i) => ((val >> (7 - i)) & 1) === 1);
    };

    React.useEffect(() => {
        if (autoMode === 'idle') return;

        const interval = setInterval(() => {
            setBits(prevBits => {
                const currentVal = prevBits.reduce((acc, bit, index) => acc + (bit ? Math.pow(2, 7 - index) : 0), 0);
                const nextVal = autoMode === 'increment'
                    ? (currentVal + 1) % 256
                    : (currentVal - 1 + 256) % 256;
                return updateBitsFromValue(nextVal);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [autoMode]);

    const toggleBit = (index: number) => {
        const newBits = [...bits];
        newBits[index] = !newBits[index];
        setBits(newBits);
    };

    // Calculate decimal value
    const decimalValue = bits.reduce((acc, bit, index) => {
        return acc + (bit ? Math.pow(2, 7 - index) : 0);
    }, 0);

    const updateBits = (val: number) => {
        const newBits = new Array(8).fill(false).map((_, i) => {
            return ((val >> (7 - i)) & 1) === 1;
        });
        setBits(newBits);
    };

    const increment = () => {
        const newValue = (decimalValue + 1) % 256;
        updateBits(newValue);
    };

    const decrement = () => {
        const newValue = (decimalValue - 1 + 256) % 256;
        updateBits(newValue);
    };

    const reset = () => {
        setBits(new Array(8).fill(false));
        setAutoMode('idle');
    };

    const toggleAuto = (mode: 'increment' | 'decrement') => {
        if (autoMode === mode) {
            setAutoMode('idle');
        } else {
            setAutoMode(mode);
        }
    };



    return (
        <main className="min-h-screen bg-background p-6 md:p-8 font-sans">
            <div className="mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between pb-6 border-b border-border/40">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-6">
                            <Link href="/">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="cursor-pointer h-10 w-10 rounded-full hover:bg-secondary/50 border-border/50"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-serif font-medium tracking-tight">Binary Explorer</h1>
                                <p className="text-base text-muted-foreground mt-1">Interactive 8-bit Byte Visualization</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Visualization Card */}
                <Card className="bg-card border border-border/50 rounded-[2rem] shadow-sm overflow-hidden">
                    <CardHeader className="bg-secondary/20 border-b border-border/40 p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-border/40">
                            <div className="text-center pb-4 md:pb-0">
                                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">Decimal</div>
                                <div className="text-6xl md:text-7xl font-serif font-bold text-foreground transition-all duration-300">
                                    {decimalValue}
                                </div>
                            </div>
                            <div className="text-center flex flex-col justify-center pt-4 md:pt-0">
                                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">Binary</div>
                                <div className="text-3xl md:text-4xl font-mono font-bold text-foreground/80 transition-all duration-300 h-20 flex items-center justify-center tracking-widest">
                                    {bits.map(b => b ? '1' : '0').join('')}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 md:p-12">
                        {/* Bits Container */}
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6">
                            {bits.map((isOn, index) => {
                                const power = 7 - index;
                                const value = Math.pow(2, power);

                                return (
                                    <div key={index} className="flex flex-col items-center gap-4 group">
                                        {/* Place Value Label */}
                                        <div className="text-xs font-mono text-muted-foreground font-medium">
                                            {value}
                                        </div>

                                        {/* The Switch */}
                                        <button
                                            onClick={() => toggleBit(index)}
                                            className={cn(
                                                "w-16 h-24 rounded-2xl flex flex-col items-center justify-end pb-4 transition-all duration-300 cursor-pointer relative overflow-hidden border-2 group",
                                                isOn
                                                    ? "bg-primary border-primary shadow-[0_0_30px_-5px_hsl(var(--primary))] -translate-y-1 scale-105"
                                                    : "bg-secondary/30 border-border hover:border-foreground/30 hover:bg-secondary/50"
                                            )}
                                        >
                                            {/* Glow effect for ON state */}
                                            {isOn && (
                                                <>
                                                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent mix-blend-overlay" />
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white/40 blur-xl rounded-full" />
                                                </>
                                            )}

                                            {/* Bulb Icon */}
                                            <Lightbulb
                                                className={cn(
                                                    "w-8 h-8 mb-2 transition-all duration-300",
                                                    isOn ? "text-white fill-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "text-muted-foreground/50"
                                                )}
                                                strokeWidth={2.5}
                                            />

                                            {/* Bit Value (0 or 1) */}
                                            <span className={cn(
                                                "text-2xl font-bold font-mono z-10",
                                                isOn ? "text-white drop-shadow-md" : "text-muted-foreground"
                                            )}>
                                                {isOn ? '1' : '0'}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Controls */}
                        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Button
                                    onClick={() => toggleAuto('decrement')}
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                        "h-12 w-12 rounded-full border border-border/50 cursor-pointer transition-all",
                                        autoMode === 'decrement' ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary/50"
                                    )}
                                    title="Auto Decrement (1s)"
                                >
                                    {autoMode === 'decrement' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 rotate-180" />}
                                </Button>
                                <Button onClick={decrement} variant="outline" className="flex-1 md:flex-none rounded-full px-6 h-12 text-base hover:bg-secondary/50 border border-border/50 cursor-pointer">
                                    Count Down (-1)
                                </Button>
                            </div>

                            <Button onClick={reset} variant="ghost" className="w-full md:w-auto rounded-full px-8 h-12 text-base text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-border/50 cursor-pointer">
                                Reset
                            </Button>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Button onClick={increment} className="flex-1 md:flex-none rounded-full px-6 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border border-primary/50 cursor-pointer">
                                    Count Up (+1)
                                </Button>
                                <Button
                                    onClick={() => toggleAuto('increment')}
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                        "h-12 w-12 rounded-full border border-border/50 cursor-pointer transition-all",
                                        autoMode === 'increment' ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary/50"
                                    )}
                                    title="Auto Increment (1s)"
                                >
                                    {autoMode === 'increment' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>

                        {/* Explanation Section */}
                        <div className="mt-12 p-6 bg-secondary/20 rounded-3xl border border-border/40">
                            <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                                How it works
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Computers store data using <strong>bits</strong> (binary digits), which can be either <strong>0</strong> (off) or <strong>1</strong> (on).
                                A group of 8 bits makes a <strong>byte</strong>. Each position represents a power of 2.
                                Toggle the switches above to see how binary combinations create decimal numbers!
                            </p>

                            <div className="mt-4 font-mono text-sm text-muted-foreground bg-background/50 p-4 rounded-xl border border-border/40 overflow-x-auto">
                                Calculation:
                                {bits.map((bit, i) => bit ? ` ${Math.pow(2, 7 - i)} ` : null).filter(Boolean).join('+') || ' 0'}
                                {' = '}
                                {decimalValue}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
