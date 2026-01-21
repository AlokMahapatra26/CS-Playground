'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Image as ImageIcon, Grid3X3, ZoomIn, ZoomOut, X, Minus, Plus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface PixelData {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface SelectedPixel {
    x: number;
    y: number;
    color: PixelData;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert a number (0-255) to an 8-bit binary string
 */
const toBinary = (value: number): string => {
    return value.toString(2).padStart(8, '0');
};

/**
 * Format a large number with commas
 */
const formatNumber = (num: number): string => {
    return num.toLocaleString();
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PixelToBits() {
    // State
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageData, setImageData] = useState<ImageData | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [selectedPixel, setSelectedPixel] = useState<SelectedPixel | null>(null);
    const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(10);
    const [gridOffset, setGridOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lensPosition, setLensPosition] = useState<{ x: number; y: number; pixelX: number; pixelY: number } | null>(null);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ========================================================================
    // IMAGE HANDLING
    // ========================================================================

    const handleImageUpload = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target?.result as string;
            setImageUrl(url);

            // Load image to extract pixel data
            const img = new window.Image();
            img.onload = () => {
                // Limit size for performance (increase for larger images)
                const maxSize = 500;
                let width = img.width;
                let height = img.height;

                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                setImageDimensions({ width, height });

                // Draw to canvas and extract data
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const data = ctx.getImageData(0, 0, width, height);
                    setImageData(data);
                }
            };
            img.src = url;
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleImageUpload(file);
    }, [handleImageUpload]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };

    const resetImage = () => {
        setImageUrl(null);
        setImageData(null);
        setImageDimensions(null);
        setSelectedPixel(null);
        setHoveredPixel(null);
        setZoomLevel(10);
        setGridOffset({ x: 0, y: 0 });
    };

    // ========================================================================
    // PIXEL DATA ACCESS
    // ========================================================================

    const getPixelColor = useCallback((x: number, y: number): PixelData | null => {
        if (!imageData || !imageDimensions) return null;
        if (x < 0 || x >= imageDimensions.width || y < 0 || y >= imageDimensions.height) return null;

        const index = (y * imageDimensions.width + x) * 4;
        return {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
            a: imageData.data[index + 3],
        };
    }, [imageData, imageDimensions]);

    // ========================================================================
    // STATS CALCULATIONS
    // ========================================================================

    const totalPixels = imageDimensions ? imageDimensions.width * imageDimensions.height : 0;
    const totalBits = totalPixels * 24; // 8 bits per channel × 3 channels

    // ========================================================================
    // GRID NAVIGATION
    // ========================================================================

    const visiblePixels = zoomLevel;
    const pixelSize = imageDimensions ? Math.min(500 / visiblePixels, 60) : 20;

    // ========================================================================
    // RENDER FUNCTIONS
    // ========================================================================

    const renderUploadZone = () => (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-border/50 rounded-[2rem] bg-secondary/10 hover:bg-secondary/20 hover:border-primary/50 transition-all cursor-pointer group"
        >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Drop an image here</h3>
            <p className="text-muted-foreground">or click to browse</p>
            <p className="text-xs text-muted-foreground/70 mt-4">Supports JPG, PNG, GIF, WebP</p>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!imageDimensions) return;

        const img = e.currentTarget;
        const rect = img.getBoundingClientRect();

        // Calculate click position relative to the image
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Convert to pixel coordinates
        const pixelX = Math.floor((clickX / rect.width) * imageDimensions.width);
        const pixelY = Math.floor((clickY / rect.height) * imageDimensions.height);

        // Center the grid view on the clicked position
        const offsetX = Math.max(0, Math.min(imageDimensions.width - visiblePixels, pixelX - Math.floor(visiblePixels / 2)));
        const offsetY = Math.max(0, Math.min(imageDimensions.height - visiblePixels, pixelY - Math.floor(visiblePixels / 2)));

        setGridOffset({ x: offsetX, y: offsetY });
    };

    const handleImageMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!imageDimensions) return;

        const img = e.currentTarget;
        const rect = img.getBoundingClientRect();

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const pixelX = Math.floor((mouseX / rect.width) * imageDimensions.width);
        const pixelY = Math.floor((mouseY / rect.height) * imageDimensions.height);

        setLensPosition({ x: mouseX, y: mouseY, pixelX, pixelY });
    };

    const handleImageMouseLeave = () => {
        setLensPosition(null);
    };

    const renderImageView = () => {
        const lensSize = 120;
        const lensPixels = visiblePixels; // Match the grid view

        return (
            <div className="flex flex-col items-center gap-2">
                <div className="relative">
                    <img
                        src={imageUrl!}
                        alt="Uploaded"
                        onClick={handleImageClick}
                        onMouseMove={handleImageMouseMove}
                        onMouseLeave={handleImageMouseLeave}
                        className="max-w-full max-h-[280px] mx-auto rounded-2xl shadow-lg cursor-none"
                    />

                    {/* Lens */}
                    {lensPosition && imageDimensions && (
                        <div
                            className="absolute pointer-events-none border-2 border-white shadow-xl rounded-lg overflow-hidden"
                            style={{
                                width: lensSize,
                                height: lensSize,
                                left: lensPosition.x - lensSize / 2,
                                top: lensPosition.y - lensSize / 2,
                            }}
                        >
                            <div
                                className="grid w-full h-full bg-black"
                                style={{
                                    gridTemplateColumns: `repeat(${lensPixels}, 1fr)`,
                                }}
                            >
                                {Array.from({ length: lensPixels * lensPixels }).map((_, i) => {
                                    const lx = i % lensPixels - Math.floor(lensPixels / 2);
                                    const ly = Math.floor(i / lensPixels) - Math.floor(lensPixels / 2);
                                    const px = lensPosition.pixelX + lx;
                                    const py = lensPosition.pixelY + ly;
                                    const color = getPixelColor(px, py);

                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                backgroundColor: color
                                                    ? `rgb(${color.r}, ${color.g}, ${color.b})`
                                                    : 'transparent',
                                            }}
                                        />
                                    );
                                })}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 border border-white/80 rounded-sm" />
                            </div>
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    {imageDimensions?.width} × {imageDimensions?.height} px • Click to navigate
                </p>
            </div>
        );
    };

    const renderGridView = () => {
        if (!imageDimensions) return null;

        const startX = Math.max(0, gridOffset.x);
        const startY = Math.max(0, gridOffset.y);
        const endX = Math.min(imageDimensions.width, startX + visiblePixels);
        const endY = Math.min(imageDimensions.height, startY + visiblePixels);

        const canMoveUp = startY > 0;
        const canMoveDown = endY < imageDimensions.height;
        const canMoveLeft = startX > 0;
        const canMoveRight = endX < imageDimensions.width;

        const moveGrid = (dx: number, dy: number) => {
            setGridOffset(prev => ({
                x: Math.max(0, Math.min(imageDimensions.width - visiblePixels, prev.x + dx)),
                y: Math.max(0, Math.min(imageDimensions.height - visiblePixels, prev.y + dy)),
            }));
        };

        // Calculate pixel size to fit nicely
        const displayPixelSize = Math.max(18, Math.floor(220 / visiblePixels));

        const pixels = [];
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const color = getPixelColor(x, y);
                if (!color) continue;

                const isSelected = selectedPixel?.x === x && selectedPixel?.y === y;
                const isHovered = hoveredPixel?.x === x && hoveredPixel?.y === y;

                pixels.push(
                    <div
                        key={`${x}-${y}`}
                        onClick={() => setSelectedPixel({ x, y, color })}
                        onMouseEnter={() => setHoveredPixel({ x, y })}
                        onMouseLeave={() => setHoveredPixel(null)}
                        className={cn(
                            "cursor-pointer transition-all duration-150",
                            isSelected ? "ring-2 ring-white z-10 scale-110" : "",
                            isHovered && !isSelected ? "ring-1 ring-white/50 z-10" : ""
                        )}
                        style={{
                            width: displayPixelSize,
                            height: displayPixelSize,
                            backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                        }}
                        title={`(${x}, ${y})`}
                    />
                );
            }
        }

        return (
            <div className="flex flex-col items-center gap-3">
                {/* Pixel Grid */}
                <div
                    className="grid gap-px p-2 bg-black/50 rounded-xl border border-border/40"
                    style={{
                        gridTemplateColumns: `repeat(${endX - startX}, ${displayPixelSize}px)`,
                    }}
                >
                    {pixels}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveGrid(-Math.floor(visiblePixels / 2), 0)}
                        disabled={!canMoveLeft}
                        className="h-7 px-2 rounded-full cursor-pointer"
                    >
                        <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveGrid(0, -Math.floor(visiblePixels / 2))}
                        disabled={!canMoveUp}
                        className="h-7 px-2 rounded-full cursor-pointer"
                    >
                        <ChevronUp className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2">
                        ({startX}, {startY})
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveGrid(0, Math.floor(visiblePixels / 2))}
                        disabled={!canMoveDown}
                        className="h-7 px-2 rounded-full cursor-pointer"
                    >
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveGrid(Math.floor(visiblePixels / 2), 0)}
                        disabled={!canMoveRight}
                        className="h-7 px-2 rounded-full cursor-pointer"
                    >
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderSidePanel = () => {
        if (!selectedPixel) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Grid3X3 className="h-12 w-12 mb-4 opacity-30" />
                    <p className="text-center">Click a pixel to see its<br />RGB → Binary breakdown</p>
                </div>
            );
        }

        const { x, y, color } = selectedPixel;
        const channels = [
            { name: 'Red', value: color.r, binary: toBinary(color.r), colorClass: 'text-red-500', bgClass: 'bg-red-500' },
            { name: 'Green', value: color.g, binary: toBinary(color.g), colorClass: 'text-green-500', bgClass: 'bg-green-500' },
            { name: 'Blue', value: color.b, binary: toBinary(color.b), colorClass: 'text-blue-500', bgClass: 'bg-blue-500' },
        ];

        return (
            <div className="space-y-6">
                {/* Preview */}
                <div className="flex items-center gap-4">
                    <div
                        className="w-16 h-16 rounded-2xl shadow-lg border-2 border-border"
                        style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                    />
                    <div>
                        <div className="text-sm text-muted-foreground">Pixel</div>
                        <div className="font-mono font-bold">({x}, {y})</div>
                    </div>
                </div>

                {/* RGB Channels */}
                <div className="space-y-4">
                    {channels.map((ch) => (
                        <div key={ch.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className={cn("font-medium", ch.colorClass)}>{ch.name}</span>
                                <span className="font-mono font-bold">{ch.value}</span>
                            </div>
                            <div className={cn("h-2 rounded-full overflow-hidden bg-secondary")}>
                                <div
                                    className={cn("h-full rounded-full transition-all", ch.bgClass)}
                                    style={{ width: `${(ch.value / 255) * 100}%` }}
                                />
                            </div>
                            <div className="font-mono text-sm tracking-wider bg-secondary/50 p-2 rounded-lg text-center">
                                {ch.binary}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Combined Binary */}
                <div className="pt-4 border-t border-border/40">
                    <div className="text-sm text-muted-foreground mb-2">24-bit Color Value</div>
                    <div className="font-mono text-xs bg-black/80 text-green-400 p-3 rounded-xl break-all">
                        {toBinary(color.r)}{toBinary(color.g)}{toBinary(color.b)}
                    </div>
                </div>

                <Button variant="ghost" size="sm" onClick={() => setSelectedPixel(null)} className="w-full">
                    Clear Selection
                </Button>
            </div>
        );
    };

    // ========================================================================
    // MAIN RENDER
    // ========================================================================

    return (
        <main className="min-h-screen bg-background p-6 md:p-8 font-sans">
            <div className="mx-auto max-w-6xl space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between pb-6 border-b border-border/40">
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
                            <h1 className="text-3xl font-serif font-medium tracking-tight">Pixel to Bits</h1>
                            <p className="text-base text-muted-foreground mt-1">Explore how images become binary data</p>
                        </div>
                    </div>
                    {imageUrl && (
                        <Button variant="outline" onClick={resetImage} className="cursor-pointer rounded-full">
                            <X className="h-4 w-4 mr-2" /> New Image
                        </Button>
                    )}
                </header>

                {/* Stats Bar */}
                {imageData && (
                    <Card className="bg-primary/5 border-primary/20 rounded-2xl">
                        <CardContent className="p-4 flex flex-wrap items-center justify-center gap-6 md:gap-8 text-center">
                            <div>
                                <div className="text-2xl font-bold font-mono">{formatNumber(totalPixels)}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Pixels</div>
                            </div>
                            <div className="h-8 w-px bg-border hidden md:block" />
                            <div>
                                <div className="text-2xl font-bold font-mono">{(totalPixels / 1000000).toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Megapixels</div>
                            </div>
                            <div className="h-8 w-px bg-border hidden md:block" />
                            <div>
                                <div className="text-2xl font-bold font-mono text-primary">{formatNumber(totalBits)}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Binary Values</div>
                            </div>
                            <div className="h-8 w-px bg-border hidden md:block" />
                            <div>
                                <div className="text-2xl font-bold font-mono">{formatNumber(totalBits / 8)}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Bytes</div>
                            </div>
                            <div className="h-8 w-px bg-border hidden md:block" />
                            <div>
                                <div className="text-2xl font-bold font-mono">{((totalBits / 8) / (1024 * 1024)).toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">MB</div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Compression Notice */}
                {imageData && imageDimensions && (
                    <p className="text-center text-xs text-muted-foreground/50">
                        Image resized to {imageDimensions.width}×{imageDimensions.height} for performance. Working with millions of binary values can slow down your browser.
                    </p>
                )}

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Image + Grid Area */}
                    <Card className="lg:col-span-2 border border-border/50 rounded-[2rem] shadow-sm overflow-hidden">
                        <CardHeader className="bg-secondary/20 border-b border-border/40 p-4">
                            {imageData && (
                                <div className="flex items-center justify-end">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setZoomLevel(Math.max(3, zoomLevel - 2))}
                                            disabled={zoomLevel <= 3}
                                            className="h-8 w-8 rounded-full cursor-pointer"
                                        >
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm font-mono w-8 text-center">{zoomLevel}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setZoomLevel(Math.min(20, zoomLevel + 2))}
                                            disabled={zoomLevel >= 20}
                                            className="h-8 w-8 rounded-full cursor-pointer"
                                        >
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            {!imageUrl && renderUploadZone()}
                            {imageUrl && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Image Preview */}
                                    <div className="flex flex-col items-center gap-2">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Original Image</h3>
                                        {renderImageView()}
                                    </div>
                                    {/* Grid View */}
                                    <div className="flex flex-col items-center gap-2">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pixel Grid</h3>
                                        {renderGridView()}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Side Panel */}
                    <Card className="border border-border/50 rounded-[2rem] shadow-sm">
                        <CardHeader className="bg-secondary/20 border-b border-border/40 p-4">
                            <CardTitle className="text-lg font-serif">Pixel Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 min-h-[350px]">
                            {renderSidePanel()}
                        </CardContent>
                    </Card>
                </div>

                {/* Educational Note */}
                <Card className="bg-secondary/20 border border-border/40 rounded-[2rem]">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                            How it works
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Every digital image is made of <strong>pixels</strong>. Each pixel stores its color using three values:
                            <strong className="text-red-500"> Red</strong>,
                            <strong className="text-green-500"> Green</strong>, and
                            <strong className="text-blue-500"> Blue</strong> (RGB).
                            Each color channel is a number from 0-255, which can be represented as 8 binary digits (bits).
                            This means each pixel requires <strong>24 bits</strong> of data to store!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
