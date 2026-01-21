import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, Lock, Cpu, Image } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-8 md:p-24 font-sans">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-24 space-y-6">
          <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-foreground">
            CS Playground
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-light leading-relaxed">
            An interactive exploration of computer science fundamentals.
            Designed for clarity and intuition.
          </p>
        </header>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Public Key Crypto Module */}
          <Link href="/public-key-crypto" className="group block h-full">
            <Card className="h-full bg-card border border-border/50 transition-all duration-300 hover:border-foreground/20 hover:bg-secondary/30 rounded-[2rem] shadow-sm hover:shadow-md">
              <CardHeader className="space-y-4 p-8">
                <div className="h-14 w-14 flex items-center justify-center border border-border/50 rounded-2xl bg-background shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Lock className="h-6 w-6 text-foreground/80" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-serif font-medium flex items-center gap-2">
                    End to End Encryption
                    <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 rounded-full bg-foreground/5 p-1" />
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Public Key Encryption & Signatures
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-muted-foreground leading-relaxed">
                  Generate RSA keys, encrypt messages, and simulate secure communication networks.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Binary Visualization Module */}
          <Link href="/binary-visualization" className="group block h-full">
            <Card className="h-full bg-card border border-border/50 transition-all duration-300 hover:border-foreground/20 hover:bg-secondary/30 rounded-[2rem] shadow-sm hover:shadow-md">
              <CardHeader className="space-y-4 p-8">
                <div className="h-14 w-14 flex items-center justify-center border border-border/50 rounded-2xl bg-background shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Cpu className="h-6 w-6 text-foreground/80" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-serif font-medium flex items-center gap-2">
                    Binary Numbers
                    <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 rounded-full bg-foreground/5 p-1" />
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    8-bit Byte Visualization
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-muted-foreground leading-relaxed">
                  Interactive 8-bit toggle to explore how binary numbers convert to decimal.
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Pixel to Bits Module */}
          <Link href="/pixel-to-bits" className="group block h-full">
            <Card className="h-full bg-card border border-border/50 transition-all duration-300 hover:border-foreground/20 hover:bg-secondary/30 rounded-[2rem] shadow-sm hover:shadow-md">
              <CardHeader className="space-y-4 p-8">
                <div className="h-14 w-14 flex items-center justify-center border border-border/50 rounded-2xl bg-background shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Image className="h-6 w-6 text-foreground/80" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-serif font-medium flex items-center gap-2">
                    Pixel to Bits
                    <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 rounded-full bg-foreground/5 p-1" />
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Image to Binary Visualization
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-muted-foreground leading-relaxed">
                  Upload an image and explore how each pixel becomes RGB values and binary data.
                </p>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>
    </main>
  );
}
