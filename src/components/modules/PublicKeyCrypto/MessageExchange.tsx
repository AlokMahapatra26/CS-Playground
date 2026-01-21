'use client';

import React, { useState } from 'react';
import { encryptMessage, decryptMessage } from '@/lib/crypto-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lock, Unlock, Send } from 'lucide-react';
import { Person } from './PersonManager';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface MessageExchangeProps {
    people: Person[];
}

export default function MessageExchange({ people }: MessageExchangeProps) {
    const [sender, setSender] = useState<Person | null>(null);
    const [recipient, setRecipient] = useState<Person | null>(null);
    const [message, setMessage] = useState('');
    const [encryptedData, setEncryptedData] = useState('');
    const [decryptedMessage, setDecryptedMessage] = useState('');
    const [error, setError] = useState('');

    const handleSenderChange = (personId: string) => {
        const person = people.find(p => p.id === personId);
        setSender(person || null);
        setEncryptedData('');
        setDecryptedMessage('');
        setError('');
    };

    const handleRecipientChange = (personId: string) => {
        const person = people.find(p => p.id === personId);
        setRecipient(person || null);
        setEncryptedData('');
        setDecryptedMessage('');
        setError('');
    };

    const handleEncrypt = async () => {
        if (!recipient || !message) return;
        try {
            const encrypted = await encryptMessage(message, recipient.publicKey);
            setEncryptedData(encrypted);
            setDecryptedMessage('');
            setError('');
        } catch (err) {
            setError('Encryption failed');
        }
    };

    const handleDecrypt = async () => {
        if (!recipient || !encryptedData) return;
        try {
            const decrypted = await decryptMessage(encryptedData, recipient.privateKey);
            setDecryptedMessage(decrypted);
            setError('');
        } catch (err) {
            setError('Decryption failed');
        }
    };

    if (people.length < 2) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
                    <Lock className="h-8 w-8 mb-2 opacity-20" />
                    <p>Add at least 2 people to exchange messages</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Send Encrypted Message</CardTitle>
                <CardDescription className="text-xs">
                    Encrypt with recipient's public key, decrypt with their private key
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">

                {/* Person Selection */}
                <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1">
                        <Label className="text-xs">Sender</Label>
                        <Select onValueChange={handleSenderChange} value={sender?.id || undefined}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select sender" />
                            </SelectTrigger>
                            <SelectContent>
                                {people.map((person) => (
                                    <SelectItem key={person.id} value={person.id}>
                                        {person.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Recipient</Label>
                        <Select onValueChange={handleRecipientChange} value={recipient?.id || undefined}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select recipient" />
                            </SelectTrigger>
                            <SelectContent>
                                {people.filter(p => p.id !== sender?.id).map((person) => (
                                    <SelectItem key={person.id} value={person.id}>
                                        {person.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {sender && recipient && (
                    <>
                        {/* Message Input */}
                        <div className="space-y-1">
                            <Label className="text-xs">{sender.name} → {recipient.name}</Label>
                            <Textarea
                                placeholder="Type secret message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="min-h-[60px] text-sm"
                            />
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Unlock className="h-3 w-3 text-green-500" />
                                    Encrypted with {recipient.name}'s public key
                                </p>
                                <Button
                                    onClick={handleEncrypt}
                                    disabled={!message}
                                    size="sm"
                                >
                                    <Send className="mr-1 h-3 w-3" />
                                    Encrypt
                                </Button>
                            </div>
                        </div>

                        {/* Encrypted State */}
                        {encryptedData && (
                            <div className="space-y-2 p-3 rounded-lg border bg-muted">
                                <Label className="text-xs text-blue-500">Encrypted (Safe to send)</Label>
                                <div className="rounded border bg-background p-2 font-mono text-[9px] break-all max-h-[60px] overflow-auto">
                                    {encryptedData}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Lock className="h-3 w-3 text-red-500" />
                                        Only {recipient.name}'s private key can decrypt
                                    </p>
                                    <Button
                                        onClick={handleDecrypt}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        <Unlock className="mr-1 h-3 w-3" />
                                        Decrypt
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Decrypted Result */}
                        {decryptedMessage && (
                            <div className="p-3 rounded border bg-green-500/10 border-green-500/20">
                                <Label className="text-xs text-green-600 dark:text-green-400 mb-1 block">
                                    ✓ Decrypted by {recipient.name}
                                </Label>
                                <p className="text-sm font-medium">{decryptedMessage}</p>
                            </div>
                        )}

                        {error && <p className="text-destructive text-xs">{error}</p>}
                    </>
                )}

            </CardContent>
        </Card>
    );
}
