'use client'; // Assuming client-side interactions like onClick

import React from 'react';
import { useEstimate } from '../context/EstimateContext'; // Import the hook
import type { EstimateItem } from '../context/EstimateContext'; // Import the type from context

// Local definition of EstimateItem removed to avoid conflict with imported one.
// export interface EstimateItem {
//     id: string | number;
//     type: string; 
//     configurationSummary: string; 
//     price?: number; 
// }

// Props are no longer needed as we will use context
// interface EstimateSidebarProps {
//     items: EstimateItem[];
//     onRemoveItem: (itemId: string | number) => void;
//     onEditItem: (item: EstimateItem) => void;
// }

export default function EstimateSidebar(/*{ items, onRemoveItem, onEditItem }: EstimateSidebarProps*/) {
    const { configuredItems, removeItemFromEstimate, editItemInEstimate } = useEstimate();

    const totalCost = configuredItems.reduce((sum, item) => sum + (item.price || 0), 0);

    // The onEditItem from context is named editItemInEstimate
    // The onRemoveItem from context is named removeItemFromEstimate

    return (
        <aside className="w-full md:w-80 lg:w-96 bg-slate-100 border-l border-slate-300 p-6 space-y-6 overflow-y-auto md:sticky md:top-0 md:h-screen">
            <h2 className="text-xl font-semibold text-gray-800">Estimate Summary</h2>

            {configuredItems.length === 0 ? (
                <p className="text-gray-500">No items added to your estimate yet.</p>
            ) : (
                <ul className="space-y-4">
                    {configuredItems.map((item) => (
                        <li key={item.id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-700">{item.type}</h3>
                                    <p className="text-xs text-gray-500 break-words">{item.configurationSummary}</p>
                                </div>
                                {item.price !== undefined && (
                                    <p className="text-sm font-medium text-gray-800 ml-2 whitespace-nowrap">${item.price.toFixed(2)}</p>
                                )}
                            </div>
                            <div className="mt-3 flex justify-end space-x-2">
                                <button
                                    onClick={() => editItemInEstimate(item)} // Use context function
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => removeItemFromEstimate(item.id)} // Use context function
                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {configuredItems.length > 0 && (
                <div className="border-t border-gray-300 pt-4 mt-6">
                    <div className="flex justify-between items-center">
                        <p className="text-lg font-semibold text-gray-800">Total Estimate:</p>
                        <p className="text-lg font-bold text-gray-800">${totalCost.toFixed(2)}</p>
                    </div>
                    <button type="button" className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition-colors">
                        Proceed to Get Quote
                    </button>
                </div>
            )}
        </aside>
    );
} 