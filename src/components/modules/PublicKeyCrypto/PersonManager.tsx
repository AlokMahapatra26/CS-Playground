'use client';

import React, { useState } from 'react';
import { generateKeyPair, exportKey } from '@/lib/crypto-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, Unlock, RefreshCw, User, Trash2, Globe, Eye, EyeOff } from 'lucide-react';

export interface Person {
    id: string;
    name: string;
    publicKey: CryptoKey;
    privateKey: CryptoKey;
    publicKeyPem: string;
    privateKeyPem: string;
}

interface PersonManagerProps {
    onPeopleChange: (people: Person[]) => void;
}

export default function PersonManager({ onPeopleChange }: PersonManagerProps) {
    const [people, setPeople] = useState<Person[]>([]);
    const [newPersonName, setNewPersonName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<Set<string>>(new Set());

    const handleAddPerson = async () => {
        if (!newPersonName.trim()) return;

        setIsGenerating(true);
        try {
            const keyPair = await generateKeyPair();
            const pubPem = await exportKey(keyPair.publicKey);
            const privPem = await exportKey(keyPair.privateKey);

            const newPerson: Person = {
                id: Date.now().toString(),
                name: newPersonName.trim(),
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey,
                publicKeyPem: pubPem,
                privateKeyPem: privPem,
            };

            const updatedPeople = [...people, newPerson];
            setPeople(updatedPeople);
            onPeopleChange(updatedPeople);
            setNewPersonName('');
        } catch (error) {
            console.error("Failed to generate keys", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRemovePerson = (id: string) => {
        const updatedPeople = people.filter(p => p.id !== id);
        setPeople(updatedPeople);
        onPeopleChange(updatedPeople);
        setVisiblePrivateKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const togglePrivateKeyVisibility = (id: string) => {
        setVisiblePrivateKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const truncateKey = (key: string) => {
        const lines = key.split('\n');
        if (lines.length > 3) {
            return `${lines[0]}\n${lines[1].substring(0, 40)}...\n${lines[lines.length - 1]}`;
        }
        return key;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Add Person + People List */}
            <div className="lg:col-span-2 space-y-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">People</CardTitle>
                        <CardDescription className="text-xs">Add people to exchange messages</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Name (e.g., Alice, Bob)"
                                value={newPersonName}
                                onChange={(e) => setNewPersonName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                                className="h-9"
                            />
                            <Button
                                onClick={handleAddPerson}
                                disabled={!newPersonName.trim() || isGenerating}
                                size="sm"
                            >
                                {isGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <User className="h-3 w-3" />}
                            </Button>
                        </div>

                        {people.length === 0 ? (
                            <div className="text-center py-6 border border-dashed rounded text-muted-foreground text-xs">
                                Add at least 2 people
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {people.map((person) => (
                                    <div key={person.id} className="p-3 rounded border bg-muted/30 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-3 w-3 text-primary" />
                                                </div>
                                                <span className="font-medium text-sm">{person.name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemovePerson(person.id)}
                                                className="h-6 w-6 p-0"
                                            >
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                        </div>

                                        {/* Private Key Section */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <Lock className="h-3 w-3 text-red-500" />
                                                    <Label className="text-xs text-red-600 dark:text-red-400">Private Key (Secret)</Label>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => togglePrivateKeyVisibility(person.id)}
                                                    className="h-6 px-2"
                                                >
                                                    {visiblePrivateKeys.has(person.id) ? (
                                                        <EyeOff className="h-3 w-3" />
                                                    ) : (
                                                        <Eye className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                            {visiblePrivateKeys.has(person.id) ? (
                                                <div className="rounded border bg-background p-2 font-mono text-[9px] leading-tight">
                                                    <div className="whitespace-pre-wrap break-all max-h-[80px] overflow-auto">
                                                        {person.privateKeyPem}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded border bg-background p-2 text-center text-xs text-muted-foreground">
                                                    Click eye icon to reveal
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right: Public Keys - Scrollable */}
            {people.length > 0 && (
                <Card className="border-green-500/30 bg-green-500/5">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-green-500" />
                            <CardTitle className="text-lg text-green-600 dark:text-green-400">Public Keys</CardTitle>
                        </div>
                        <CardDescription className="text-xs">Accessible to everyone</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px] pr-3">
                            <div className="space-y-3">
                                {people.map((person) => (
                                    <div key={person.id} className="space-y-1">
                                        <div className="flex items-center gap-1">
                                            <Unlock className="h-3 w-3 text-green-500" />
                                            <Label className="text-xs font-semibold text-green-600 dark:text-green-400">{person.name}</Label>
                                        </div>
                                        <div className="rounded border bg-background p-2 font-mono text-[9px] leading-tight">
                                            <div className="whitespace-pre-wrap break-all">{truncateKey(person.publicKeyPem)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
