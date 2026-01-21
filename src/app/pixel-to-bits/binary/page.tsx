'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Copy, Check } from 'lucide-react';
import Link from 'next/link';

interface PixelData {
    r: number;
    g: number;
    b: number;
}

const toBinary = (value: number): string => {
    return value.toString(2).padStart(8, '0');
};

export default function BinaryViewPage() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [binaryData, setBinaryData] = useState<PixelData[]>([]);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get image from IndexedDB
        const request = indexedDB.open('PixelToBitsDB', 1);
        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images');
            }
        };
        request.onsuccess = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            const tx = db.transaction('images', 'readonly');
            const store = tx.objectStore('images');
            const getRequest = store.get('currentImage');
            getRequest.onsuccess = () => {
                const storedImage = getRequest.result as string | undefined;
                if (storedImage) {
                    setImageUrl(storedImage);
                    processImage(storedImage);
                } else {
                    setLoading(false);
                }
            };
            getRequest.onerror = () => {
                setLoading(false);
            };
        };
        request.onerror = () => {
            setLoading(false);
        };
    }, []);

    const processImage = (url: string) => {
        const img = new window.Image();
        img.onload = () => {
            // Limit size for performance (larger for full binary view)
            const maxSize = 300;
            let width = img.width;
            let height = img.height;

            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }

            setImageDimensions({ width, height });

            // Extract pixel data
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const data = ctx.getImageData(0, 0, width, height);

                const pixels: PixelData[] = [];
                for (let i = 0; i < data.data.length; i += 4) {
                    pixels.push({
                        r: data.data[i],
                        g: data.data[i + 1],
                        b: data.data[i + 2],
                    });
                }
                setBinaryData(pixels);
            }
            setLoading(false);
        };
        img.src = url;
    };

    const getBinaryString = () => {
        return binaryData.map(p => toBinary(p.r) + toBinary(p.g) + toBinary(p.b)).join(' ');
    };

    const handleCopy = async () => {
        const binary = getBinaryString();
        await navigator.clipboard.writeText(binary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const binary = getBinaryString();
        const blob = new Blob([binary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'image_binary.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-green-400 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-pulse text-2xl">Processing image...</div>
                </div>
            </main>
        );
    }

    if (!imageUrl || binaryData.length === 0) {
        return (
            <main className="min-h-screen bg-black text-green-400 p-8">
                <div className="max-w-4xl mx-auto">
                    <Link href="/pixel-to-bits">
                        <Button variant="outline" className="mb-8 border-green-500/50 text-green-400 hover:bg-green-500/10">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pixel to Bits
                        </Button>
                    </Link>
                    <div className="text-center py-20">
                        <h1 className="text-3xl font-mono mb-4">No Image Data</h1>
                        <p className="text-green-400/70">Please upload an image first, then click "View Binary"</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-green-400 p-6 font-mono">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-6 pb-4 border-b border-green-500/30">
                    <div className="flex items-center gap-4">
                        <Link href="/pixel-to-bits">
                            <Button variant="outline" size="icon" className="border-green-500/50 text-green-400 hover:bg-green-500/10 rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Binary Representation</h1>
                            <p className="text-sm text-green-400/70">
                                {imageDimensions?.width} × {imageDimensions?.height} pixels = {binaryData.length * 24} bits
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCopy}
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                        >
                            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                            {copied ? 'Copied!' : 'Copy All'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDownload}
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                        >
                            <Download className="h-4 w-4 mr-2" /> Download
                        </Button>
                    </div>
                </header>

                {/* Binary Ocean */}
                <div className="bg-black/50 border border-green-500/30 rounded-xl p-6 overflow-auto max-h-[calc(100vh-200px)]">
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs leading-relaxed">
                        {binaryData.map((pixel, i) => (
                            <span
                                key={i}
                                className="hover:text-white transition-colors cursor-default"
                                style={{
                                    color: `rgb(${Math.max(100, pixel.r)}, ${Math.max(150, pixel.g)}, ${Math.max(100, pixel.b)})`,
                                }}
                                title={`Pixel ${i}: RGB(${pixel.r}, ${pixel.g}, ${pixel.b})`}
                            >
                                {toBinary(pixel.r)}{toBinary(pixel.g)}{toBinary(pixel.b)}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-4 text-center text-sm text-green-400/70">
                    <span className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                        Total: {binaryData.length} pixels • {(binaryData.length * 24).toLocaleString()} binary digits
                    </span>
                </div>
            </div>
        </main>
    );
}
