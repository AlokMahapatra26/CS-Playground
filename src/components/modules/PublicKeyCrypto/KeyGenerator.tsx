'use client';

import React, { useState } from 'react';
import { generateKeyPair, exportKey } from '@/lib/crypto-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, Unlock, RefreshCw } from 'lucide-react';

interface KeyGeneratorProps {
    onKeysGenerated: (publicKey: CryptoKey, privateKey: CryptoKey) => void;
}

export default function KeyGenerator({ onKeysGenerated }: KeyGeneratorProps) {
    const [publicKeyPem, setPublicKeyPem] = useState<string>('');
    const [privateKeyPem, setPrivateKeyPem] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const keyPair = await generateKeyPair();
            const pubPem = await exportKey(keyPair.publicKey);
            const privPem = await exportKey(keyPair.privateKey);

            setPublicKeyPem(pubPem);
            setPrivateKeyPem(privPem);
            onKeysGenerated(keyPair.publicKey, keyPair.privateKey);
        } catch (error) {
            console.error("Failed to generate keys", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl">1. Generate Key Pair</CardTitle>
                        <CardDescription>Create a unique pair of keys. One to lock (encrypt), one to unlock (decrypt).</CardDescription>
                    </div>
                    <Button onClick={handleGenerate} disabled={isLoading} className="min-w-[160px]">
                        {isLoading ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? 'Generating...' : 'Generate Keys'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Unlock className="h-4 w-4 text-green-500" />
                        <Label className="text-green-600 dark:text-green-400">Public Key (Share freely)</Label>
                    </div>
                    <div className="rounded-md border bg-muted p-4 font-mono text-xs">
                        <ScrollArea className="h-[200px] w-full rounded-md">
                            {publicKeyPem || <span className="text-muted-foreground italic">// No key generated yet...</span>}
                        </ScrollArea>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-red-500" />
                        <Label className="text-red-600 dark:text-red-400">Private Key (Keep secret!)</Label>
                    </div>
                    <div className="rounded-md border bg-muted p-4 font-mono text-xs">
                        <ScrollArea className="h-[200px] w-full rounded-md">
                            {privateKeyPem || <span className="text-muted-foreground italic">// No key generated yet...</span>}
                        </ScrollArea>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
