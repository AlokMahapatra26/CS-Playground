'use client';

import React, { useState } from 'react';
import { generateKeyPair, exportKey, encryptMessage, decryptMessage } from '@/lib/crypto-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, Unlock, RefreshCw, User, Globe, Send, Pencil, Plus, Trash2, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    content: string; // Encrypted content
    fromName: string;
    decrypted?: string;
    timestamp: number;
}

interface Person {
    id: string;
    name: string;
    publicKey: CryptoKey | null;
    privateKey: CryptoKey | null;
    publicKeyPem: string;
    privateKeyPem: string;
    draftMessage: string;
    draftEncrypted: string;
    draftRecipientId: string | null; // ID of the person whose key was used
    inbox: Message[];
}

const truncateKey = (key: string) => {
    if (!key) return '';
    const lines = key.split('\n');
    return `${lines[0]}\n${lines[1]?.substring(0, 25)}...`;
};

export default function DynamicCryptoChat() {
    const [people, setPeople] = useState<Person[]>([
        {
            id: '1',
            name: 'Alice',
            publicKey: null,
            privateKey: null,
            publicKeyPem: '',
            privateKeyPem: '',
            draftMessage: '',
            draftEncrypted: '',
            draftRecipientId: null,
            inbox: []
        },
        {
            id: '2',
            name: 'Bob',
            publicKey: null,
            privateKey: null,
            publicKeyPem: '',
            privateKeyPem: '',
            draftMessage: '',
            draftEncrypted: '',
            draftRecipientId: null,
            inbox: []
        }
    ]);

    const [draggedKey, setDraggedKey] = useState<{ type: 'public' | 'private', personId: string } | null>(null);
    const [editingNameId, setEditingNameId] = useState<string | null>(null);

    const addPerson = () => {
        const newId = Date.now().toString();
        setPeople(prev => [...prev, {
            id: newId,
            name: `User ${prev.length + 1}`,
            publicKey: null,
            privateKey: null,
            publicKeyPem: '',
            privateKeyPem: '',
            draftMessage: '',
            draftEncrypted: '',
            draftRecipientId: null,
            inbox: []
        }]);
    };

    const removePerson = (id: string) => {
        setPeople(prev => prev.filter(p => p.id !== id));
    };

    const updatePerson = (id: string, updates: Partial<Person>) => {
        setPeople(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const generateKeys = async (id: string) => {
        const keyPair = await generateKeyPair();
        const pubPem = await exportKey(keyPair.publicKey);
        const privPem = await exportKey(keyPair.privateKey);

        updatePerson(id, {
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            publicKeyPem: pubPem,
            privateKeyPem: privPem
        });
    };

    const handleDragStart = (type: 'public' | 'private', personId: string) => {
        setDraggedKey({ type, personId });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDropOnDraft = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedKey || draggedKey.type !== 'public') return;

        const targetPerson = people.find(p => p.id === targetId);
        if (!targetPerson?.draftMessage) return;

        // Check if encrypting with own key
        if (draggedKey.personId === targetId) {
            alert("You cannot encrypt a message with your own public key! Use a recipient's public key.");
            setDraggedKey(null);
            return;
        }

        const keyOwner = people.find(p => p.id === draggedKey.personId);
        if (keyOwner?.publicKey) {
            const encrypted = await encryptMessage(targetPerson.draftMessage, keyOwner.publicKey);
            updatePerson(targetId, {
                draftEncrypted: encrypted,
                draftRecipientId: keyOwner.id
            });
        }
        setDraggedKey(null);
    };

    const sendMessage = (senderId: string) => {
        const sender = people.find(p => p.id === senderId);
        if (!sender?.draftEncrypted || !sender.draftRecipientId) return;

        const recipientId = sender.draftRecipientId;
        const newMessage: Message = {
            id: Date.now().toString(),
            content: sender.draftEncrypted,
            fromName: sender.name,
            timestamp: Date.now()
        };

        // Add to recipient's inbox
        setPeople(prev => prev.map(p => {
            if (p.id === recipientId) {
                return { ...p, inbox: [newMessage, ...p.inbox] };
            }
            if (p.id === senderId) {
                return { ...p, draftMessage: '', draftEncrypted: '', draftRecipientId: null };
            }
            return p;
        }));
    };

    const handleDropOnInboxMessage = async (e: React.DragEvent, targetPersonId: string, messageId: string) => {
        e.preventDefault();
        if (!draggedKey || draggedKey.type !== 'private') return;

        const targetPerson = people.find(p => p.id === targetPersonId);
        if (!targetPerson) return;

        // Check if using correct private key
        if (draggedKey.personId !== targetPersonId) {
            alert(`You must use ${targetPerson.name}'s private key to decrypt their messages!`);
            setDraggedKey(null);
            return;
        }

        const message = targetPerson.inbox.find(m => m.id === messageId);
        if (!message) return;

        if (targetPerson.privateKey) {
            try {
                const decrypted = await decryptMessage(message.content, targetPerson.privateKey);

                // Update the specific message in the inbox
                setPeople(prev => prev.map(p => {
                    if (p.id === targetPersonId) {
                        return {
                            ...p,
                            inbox: p.inbox.map(m => m.id === messageId ? { ...m, decrypted } : m)
                        };
                    }
                    return p;
                }));
            } catch (error) {
                alert('Decryption failed! Wrong private key.');
            }
        }
        setDraggedKey(null);
    };

    return (
        <main className="min-h-screen bg-background p-6 md:p-8 font-sans">
            <div className="mx-auto max-w-[1600px] space-y-8">
                <header className="flex items-center justify-between pb-6 border-b">
                    <div className="flex items-center gap-6">
                        <Button variant="outline" size="icon" onClick={() => window.location.href = '/'} className="cursor-pointer h-10 w-10 rounded-full hover:bg-muted">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Public Key Cryptography Playground</h1>
                            <p className="text-base text-muted-foreground mt-1">Interactive simulation: Encrypt with Public Keys, Decrypt with Private Keys</p>
                        </div>
                    </div>
                    <Button onClick={addPerson} className="cursor-pointer h-10 px-6">
                        <Plus className="h-4 w-4 mr-2" /> Add Person
                    </Button>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    {/* Left: Users Grid */}
                    <div className="col-span-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {people.map(person => (
                            <Card key={person.id} className="flex flex-col h-[600px] border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 flex-none border-b bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            {editingNameId === person.id ? (
                                                <Input
                                                    value={person.name}
                                                    onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                                                    onBlur={() => setEditingNameId(null)}
                                                    onKeyDown={(e) => e.key === 'Enter' && setEditingNameId(null)}
                                                    autoFocus
                                                    className="h-8 w-32 font-semibold"
                                                />
                                            ) : (
                                                <div
                                                    className="flex items-center gap-2 group cursor-pointer"
                                                    onClick={() => setEditingNameId(person.id)}
                                                >
                                                    <CardTitle className="text-lg">{person.name}</CardTitle>
                                                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => generateKeys(person.id)}
                                                disabled={!!person.publicKey}
                                                className="cursor-pointer"
                                            >
                                                <RefreshCw className={cn("h-3 w-3 mr-1", !person.publicKey && "animate-pulse")} />
                                                {person.publicKey ? 'Keys Active' : 'Gen Keys'}
                                            </Button>
                                            {people.length > 2 && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive cursor-pointer" onClick={() => removePerson(person.id)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                                    {/* Private Key Section */}
                                    <div className="p-4 border-b bg-red-500/5">
                                        {!person.privateKey ? (
                                            <div className="text-center py-2 text-sm text-muted-foreground">
                                                Generate keys to start
                                            </div>
                                        ) : (
                                            <div
                                                draggable
                                                onDragStart={() => handleDragStart('private', person.id)}
                                                className="flex items-center gap-3 p-3 rounded border border-red-500/20 bg-background cursor-move hover:border-red-500 transition-colors shadow-sm"
                                            >
                                                <div className="h-8 w-8 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-none">
                                                    <Lock className="h-4 w-4 text-red-500" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-bold text-red-600 dark:text-red-400">MY PRIVATE KEY</div>
                                                    <div className="text-[10px] text-muted-foreground truncate">Drag to decrypt messages</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Inbox Section */}
                                    <div className="flex-1 min-h-0 flex flex-col bg-muted/10">
                                        <div className="p-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Inbox ({person.inbox.length})
                                        </div>
                                        <ScrollArea className="flex-1">
                                            <div className="p-4 space-y-3">
                                                {person.inbox.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground text-sm italic">
                                                        No messages received
                                                    </div>
                                                ) : (
                                                    person.inbox.map(msg => (
                                                        <div
                                                            key={msg.id}
                                                            onDragOver={handleDragOver}
                                                            onDrop={(e) => handleDropOnInboxMessage(e, person.id, msg.id)}
                                                            className={cn(
                                                                "p-3 rounded-lg border text-sm transition-all",
                                                                msg.decrypted
                                                                    ? "bg-green-500/10 border-green-500/30"
                                                                    : "bg-background border-dashed border-primary/30 hover:border-primary"
                                                            )}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-semibold text-xs text-primary">From: {msg.fromName}</span>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                                </span>
                                                            </div>

                                                            {msg.decrypted ? (
                                                                <div className="text-foreground font-medium break-words">
                                                                    {msg.decrypted}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <div className="font-mono text-[10px] text-muted-foreground break-all line-clamp-2 bg-muted p-1 rounded">
                                                                        {msg.content}
                                                                    </div>
                                                                    <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium py-2 bg-primary/5 rounded border border-primary/10">
                                                                        <Lock className="h-3 w-3" />
                                                                        Drop Private Key to Decrypt
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    {/* Compose Section */}
                                    <div className="p-4 border-t bg-background mt-auto">
                                        <div className="space-y-3">
                                            <Textarea
                                                placeholder={`Write a message as ${person.name}...`}
                                                value={person.draftMessage}
                                                onChange={(e) => updatePerson(person.id, { draftMessage: e.target.value })}
                                                className="min-h-[60px] resize-none text-sm"
                                                disabled={!!person.draftEncrypted}
                                            />

                                            {!person.draftEncrypted ? (
                                                <div
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDropOnDraft(e, person.id)}
                                                    className="h-12 rounded border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground bg-muted/30"
                                                >
                                                    Drag a Public Key here to Encrypt
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="p-2 bg-green-500/10 border border-green-500/20 rounded text-xs">
                                                        <div className="flex items-center gap-2 mb-1 text-green-600 dark:text-green-400 font-semibold">
                                                            <Lock className="h-3 w-3" />
                                                            Encrypted for {people.find(p => p.id === person.draftRecipientId)?.name}
                                                        </div>
                                                        <div className="font-mono text-[10px] truncate opacity-70">
                                                            {person.draftEncrypted}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            className="flex-1 cursor-pointer"
                                                            size="sm"
                                                            onClick={() => sendMessage(person.id)}
                                                        >
                                                            <Send className="h-3 w-3 mr-2" /> Send
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="cursor-pointer"
                                                            onClick={() => updatePerson(person.id, { draftEncrypted: '', draftRecipientId: null })}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Right: Public Keys Directory */}
                    <div className="col-span-3">
                        <Card className="h-[600px] border-green-500/20 flex flex-col sticky top-4">
                            <CardHeader className="bg-green-500/5 border-b border-green-500/10 pb-3">
                                <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <Globe className="h-5 w-5" />
                                    Public Directory
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Global list of public keys. Drag one to a message to encrypt it for that person.
                                </p>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 min-h-0">
                                <ScrollArea className="h-full">
                                    <div className="p-4 space-y-3">
                                        {people.map(person => (
                                            <div key={person.id} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs px-1">
                                                    <span className="font-semibold">{person.name}</span>
                                                    {person.publicKey ? (
                                                        <span className="text-green-600 text-[10px] bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">Available</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-[10px]">No Key</span>
                                                    )}
                                                </div>

                                                {person.publicKey ? (
                                                    <div
                                                        draggable
                                                        onDragStart={() => handleDragStart('public', person.id)}
                                                        className="p-3 rounded border border-green-500/30 bg-green-500/5 cursor-move hover:bg-green-500/10 hover:border-green-500 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <Unlock className="h-3 w-3 text-green-600" />
                                                            <span className="text-xs font-medium text-green-700 dark:text-green-400">Public Key</span>
                                                        </div>
                                                        <div className="font-mono text-[9px] text-muted-foreground break-all line-clamp-3 group-hover:text-foreground transition-colors">
                                                            {truncateKey(person.publicKeyPem)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 rounded border border-dashed bg-muted/30 text-center">
                                                        <span className="text-[10px] text-muted-foreground">Key not generated</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
