'use client';

import React, { useState } from 'react';
import { encryptMessage, decryptMessage } from '@/lib/crypto-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowDown, Lock, Unlock } from 'lucide-react';

interface EncryptionPlaygroundProps {
    publicKey: CryptoKey | null;
    privateKey: CryptoKey | null;
}

export default function EncryptionPlayground({ publicKey, privateKey }: EncryptionPlaygroundProps) {
    const [message, setMessage] = useState('');
    const [encryptedData, setEncryptedData] = useState('');
    const [decryptedMessage, setDecryptedMessage] = useState('');
    const [error, setError] = useState('');

    const handleEncrypt = async () => {
        if (!publicKey) return;
        try {
            const encrypted = await encryptMessage(message, publicKey);
            setEncryptedData(encrypted);
            setDecryptedMessage(''); // Clear previous decryption
            setError('');
        } catch (err) {
            setError('Encryption failed');
        }
    };

    const handleDecrypt = async () => {
        if (!privateKey || !encryptedData) return;
        try {
            const decrypted = await decryptMessage(encryptedData, privateKey);
            setDecryptedMessage(decrypted);
            setError('');
        } catch (err) {
            setError('Decryption failed. The private key might not match.');
        }
    };

    if (!publicKey) {
        return (
            <Card className="mt-8 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Lock className="h-12 w-12 mb-4 opacity-20" />
                    <p>Please generate keys above to start the encryption playground.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="text-2xl">2. Encryption Playground</CardTitle>
                <CardDescription>
                    Encrypt a message with the public key, and decrypt it with the private key.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                {/* Step 1: Input */}
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label>Secret Message</Label>
                        <Textarea
                            placeholder="Type a secret message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <Button
                        onClick={handleEncrypt}
                        disabled={!message}
                        className="w-full md:w-auto md:self-start"
                    >
                        <Lock className="mr-2 h-4 w-4" />
                        Encrypt with Public Key
                    </Button>
                </div>

                {/* Arrow Indicator */}
                <div className="flex justify-center text-muted-foreground">
                    <ArrowDown className="h-6 w-6 animate-bounce" />
                </div>

                {/* Step 2: Encrypted State */}
                <div className="rounded-lg border bg-muted/30 p-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-blue-500">Encrypted Data (Ciphertext)</Label>
                        <div className="rounded-md bg-background border p-4 font-mono text-xs break-all min-h-[60px]">
                            {encryptedData || <span className="text-muted-foreground italic">// Waiting for encryption...</span>}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleDecrypt}
                            disabled={!encryptedData}
                            variant="secondary"
                        >
                            <Unlock className="mr-2 h-4 w-4" />
                            Decrypt with Private Key
                        </Button>
                    </div>
                </div>

                {/* Arrow Indicator */}
                <div className="flex justify-center text-muted-foreground">
                    <ArrowDown className="h-6 w-6" />
                </div>

                {/* Step 3: Decrypted Result */}
                <div className="space-y-2">
                    <Label className="text-green-600 dark:text-green-400">Decrypted Message</Label>
                    <div className={`rounded-md border p-4 min-h-[60px] flex items-center ${decryptedMessage ? 'bg-green-500/10 border-green-500/20' : 'bg-muted/30'}`}>
                        {decryptedMessage ? (
                            <span className="text-lg font-medium">{decryptedMessage}</span>
                        ) : (
                            <span className="text-muted-foreground italic">Decrypted message will appear here...</span>
                        )}
                    </div>
                    {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                </div>

            </CardContent>
        </Card>
    );
}
