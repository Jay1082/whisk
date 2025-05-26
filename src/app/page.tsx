'use client'; // Directive to mark this as a Client Component

import React, { useState } from 'react';
import Image from 'next/image'; // Import Next.js Image component
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { useEstimate } from '../context/EstimateContext'; // Corrected path
// EstimateSidebar is no longer imported here, it's in layout.tsx

// IMPORTANT: For correct aspect ratios, update width and height for each image
// to its actual dimensions.
const exteriorPaintOptions = [
  { name: 'Siding', src: '/components/exterior/siding.png', imgWidth: 400, imgHeight: 300, type: 'Exterior Component' },
  { name: 'Windows', src: '/components/exterior/window.png', imgWidth: 400, imgHeight: 300, type: 'Exterior Component' },
  { name: 'Pergola', src: '/components/exterior/pergola.png', imgWidth: 400, imgHeight: 300, type: 'Exterior Component' },
  { name: 'Downspout', src: '/components/exterior/downspout.png', imgWidth: 400, imgHeight: 300, type: 'Exterior Component' },
  { name: 'Chimney', src: '/components/exterior/chimney.png', imgWidth: 400, imgHeight: 300, type: 'Exterior Component' },
  { name: 'Wrought Iron Railings', src: '/components/exterior/wrought iron railings.png', imgWidth: 400, imgHeight: 300, type: 'Wrought Iron Railings' },
  { 
    name: 'Porch', 
    src: '/components/exterior/porch.png', 
    imgWidth: 400, 
    imgHeight: 300, 
    type: 'Exterior Component with Sub-parts', // More descriptive type
    hasSubComponents: true, 
    subComponentPagePath: '/configure/porch-parts' 
  },
  { name: 'Roofline', src: '/components/exterior/roofline.png', imgWidth: 400, imgHeight: 300, type: 'Exterior Component' },
  { name: 'Dormer', src: '/components/exterior/dormer.png', imgWidth: 400, imgHeight: 300, type: 'Exterior Component' },
  { name: 'Fence', src: '/components/exterior/fence.png', imgWidth: 400, imgHeight: 300, type: 'Exterior Component' },
  { 
    name: 'Deck', 
    src: '/components/exterior/deck.png', 
    imgWidth: 400, 
    imgHeight: 300, 
    type: 'Exterior Component with Sub-parts', // More descriptive type
    hasSubComponents: true, 
    subComponentPagePath: '/configure/deck' 
  },
  { name: 'Foundation', src: '/components/exterior/foundation.png', imgWidth: 400, imgHeight: 300, type: 'Exterior Component' },
  { name: 'Balcony', src: '/components/exterior/balcony.png', imgWidth: 400, imgHeight: 300, type: 'Exterior Component' },
];

const interiorPaintOptions = [
  { name: 'Hallway', src: '/components/interior/hallway.png', imgWidth: 400, imgHeight: 300, type: 'Interior Component' },
  { name: 'Dining Room', src: '/components/interior/dining room.png', imgWidth: 400, imgHeight: 300, type: 'Interior Component' },
  { name: 'Living Room', src: '/components/interior/living room.png', imgWidth: 400, imgHeight: 300, type: 'Interior Component' },
  { name: 'Custom', src: '/components/interior/custom.png', imgWidth: 400, imgHeight: 300, type: 'Interior Component' },
  { name: 'Staircase', src: '/components/interior/staircase.png', imgWidth: 400, imgHeight: 300, type: 'Interior Component' },
  { name: 'Bathroom', src: '/components/interior/bathroom.png', imgWidth: 400, imgHeight: 300, type: 'Interior Component' },
  { name: 'Kitchen', src: '/components/interior/kitchen.png', imgWidth: 400, imgHeight: 300, type: 'Interior Component' },
  { name: 'Bedroom', src: '/components/interior/bedroom.png', imgWidth: 400, imgHeight: 300, type: 'Interior Component' },
];

type View = 'exterior' | 'interior';

interface PaintOption {
    name: string;
    src: string;
    imgWidth: number;
    imgHeight: number;
    type: string;
    hasSubComponents?: boolean; // Added optional field
    subComponentPagePath?: string; // Added optional field
}

// This page now acts as the main EstimatorPage layout container
export default function EstimatorPage() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<View>('exterior');
  const [gridVisible, setGridVisible] = useState(true);
  const router = useRouter();
  const { addOrUpdatePendingItem, removeItemFromEstimate } = useEstimate();

  const currentPaintOptions: PaintOption[] = currentView === 'exterior' ? exteriorPaintOptions : interiorPaintOptions;

  const handleViewChange = (view: View) => {
    if (view !== currentView) {
      selectedImages.forEach(imageName => {
        const item = currentPaintOptions.find(opt => opt.name === imageName);
        if (item) {
          removeItemFromEstimate(item.name);
        }
      });
      setGridVisible(false);
      setTimeout(() => {
        setCurrentView(view);
        setSelectedImages([]);
        setGridVisible(true);
      }, 300);
    }
  };

  const handleImageClick = (option: PaintOption) => {
    const imageName = option.name;
    const itemType = option.type;

    const isAlreadySelected = selectedImages.includes(imageName);

    if (isAlreadySelected) {
      // Item is currently selected, so we are deselecting it.
      // First, update local state:
      setSelectedImages(prev => prev.filter(name => name !== imageName));
      // Then, update context state:
      removeItemFromEstimate(imageName);
    } else {
      // Item is not currently selected, so we are selecting it.
      // First, update local state:
      setSelectedImages(prev => [...prev, imageName]);
      // Then, update context state:
      addOrUpdatePendingItem({ id: imageName, type: itemType, name: imageName });
    }
  };

  const handleContinue = () => {
    if (selectedImages.length === 0) {
      alert('Please select an item to configure.');
      return;
    }

    if (selectedImages.length === 1) {
      const selectedName = selectedImages[0];
      const selectedOption = currentPaintOptions.find(opt => opt.name === selectedName);

      if (selectedOption) {
        const itemIdQueryParam = `?id=${encodeURIComponent(selectedName)}`;
        if (selectedOption.hasSubComponents && selectedOption.subComponentPagePath) {
          // Navigate to sub-component selection page, ensuring ID is passed
          router.push(`${selectedOption.subComponentPagePath}${itemIdQueryParam}`);
        } else if (selectedOption.type === 'Wrought Iron Railings') {
          // Navigate to Wrought Iron Railings config page
          router.push(`/configure/wrought-iron-railings${itemIdQueryParam}`);
        } else {
          // Default/Fallback for other single selections
          alert(`Configuration for "${selectedName}" is not yet implemented or it doesn't have sub-components.`);
        }
      } else {
        alert('Selected item details not found.'); // Should not happen if selection is from options
      }
    } else {
      // Handle multiple selections - for now, alert or decide on a strategy
      alert('Multiple item configuration is not yet supported. Please select only one item to proceed or configure items with sub-components individually.');
    }
  };

  // Sidebar Handler Functions are removed as they are now in context
  // const handleItemConfigured = (newItem: EstimateItem) => { ... };
  // const handleRemoveItem = (itemId: string | number) => { ... };
  // const handleEditItem = (itemToEdit: EstimateItem) => { ... };

  return (
    // The outer div flex container and sidebar are now in layout.tsx
    // This component just renders its specific content.
    // Applying page-specific padding here if needed, or rely on layout.tsx padding if universal.
    <div className="relative flex size-full min-h-screen flex-col group/design-root font-sans p-4 sm:p-6">
      {/* Removed bg-gray-50 as layout now handles overall background */}
      {/* Removed overflow-x-hidden as it might conflict with layout's overflow handling */}
      
      {/* The layout-container div might be redundant if layout.tsx handles full height flex */}
      {/* Or, it can be kept if it serves a specific alignment/growth purpose within this page */}
      <div className="layout-container flex h-full grow flex-col">
        {/* Header was removed previously */}
        {/* Reduced horizontal padding by changing px-40 to px-10 or px-20, for example */}
        {/* Also, py-5 can be adjusted or made part of overall page padding in layout if consistent */}
        <div className="px-4 md:px-8 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between items-center gap-3 p-4">
              <div className="flex min-w-72 flex-col gap-3">
                <p className="text-[#101518] tracking-light text-[32px] font-bold leading-tight">
                  What do you want to paint? ({currentView === 'exterior' ? 'Exterior' : 'Interior'})
                </p>
                <p className="text-[#5c748a] text-sm font-normal leading-normal">Select all that apply</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewChange('exterior')} 
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${currentView === 'exterior' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Exterior
                </button>
                <button 
                  onClick={() => handleViewChange('interior')} 
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${currentView === 'interior' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Interior
                </button>
              </div>
            </div>
            <div className={`grid grid-cols-[repeat(auto-fit,minmax(192px,1fr))] gap-1 p-4 transition-opacity duration-300 ease-in-out ${gridVisible ? 'opacity-100' : 'opacity-0'}`}>
              {currentPaintOptions.map((option, index) => {
                const selectionIndex = selectedImages.indexOf(option.name);
                const isSelected = selectionIndex !== -1;
                const selectionNumber = isSelected ? selectionIndex + 1 : 0;

                return (
                  <div 
                    key={option.name} 
                    className="flex flex-col gap-1 pb-1 cursor-pointer group"
                    onClick={() => handleImageClick(option)}
                  >
                    <div className="relative w-full rounded-xl">
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10 flex items-center justify-center size-6 bg-blue-500 text-white text-xs font-bold rounded-full ring-2 ring-white">
                          {selectionNumber}
                        </div>
                      )}
                      <Image
                        src={option.src}
                        alt={option.name}
                        width={option.imgWidth}
                        height={option.imgHeight}
                        priority={index === 0}
                        style={{
                          width: '100%',
                          height: 'auto',
                        }}
                        className={`transition-all duration-300 ease-in-out ${isSelected ? '[filter:drop-shadow(0_0_8px_rgba(59,130,246,0.9))] scale-105' : 'scale-100'}`}
                      />
                    </div>
                    <p className={`text-base font-medium leading-normal text-center transition-colors duration-200 ${isSelected ? 'text-blue-600' : 'text-[#101518]'}`}>{option.name}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex px-4 py-3 justify-end">
              <button 
                onClick={handleContinue}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-[#dce8f3] text-[#101518] text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#c9dcec] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedImages.length === 0}
              >
                <span className="truncate">Continue</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 