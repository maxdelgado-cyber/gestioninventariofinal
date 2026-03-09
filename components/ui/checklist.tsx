'use client';

import { useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, ListTodo } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

interface ChecklistProps {
    storageKey: string;
    eventId: string;
    title: string;
    defaultItems: string[];
}

export function EventChecklist({ storageKey, eventId, title, defaultItems }: ChecklistProps) {
    const getFullKey = () => `allegra_${storageKey}_${eventId}`;

    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [newItemText, setNewItemText] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem(getFullKey());
        if (stored) {
            setItems(JSON.parse(stored));
        } else {
            setItems(defaultItems.map((text, i) => ({
                id: `default-${i}`,
                text,
                checked: false
            })));
        }
    }, [eventId]);

    const saveItems = (newItems: ChecklistItem[]) => {
        setItems(newItems);
        localStorage.setItem(getFullKey(), JSON.stringify(newItems));
    };

    const toggleItem = (id: string, checked: boolean) => {
        saveItems(items.map(item => item.id === id ? { ...item, checked } : item));
    };

    const addItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;

        saveItems([...items, {
            id: `custom-${Date.now()}`,
            text: newItemText.trim(),
            checked: false
        }]);
        setNewItemText('');
    };

    const removeItem = (id: string) => {
        saveItems(items.filter(item => item.id !== id));
    };

    const completedCount = items.filter(i => i.checked).length;
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

    return (
        <Card className="border border-purple-100 shadow-sm mt-4">
            <div className="bg-purple-50/50 border-b border-purple-100 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-purple-900 flex items-center gap-2">
                        <ListTodo className="h-5 w-5 text-purple-600" />
                        {title}
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-white rounded-full text-purple-700 border border-purple-200">
                        {completedCount} / {items.length} completados
                    </span>
                </div>
                <Progress value={progress} className="h-2 bg-purple-100" />
            </div>
            <CardContent className="p-4">
                <div className="space-y-3 mb-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-start space-x-3 group">
                            <Checkbox
                                id={item.id}
                                checked={item.checked}
                                onCheckedChange={(checked: boolean | 'indeterminate') => toggleItem(item.id, checked as boolean)}
                                className="mt-1 border-purple-300 data-[state=checked]:bg-purple-600"
                            />
                            <div className="grid gap-1.5 leading-none flex-1">
                                <label
                                    htmlFor={item.id}
                                    className={`text-sm font-medium leading-none cursor-pointer transition-colors ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                                >
                                    {item.text}
                                </label>
                            </div>
                            {item.id.startsWith('custom-') && (
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
