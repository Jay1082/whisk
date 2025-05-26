'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
// import { EstimateItem } from '../components/EstimateSidebar'; // No longer importing from here

// Define EstimateItem interface - AND EXPORT IT
export interface EstimateItem {
    id: string | number; // Will use component name as ID for pending items
    type: string; 
    configurationSummary: string; 
    price?: number; 
    rawConfigurationData?: any; // Added for storing all data needed for editing
    isConfigured: boolean; // New field
}

interface EstimateContextType {
  configuredItems: EstimateItem[];
  addItemToEstimate: (item: EstimateItem) => void; // This will now be for fully configured items
  addOrUpdatePendingItem: (itemData: { id: string; type: string; name: string }) => void;
  removeItemFromEstimate: (itemId: string | number) => void;
  editItemInEstimate: (itemToEdit: EstimateItem) => void; 
}

const EstimateContext = createContext<EstimateContextType | undefined>(undefined);

export const useEstimate = () => {
  const context = useContext(EstimateContext);
  if (!context) {
    throw new Error('useEstimate must be used within an EstimateProvider');
  }
  return context;
};

interface EstimateProviderProps {
  children: ReactNode;
}

export const EstimateProvider = ({ children }: EstimateProviderProps) => {
  const [configuredItems, setConfiguredItems] = useState<EstimateItem[]>([]);

  const addOrUpdatePendingItem = (itemData: { id: string; type: string; name: string }) => {
    setConfiguredItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === itemData.id);
      if (existingItemIndex > -1) {
        // If item exists, only update if it's also not configured yet.
        // This prevents overwriting a configured item with a pending one if re-selected.
        if (!prevItems[existingItemIndex].isConfigured) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...prevItems[existingItemIndex], // keep existing data like price if any was set by another logic
            type: itemData.type,
            configurationSummary: "(awaiting configuration)", // Explicitly set pending summary
            isConfigured: false,
          };
          return updatedItems;
        }
        return prevItems; // Already configured, do nothing
      } else {
        // Add new pending item
        const pendingItem: EstimateItem = {
          id: itemData.id,
          type: itemData.type,
          configurationSummary: "(awaiting configuration)",
          price: 0, // Default price for pending
          rawConfigurationData: {},
          isConfigured: false,
        };
        return [...prevItems, pendingItem];
      }
    });
  };

  const removeItemFromEstimate = (itemId: string | number) => {
    setConfiguredItems(prevItems => 
      prevItems.filter(item => item.id !== itemId)
    );
  };

  const addItemToEstimate = (configuredItemData: EstimateItem) => {
    // This function assumes configuredItemData comes from a configuration page
    // and thus should be marked as isConfigured: true.
    // It will update an existing item if ID matches, or add new if ID is new.
    setConfiguredItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === configuredItemData.id);
      const itemWithConfigFlag = { ...configuredItemData, isConfigured: true };

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = itemWithConfigFlag; // Update existing (could be pending or already configured)
        return updatedItems;
      } else {
        // This case should be rare if pending item was added first.
        // But if configuring directly without prior selection, this adds it.
        // Ensure ID is robust if not passed (though config page should pass it now)
        const finalItem = itemWithConfigFlag.id ? itemWithConfigFlag : { ...itemWithConfigFlag, id: Date.now().toString() }; // ensure ID as string
        return [...prevItems, finalItem];
      }
    });
  };

  const editItemInEstimate = (itemToEdit: EstimateItem) => {
    alert(`Edit functionality for ${itemToEdit.type} needs further implementation for navigation and data pre-filling.`);
    // Future: router.push(`/configure/${itemToEdit.type.toLowerCase().replace(/\s+/g, '-')}/?id=${itemToEdit.id}&edit=true`);
    // The configuration page would then need to fetch the item's rawConfigurationData from context or a store.
  };

  return (
    <EstimateContext.Provider value={{ 
      configuredItems, 
      addItemToEstimate, 
      addOrUpdatePendingItem, 
      removeItemFromEstimate,
      editItemInEstimate 
    }}>
      {children}
    </EstimateContext.Provider>
  );
}; 