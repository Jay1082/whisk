'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // We'll use this for the zoomed image
import { useRouter, useSearchParams } from 'next/navigation';
import { useEstimate, EstimateItem } from '../../../context/EstimateContext'; // ADDED/RESTORED EstimateContext imports

interface SubComponent {
  id: string;
  name: string;
  coordinates?: { x: string; y: string }; // Made coordinates optional
}

interface LineData {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isSelected: boolean;
}

// Reordered and names updated as per user request
const deckSubComponents: SubComponent[] = [
  { id: 'deck-railings', name: 'Railings', coordinates: { x: '51.9%', y: '44.9%' } },
  { id: 'deck-flooring', name: 'Floors', coordinates: { x: '56.4%', y: '45.9%' } }, 
  { id: 'deck-fascia', name: 'Fascias', coordinates: { x: '58.6%', y: '53.6%' } },
  { id: 'deck-stairs', name: 'Stairs', coordinates: { x: '34.2%', y: '62.6%' } },
  { id: 'deck-posts', name: 'Supports/Collumns', coordinates: { x: '65.1%', y: '68.6%' } },
  { id: 'deck-trellis', name: 'Trellis/Verticals', coordinates: { x: '49.4%', y: '69.9%' } },
  { id: 'deck-custom', name: 'Custom' } // Added Custom button, no coordinates
];

const LINE_ENDPOINT_OFFSET = 10; // Offset in pixels from the label
const MD_BREAKPOINT = 768; // Tailwind's default md breakpoint
// IMPORTANT: Replace with the actual aspect ratio of your deck.png image (width / height)
const DECK_IMAGE_ASPECT_RATIO = 16 / 9; // Example: 1.777... for a 16:9 image

// ##### START MOVED FROM deck/page.tsx #####
// Phase 1, Step 1: Simplify OverallDeckDimensions Interface (from deck/page.tsx)
interface OverallDeckDimensions {
  deckLength: string;
  deckWidth: string;
}

// Define available coating types and difficulties for better type safety (from deck/page.tsx)
export type CoatingType = 'paint' | 'opaque_stain' | 'semi_transparent_stain' | undefined;
export type DifficultyType = 'easy' | 'medium' | 'hard' | undefined; // Default 'medium' from image
export type RailingMaterialType = 'wood' | 'composite' | 'metal' | 'concrete' | 'aluminum' | undefined; // Added concrete, aluminum. Default 'wood' from image.

// DeckSubComponentConfig interface (from deck/page.tsx)
interface DeckSubComponentConfig {
  id: string; 
  name: string;
  calculatedLength?: string;
  calculatedSqFt?: string;
  calculatedQuantity?: string; 

  effectiveLength?: string;
  effectiveSqFt?: string;
  effectiveQuantity?: string;

  userLength: string;
  userSqFt: string;
  userQuantity: string;
  height?: string;
  width?: string; // Added: for column width in posts and for trellis length if desired
  userLengthEdited?: boolean; 
  userSqFtEdited?: boolean;   
  userQuantityEdited?: boolean; 

  originalId: string; // Added: to link back to the main component type
  instanceNumber: number; // Added: to identify the set number
  baseName: string; // Added: the original name without set number
  nameUserEdited: boolean; // Added: to track if user edited the name
  placeholderForLength?: string;
  placeholderForSqFt?: string;
  placeholderForQuantity?: string;

  coatingType?: CoatingType;
  difficulty?: DifficultyType;
  railingMaterial?: RailingMaterialType; 
  coats?: number; 
  percentageAdjustment?: number; 
  
  numStairs?: string;
  stairWidth?: string;
  includeTreads?: boolean;
  includeRisers?: boolean;
  includeStringers?: boolean;
  isStairsDetailVisible?: boolean; // New state for stairs config section visibility
  preparation?: string[];
}

// DECK_PART_DEFINITIONS constant (from deck/page.tsx)
// This might slightly differ from deckSubComponents above, ensure consistency or merge.
// For now, I'll use the one from deck/page.tsx as it's tied to componentConfigs.
// The `deckSubComponents` constant above is used for the interactive image part selection.
// We will need to ensure the `id` values align.
const DECK_PART_DEFINITIONS_FOR_CONFIG: Array<{ id: string; name: string }> = [
  { id: 'deck-railings', name: 'Railings' },
  { id: 'deck-flooring', name: 'Floors' }, 
  { id: 'deck-fascia', name: 'Fascias' },
  { id: 'deck-stairs', name: 'Stairs' },
  { id: 'deck-posts', name: 'Supports/Collumns' },
  { id: 'deck-trellis', name: 'Trellis/Verticals' },
  { id: 'deck-custom', name: 'Custom' }
];


// parseFloatOrDefault helper function (from deck/page.tsx)
const parseFloatOrDefault = (value: string | undefined, defaultValue = 0): number => {
  if (value === undefined) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Type for ActivePropertyType (from deck/page.tsx)
type ActivePropertyType = 'dimensions' | 'difficulty' | 'coatingType' | 'coats' | 'percentageAdjustment' | 'railingMaterial' | 'preparation' | null;

// Preparation options and default logic
const PREPARATION_OPTIONS: string[] = ['TSP','Scrape','Grind','Fill','Caulk','Glaze','Sand','Wash','Spot Prime','Full Prime'];
const defaultPreparation = (material: RailingMaterialType | undefined): string[] => {
  switch (material) {
    case 'wood':      return ['Sand','Wash'];
    case 'aluminum':  return ['TSP','Sand'];
    case 'metal':     return ['Scrape','Grind'];
    case 'concrete':  return ['Scrape'];
    default:          return [];
  }
};

// ##### END MOVED FROM deck/page.tsx #####

export default function ConfigureDeckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItemToEstimate } = useEstimate(); // Restored
  const [selectedParts, setSelectedParts] = useState<string[]>([]); // This drives the interactive image AND now componentConfigs
  const [lines, setLines] = useState<LineData[]>([]);
  const [lastClickedCoords, setLastClickedCoords] = useState<{ x: string; y: string } | null>(null);
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null); // For hover effect
  const [isDesktopView, setIsDesktopView] = useState(true); // Assume desktop initially
  const [mainDeckItemId, setMainDeckItemId] = useState<string | null>(null);

  // ##### START STATES MOVED/ADAPTED FROM deck/page.tsx #####
  const [overallDimensions, setOverallDimensions] = useState<OverallDeckDimensions>({
    deckLength: '',
    deckWidth: '',
  });
  const [componentConfigs, setComponentConfigs] = useState<DeckSubComponentConfig[]>([]);
  const [activeEditProperty, setActiveEditProperty] = useState<ActivePropertyType>(null);
  const [activePropertyBulkValue, setActivePropertyBulkValue] = useState<
    string | number | CoatingType | DifficultyType | RailingMaterialType | string[] | undefined
  >(undefined);
  const [areParametersVisible, setAreParametersVisible] = useState(true);
  // ##### END STATES MOVED/ADAPTED FROM deck/page.tsx #####

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    const itemId = searchParams.get('id');
    if (itemId) {
      setMainDeckItemId(itemId);
    }
    const checkDeviceSize = () => {
      setIsDesktopView(window.innerWidth >= MD_BREAKPOINT);
    };
    checkDeviceSize(); // Initial check
    window.addEventListener('resize', checkDeviceSize);
    return () => window.removeEventListener('resize', checkDeviceSize);
  }, [searchParams]);

  const handlePartToggle = (partId: string) => {
    setSelectedParts(prev => 
      prev.includes(partId) ? prev.filter(id => id !== partId) : [...prev, partId]
    );
  };

  const handleImageContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    // This calculates click relative to the container, for the coordinate finder tool.
    // The actual line start points (x1, y1) will be adjusted for object-fit:contain.
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const clickXInContainer = event.clientX - containerRect.left;
    const clickYInContainer = event.clientY - containerRect.top;

    // Calculate rendered image dimensions and offsets within the container
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let renderedImageWidth, renderedImageHeight;
    if (DECK_IMAGE_ASPECT_RATIO > containerAspectRatio) {
      renderedImageWidth = containerWidth;
      renderedImageHeight = containerWidth / DECK_IMAGE_ASPECT_RATIO;
    } else {
      renderedImageHeight = containerHeight;
      renderedImageWidth = containerHeight * DECK_IMAGE_ASPECT_RATIO;
    }
    const offsetX = (containerWidth - renderedImageWidth) / 2;
    const offsetY = (containerHeight - renderedImageHeight) / 2;

    // Calculate click percentages relative to the *rendered image*
    const clickXOnRenderedImage = clickXInContainer - offsetX;
    const clickYOnRenderedImage = clickYInContainer - offsetY;

    if (clickXOnRenderedImage >= 0 && clickXOnRenderedImage <= renderedImageWidth &&
        clickYOnRenderedImage >= 0 && clickYOnRenderedImage <= renderedImageHeight) {
      const xPercent = ((clickXOnRenderedImage / renderedImageWidth) * 100).toFixed(1) + '%';
      const yPercent = ((clickYOnRenderedImage / renderedImageHeight) * 100).toFixed(1) + '%';
    } else {
      // Click was outside the visible image (in the padded area)
      setLastClickedCoords(null); // Or some indication it was outside
      console.log("Clicked outside the rendered image area.");
    }
  };

  // Populate componentConfigs based on selectedParts (adapted from deck/page.tsx's useEffect for selectedPartIds)
  useEffect(() => {
    if (selectedParts.length > 0) {
      const initialConfigs: DeckSubComponentConfig[] = selectedParts.map(partId => {
        // Use DECK_PART_DEFINITIONS_FOR_CONFIG here
        const partDefinition = DECK_PART_DEFINITIONS_FOR_CONFIG.find(p => p.id === partId);
        return {
          id: partId,
          name: partDefinition ? partDefinition.name : 'Unknown Part',
          calculatedLength: undefined,
          calculatedSqFt: undefined,
          calculatedQuantity: undefined,
          effectiveLength: undefined,
          effectiveSqFt: undefined,
          effectiveQuantity: undefined,
          userLength: '',
          userSqFt: '',
          userQuantity: '',
          height: '',
          width: partId === 'deck-posts' || partId === 'deck-trellis' ? '' : undefined,
          userLengthEdited: false,
          userSqFtEdited: false,
          userQuantityEdited: false,
          placeholderForLength: undefined,
          placeholderForSqFt: undefined,
          placeholderForQuantity: undefined,
          coatingType: 'semi_transparent_stain' as CoatingType,
          difficulty: 'medium' as DifficultyType,
          railingMaterial: 'wood' as RailingMaterialType,
          coats: 2,
          percentageAdjustment: 100,
          numStairs: partId === 'deck-stairs' ? '' : undefined,
          stairWidth: partId === 'deck-stairs' ? '' : undefined,
          includeTreads: partId === 'deck-stairs' ? true : undefined,
          includeRisers: partId === 'deck-stairs' ? false : undefined,
          includeStringers: partId === 'deck-stairs' ? false : undefined,
          isStairsDetailVisible: partId === 'deck-stairs' ? true : undefined,
          originalId: partId,
          instanceNumber: 1,
          baseName: partDefinition ? partDefinition.name : 'Unknown Part',
          nameUserEdited: false,
          preparation: defaultPreparation('wood'),
        };
      });
      // Preserve existing configs if a part is deselected and reselected later,
      // or reset them. For now, let's reset to keep it simpler.
      // If a part is deselected, it will be removed by the filter below.
      // If re-selected, it gets new defaults.
      
      // Filter out configs for parts that are no longer selected
      const currentConfigIds = new Set(initialConfigs.map(c => c.id));
      const filteredExistingConfigs = componentConfigs.filter(c => currentConfigIds.has(c.id));

      // Add new configs for newly selected parts, preserving existing if they were already configured
      const finalConfigs = selectedParts.map(partId => {
        const existing = filteredExistingConfigs.find(c => c.id === partId);
        if (existing) return existing; // Preserve existing config if it was there
        // If not existing (it's a newly selected part not previously configured in this session OR was deselected and defaults should reapply)
        const partDefinition = DECK_PART_DEFINITIONS_FOR_CONFIG.find(p => p.id === partId);
        return { // Return new default config
            id: partId,
            name: partDefinition ? partDefinition.name : 'Unknown Part',
            calculatedLength: undefined, calculatedSqFt: undefined, calculatedQuantity: undefined,
            effectiveLength: undefined, effectiveSqFt: undefined, effectiveQuantity: undefined,
            userLength: '', userSqFt: '', userQuantity: '', height: '',
            width: partId === 'deck-posts' || partId === 'deck-trellis' ? '' : undefined,
            userLengthEdited: false, userSqFtEdited: false, userQuantityEdited: false,
            placeholderForLength: undefined, placeholderForSqFt: undefined, placeholderForQuantity: undefined,
            coatingType: 'semi_transparent_stain' as CoatingType,
            difficulty: 'medium' as DifficultyType,
            railingMaterial: 'wood' as RailingMaterialType,
            coats: 2,
            percentageAdjustment: 100,
            numStairs: partId === 'deck-stairs' ? '' : undefined,
            stairWidth: partId === 'deck-stairs' ? '' : undefined,
            includeTreads: partId === 'deck-stairs' ? true : undefined,
            includeRisers: partId === 'deck-stairs' ? false : undefined,
            includeStringers: partId === 'deck-stairs' ? false : undefined,
            isStairsDetailVisible: partId === 'deck-stairs' ? true : undefined,
            originalId: partId,
            instanceNumber: 1,
            baseName: partDefinition ? partDefinition.name : 'Unknown Part',
            nameUserEdited: false,
            preparation: defaultPreparation('wood'),
        };
      });
      setComponentConfigs(finalConfigs);

    } else {
      setComponentConfigs([]); // Clear configs if no parts selected
    }
  }, [selectedParts]); // Depend on selectedParts from the interactive image

  // useEffect for lines calculation - Add componentConfigs to dependencies if it affects lines
  useEffect(() => {
    const calculateLines = () => {
      if (!imageContainerRef.current) return;
      const imageContainerRect = imageContainerRef.current.getBoundingClientRect();
      
      // Calculate rendered image dimensions and offsets
      const containerWidth = imageContainerRect.width;
      const containerHeight = imageContainerRect.height;
      const containerAspectRatio = containerWidth / containerHeight;
      let renderedImageWidth, renderedImageHeight;
      if (DECK_IMAGE_ASPECT_RATIO > containerAspectRatio) {
        renderedImageWidth = containerWidth;
        renderedImageHeight = containerWidth / DECK_IMAGE_ASPECT_RATIO;
      } else {
        renderedImageHeight = containerHeight;
        renderedImageWidth = containerHeight * DECK_IMAGE_ASPECT_RATIO;
      }
      const offsetX = (containerWidth - renderedImageWidth) / 2;
      const offsetY = (containerHeight - renderedImageHeight) / 2;

      const newLines: LineData[] = [];
      deckSubComponents.forEach(part => {
        const labelEl = labelRefs.current.get(part.id);
        if (labelEl && part.coordinates) { 
          const coordX = parseFloat(part.coordinates.x);
          const coordY = parseFloat(part.coordinates.y);

          const x1 = offsetX + (coordX / 100) * renderedImageWidth;
          const y1 = offsetY + (coordY / 100) * renderedImageHeight;
          
          const labelRect = labelEl.getBoundingClientRect();
          let x2, y2;
          if (isDesktopView) {
            x2 = (labelRect.left - imageContainerRect.left) - LINE_ENDPOINT_OFFSET;
            y2 = (labelRect.top - imageContainerRect.top) + (labelRect.height / 2);
          } else {
            x2 = (labelRect.left - imageContainerRect.left) + (labelRect.width / 2);
            y2 = imageContainerRect.height + (labelRect.top - imageContainerRect.bottom) + LINE_ENDPOINT_OFFSET; 
          }

          newLines.push({
            id: part.id, x1, y1, x2, y2,
            isSelected: selectedParts.includes(part.id),
          });
        }
      });
      setLines(newLines);
    };
    calculateLines();
    
    const resizeObserver = new ResizeObserver(() => calculateLines());
    if (imageContainerRef.current) resizeObserver.observe(imageContainerRef.current);
    labelRefs.current.forEach(labelEl => { if (labelEl) resizeObserver.observe(labelEl); });
    
    return () => resizeObserver.disconnect();
  }, [selectedParts, isDesktopView, componentConfigs]);

  // ##### START HANDLERS MOVED FROM deck/page.tsx #####
  const handleOverallDimensionChange = (
    field: keyof OverallDeckDimensions,
    value: string | boolean
  ) => {
    setOverallDimensions(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleComponentConfigChange = (
    itemId: string,
    field: keyof DeckSubComponentConfig,
    value: string | boolean | number | CoatingType | DifficultyType | RailingMaterialType | string[]
  ) => {
    setComponentConfigs(prevConfigs =>
      prevConfigs.map(config => {
        if (config.id === itemId) {
          const updatedConfig = { ...config, [field]: value };
          if (field === 'userLength') updatedConfig.userLengthEdited = true;
          else if (field === 'userSqFt') updatedConfig.userSqFtEdited = true;
          else if (field === 'userQuantity') updatedConfig.userQuantityEdited = true;
          if (field === 'percentageAdjustment') {
            updatedConfig.userLength = ''; updatedConfig.userLengthEdited = false;
            updatedConfig.userSqFt = '';   updatedConfig.userSqFtEdited = false;
            updatedConfig.userQuantity = ''; updatedConfig.userQuantityEdited = false;
          }
          // Auto-set coatingType to 'paint' for certain materials
          if (field === 'railingMaterial') {
              const material = value as RailingMaterialType;
              if (material === 'composite' || material === 'metal' || material === 'concrete' || material === 'aluminum') {
                updatedConfig.coatingType = 'paint';
              }
            }
          if (field === 'isStairsDetailVisible') {
            updatedConfig.isStairsDetailVisible = value as boolean;
            }
          if (field === 'name') {
            updatedConfig.nameUserEdited = true;
          }
          if (field === 'railingMaterial') {
            updatedConfig.railingMaterial = value as RailingMaterialType;
            updatedConfig.preparation = defaultPreparation(value as RailingMaterialType);
          }
          if (field === 'coatingType') {
            const ct = value as CoatingType;
            // if painting wood, ensure scraping
            if ((ct === 'paint' || ct === 'opaque_stain') && updatedConfig.railingMaterial === 'wood') {
              updatedConfig.preparation = Array.from(new Set([...(updatedConfig.preparation || []), 'Scrape']));
            }
          }
          return updatedConfig;
        }
        return config;
      })
    );
  };

  // Dynamic Calculation useEffect (from deck/page.tsx) - keep as is for now
   useEffect(() => {
    if (componentConfigs.length === 0 && !overallDimensions.deckLength && !overallDimensions.deckWidth) return; 
    const { deckLength: dlStr, deckWidth: dwStr } = overallDimensions;
    const deckLength = parseFloatOrDefault(dlStr);
    const deckWidth = parseFloatOrDefault(dwStr);
    let calculatedRailingLength = (deckWidth * 2) + deckLength;
    if (calculatedRailingLength < 0) calculatedRailingLength = 0;

    const newComponentConfigs = componentConfigs.map(config => {
      const newConfig = { ...config }; 
      newConfig.calculatedLength = undefined;
      newConfig.calculatedSqFt = undefined;
      switch (newConfig.originalId) {
        case 'deck-railings': newConfig.calculatedLength = calculatedRailingLength.toString(); break;
        case 'deck-flooring': newConfig.calculatedSqFt = (deckLength * deckWidth).toFixed(1); break;
        case 'deck-fascia': newConfig.calculatedLength = calculatedRailingLength.toString(); break;
        case 'deck-stairs': 
          const stairsNum = parseFloatOrDefault(newConfig.numStairs);
          const stairWidth = parseFloatOrDefault(newConfig.stairWidth);
          const treadDepth = 1; // Assumed 1ft depth per tread for sq ft calculation
          let totalSqFtForStairs = 0;

          const baseTreadArea = stairsNum * stairWidth * treadDepth;

          if (newConfig.includeTreads) {
            totalSqFtForStairs += baseTreadArea;
          }
          if (newConfig.includeRisers) {
            // Risers effectively add an equivalent to the base tread surface area
            totalSqFtForStairs += baseTreadArea; 
          }
          if (newConfig.includeStringers) {
            // Stringers add 0.75 times the base tread surface area
            totalSqFtForStairs += baseTreadArea * 0.75;
          }
          newConfig.calculatedSqFt = totalSqFtForStairs.toFixed(1);
          newConfig.calculatedQuantity = stairsNum.toString(); // Quantity is number of stairs
          break;
        case 'deck-posts': {
          // Calculate total square footage for columns/supports: width * height * quantity
          const width = parseFloatOrDefault(newConfig.width, 0);
          const height = parseFloatOrDefault(newConfig.height, 0);
          const qty = parseFloatOrDefault(newConfig.userQuantity, 0);
          const area = width * height * qty;
          newConfig.calculatedSqFt = area.toFixed(1);
          // Do not set calculatedQuantity for posts; display area instead
          newConfig.calculatedQuantity = undefined;
          break;
        }
        case 'deck-trellis':
          // Calculate area for trellis/verticals: length * height
          const trellisLength = parseFloatOrDefault(newConfig.userLength, 0);
          const trellisHeight = parseFloatOrDefault(newConfig.height, 0);
          newConfig.calculatedSqFt = (trellisLength * trellisHeight).toFixed(1);
          break;
        default: break;
      }
      const percentage = (newConfig.percentageAdjustment || 100) / 100;

      // === Updated rounding & blank defaults ===
      // Round up to nearest whole number; blank if zero
      const baseCalcLength = parseFloatOrDefault(newConfig.calculatedLength);
      const ceilLength = Math.ceil(baseCalcLength * percentage);
      const autoCalcLenStr = ceilLength > 0 ? ceilLength.toString() : '';
      newConfig.placeholderForLength = autoCalcLenStr;
      if (newConfig.userLengthEdited) {
        newConfig.effectiveLength = newConfig.userLength.trim() !== '' ? newConfig.userLength : '';
      } else {
        newConfig.effectiveLength = autoCalcLenStr;
        newConfig.userLength = autoCalcLenStr;
      }

      const baseCalcSqFt = parseFloatOrDefault(newConfig.calculatedSqFt);
      const ceilSqFt = Math.ceil(baseCalcSqFt * percentage);
      const autoCalcSqFtStr = ceilSqFt > 0 ? ceilSqFt.toString() : '';
      newConfig.placeholderForSqFt = autoCalcSqFtStr;
      if (newConfig.userSqFtEdited) {
        newConfig.effectiveSqFt = newConfig.userSqFt.trim() !== '' ? newConfig.userSqFt : '';
      } else {
        newConfig.effectiveSqFt = autoCalcSqFtStr;
        newConfig.userSqFt = autoCalcSqFtStr;
      }

      const baseCalcQuantity = parseFloatOrDefault(newConfig.calculatedQuantity);
      const ceilQty = Math.ceil(baseCalcQuantity * percentage);
      const autoCalcQtyStr = ceilQty > 0 ? ceilQty.toString() : '';
      newConfig.placeholderForQuantity = autoCalcQtyStr;
      if (newConfig.userQuantityEdited) {
        newConfig.effectiveQuantity = newConfig.userQuantity.trim() !== '' ? newConfig.userQuantity : '';
      } else {
        if (newConfig.originalId === 'deck-posts' && newConfig.calculatedQuantity === undefined) {
          newConfig.effectiveQuantity = '';
          newConfig.userQuantity = '';
        } else {
          newConfig.effectiveQuantity = autoCalcQtyStr;
          newConfig.userQuantity = autoCalcQtyStr;
        }
      }
      return newConfig;
    });
    if (JSON.stringify(newComponentConfigs) !== JSON.stringify(componentConfigs)) {
        setComponentConfigs(newComponentConfigs);
    }
  }, [overallDimensions, componentConfigs]); // This effect's dependencies seem correct

  const handleApplyBulkEditToActiveProperty = () => {
    if (!activeEditProperty || activePropertyBulkValue === undefined || componentConfigs.length === 0) return;
    setComponentConfigs(prevConfigs => 
      prevConfigs.map(config => {
        const updatedConfig = { ...config };
        // Apply the bulk value
        (updatedConfig[activeEditProperty as keyof DeckSubComponentConfig] as any) = activePropertyBulkValue;

        if (activeEditProperty === 'railingMaterial') {
            const material = activePropertyBulkValue as RailingMaterialType;
            if (material === 'composite' || material === 'metal' || material === 'concrete' || material === 'aluminum') {
                updatedConfig.coatingType = 'paint';
            }
            updatedConfig.preparation = defaultPreparation(material);
        } else if (activeEditProperty === 'percentageAdjustment') {
            updatedConfig.userLength = ''; updatedConfig.userLengthEdited = false;
            updatedConfig.userSqFt = '';   updatedConfig.userSqFtEdited = false;
            updatedConfig.userQuantity = ''; updatedConfig.userQuantityEdited = false;
        } else if (activeEditProperty === 'preparation') {
            updatedConfig.preparation = activePropertyBulkValue as string[];
        }
        return updatedConfig;
      })
    );
  };

  const handleSaveConfiguration = () => {
    if (!mainDeckItemId) {
      alert("Error: Main Deck Item ID is missing. Cannot save."); return;
    }
    if (componentConfigs.length === 0 && selectedParts.length === 0) {
      alert("Error: No deck parts were selected or configured. Please go back and select parts."); return;
    }
    const deckLengthNum = parseFloatOrDefault(overallDimensions.deckLength);
    const deckWidthNum = parseFloatOrDefault(overallDimensions.deckWidth);
    let summary = `Configured Deck`;
    if (deckLengthNum > 0 && deckWidthNum > 0) {
      summary += `: ${deckLengthNum}ft x ${deckWidthNum}ft`;
    }
    const numConfiguredComponentInstances = componentConfigs.filter(c => c.originalId !== 'deck-custom' || c.userLength || c.userSqFt || c.userQuantity || c.height).length;
    summary += ` (${numConfiguredComponentInstances} component instance${numConfiguredComponentInstances === 1 ? '' : 's'})`;

    const estimateItem: EstimateItem = {
      id: mainDeckItemId,
      type: 'Deck Configuration',
      configurationSummary: summary,
      price: 0, 
      isConfigured: true,
      rawConfigurationData: {
        overallDimensions, 
        components: componentConfigs.map(comp => ({
          id: comp.id,
          originalId: comp.originalId,
          instanceNumber: comp.instanceNumber,
          name: comp.name,
          calculatedLength: comp.calculatedLength, calculatedSqFt: comp.calculatedSqFt, calculatedQuantity: comp.calculatedQuantity,
          effectiveLength: comp.effectiveLength, effectiveSqFt: comp.effectiveSqFt, effectiveQuantity: comp.effectiveQuantity,
          userLength: comp.userLength, userSqFt: comp.userSqFt, userQuantity: comp.userQuantity, height: comp.height,
          coatingType: comp.coatingType, difficulty: comp.difficulty, railingMaterial: comp.railingMaterial,
          coats: comp.coats, percentageAdjustment: comp.percentageAdjustment,
          numStairs: comp.numStairs, stairWidth: comp.stairWidth,
          includeTreads: comp.includeTreads, includeRisers: comp.includeRisers, includeStringers: comp.includeStringers,
          preparation: comp.preparation,
        })),
      },
    };
    addItemToEstimate(estimateItem);
    alert("Deck configuration saved to estimate!");
    router.push('/'); 
  };

  const updateComponentNamesInList = useCallback((configs: DeckSubComponentConfig[]): DeckSubComponentConfig[] => {
    const counts: Record<string, number> = {};
    configs.forEach(c => {
      counts[c.originalId] = (counts[c.originalId] || 0) + 1;
    });
  
    return configs.map(c => {
      if (c.nameUserEdited && c.name !== '') return c; // Respect user's custom name, unless it's blank then allow reset
      
      const totalInstances = counts[c.originalId];
      const newName = totalInstances > 1 ? `${c.baseName} (Set ${c.instanceNumber})` : c.baseName;
      // If name was user-edited to blank, reset nameUserEdited to false so it can pick up default naming
      const nameUserEdited = c.nameUserEdited && c.name !== ''; 
      return { ...c, name: c.nameUserEdited && c.name !== '' ? c.name : newName, nameUserEdited };
    });
  }, []);

  useEffect(() => {
    setComponentConfigs(prevConfigs => updateComponentNamesInList(prevConfigs));
  }, [componentConfigs.length]); // Re-run naming logic if the number of components changes

  const handleInstanceCountChange = (originalIdToChange: string, action: 'increment' | 'decrement') => {
    setComponentConfigs(prevConfigs => {
      let newConfigs = [...prevConfigs];
      const instancesOfOriginalId = prevConfigs.filter(c => c.originalId === originalIdToChange);
      const currentCount = instancesOfOriginalId.length;
  
      if (action === 'increment') {
        const newInstanceNumber = currentCount + 1;
        const partDefinition = DECK_PART_DEFINITIONS_FOR_CONFIG.find(p => p.id === originalIdToChange);
        const baseName = partDefinition ? partDefinition.name : 'Unknown Part';
        
        const newInstance: DeckSubComponentConfig = {
          id: `${originalIdToChange}_${newInstanceNumber}`,
          originalId: originalIdToChange,
          instanceNumber: newInstanceNumber,
          baseName: baseName,
          name: baseName,
          nameUserEdited: false,
          calculatedLength: undefined, calculatedSqFt: undefined, calculatedQuantity: undefined,
          effectiveLength: undefined, effectiveSqFt: undefined, effectiveQuantity: undefined,
          userLength: '', userSqFt: '', userQuantity: '', height: '',
          width: originalIdToChange === 'deck-posts' || originalIdToChange === 'deck-trellis' ? '' : undefined,
          userLengthEdited: false, userSqFtEdited: false, userQuantityEdited: false,
          placeholderForLength: undefined, placeholderForSqFt: undefined, placeholderForQuantity: undefined,
          coatingType: 'semi_transparent_stain' as CoatingType,
          difficulty: 'medium' as DifficultyType,
          railingMaterial: 'wood' as RailingMaterialType,
          coats: 2,
          percentageAdjustment: 100,
          numStairs: originalIdToChange === 'deck-stairs' ? '' : undefined,
          stairWidth: originalIdToChange === 'deck-stairs' ? '' : undefined,
          includeTreads: originalIdToChange === 'deck-stairs' ? true : undefined,
          includeRisers: originalIdToChange === 'deck-stairs' ? false : undefined,
          includeStringers: originalIdToChange === 'deck-stairs' ? false : undefined,
          isStairsDetailVisible: originalIdToChange === 'deck-stairs' ? true : undefined,
          preparation: defaultPreparation('wood'),
        };
        newConfigs.push(newInstance);
      } else if (action === 'decrement' && currentCount > 1) {
        newConfigs = newConfigs.filter(c => !(c.originalId === originalIdToChange && c.instanceNumber === currentCount));
      }
      
      return updateComponentNamesInList(newConfigs);
    });
  };
  // ##### END HANDLERS MOVED FROM deck/page.tsx #####

  // Placeholder image - replace with actual zoomed deck image later
  const deckImageSrc = '/components/exterior/deck.png';

  // Define propertyButtons here as it's used in the JSX being moved
  const propertyButtons: { label: string; value: ActivePropertyType }[] = [
    { label: 'Difficulty', value: 'difficulty' },
    { label: 'Finish', value: 'coatingType' },
    { label: 'Coats', value: 'coats' },
    { label: 'Percentage', value: 'percentageAdjustment' },
    { label: 'Material', value: 'railingMaterial'},
    { label: 'Preparation', value: 'preparation'},
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-5xl"> {/* Max width can be adjusted */} 
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
            <svg className="mr-2 size-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7"></path></svg>
            Back to Main Selection
          </Link>
        </div>

        <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Select Deck Components</h1>
          
          <div className="flex flex-col md:flex-row gap-12"> {/* Increased gap */}
            {/* Left Side: Zoomed Image Area */}
            <div 
              ref={imageContainerRef} 
              className="md:w-2/3 relative rounded-lg min-h-[400px] cursor-crosshair"
              onClick={handleImageContainerClick}
            >
              <Image 
                src={deckImageSrc} 
                alt="Deck"
                fill
                sizes="(max-width: 767px) 100vw, 66vw"
                priority
                className="pointer-events-none object-contain"
              />
              <svg 
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }} // To ensure lines aren't clipped if they go slightly outside bounds due to stroke width
              >
                {lines.map(line => {
                  const isActuallySelected = line.isSelected;
                  const isActuallyHovered = hoveredPartId === line.id;
                  
                  let outlineStrokeColor = 'rgb(107 114 128)'; // Default gray-500
                  if (isActuallySelected) {
                    outlineStrokeColor = '#2563eb'; // Blue-600 for selected
                  } else if (isActuallyHovered) {
                    outlineStrokeColor = '#0ea5e9'; // Sky-500 for hover (if not selected)
                  }

                  return (
                    <React.Fragment key={`group-${line.id}`}>
                      {/* Outline line */}
                      <line 
                        x1={line.x1} y1={line.y1} 
                        x2={line.x2} y2={line.y2} 
                        stroke={outlineStrokeColor}
                        strokeWidth="4" // Consistent thickness as per user's last adjustment
                        strokeLinecap="round" 
                      />
                      {/* Inner white line */}
                      <line 
                        x1={line.x1} y1={line.y1} 
                        x2={line.x2} y2={line.y2} 
                        stroke="white"
                        strokeWidth="2" // Consistent thickness
                        strokeLinecap="round" 
                      />
                      {/* Only render circle if coordinates exist for the part (i.e., not for 'Custom') */}
                      {deckSubComponents.find(p => p.id === line.id)?.coordinates && (
                        <circle 
                          cx={line.x1} 
                          cy={line.y1} 
                          r={isActuallyHovered && !isActuallySelected ? "7" : "5"} // Pulse effect on hover
                          fill="white" 
                          stroke={outlineStrokeColor}
                          strokeWidth="1.5" 
                          style={{ transition: 'r 0.2s ease-in-out' }} // Smooth transition for pulse
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </svg>
            </div>

            {/* Right Side: Clickable Sub-Component List */}
            <div className="md:w-1/3 space-y-3">
              {deckSubComponents.map(part => {
                const isSelected = selectedParts.includes(part.id);
                const instances = componentConfigs.filter(c => c.originalId === part.id);
                const currentInstanceCount = isSelected ? instances.length : 0;

                return (
                  <div 
                    key={part.id}
                    ref={el => { if (el) labelRefs.current.set(part.id, el); else labelRefs.current.delete(part.id); }}
                    onMouseEnter={() => setHoveredPartId(part.id)}
                    onMouseLeave={() => setHoveredPartId(null)}
                    className={`flex items-center justify-between w-full p-0.5 rounded-lg transition-colors text-sm border
                      ${isSelected ? (part.id === hoveredPartId ? 'bg-blue-100 border-blue-400' : 'bg-blue-50 border-blue-300') : (part.id === hoveredPartId ? 'bg-slate-100 border-gray-400' : 'bg-slate-50 border-gray-300 hover:bg-slate-100')}`}
                  >
                    <button 
                      onClick={() => handlePartToggle(part.id)}
                      className={`flex-grow text-left px-3 py-2 rounded-l-md
                        ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-700 font-medium'}
                        ${part.id === 'deck-custom' ? 'font-bold' : ''}
                        focus:outline-none`}
                    >
                      {part.name} {isSelected && currentInstanceCount > 0 && `(x${currentInstanceCount})`}
                    </button>
                    {isSelected && currentInstanceCount > 0 && (
                      <div className="flex items-center space-x-0.5 pr-1.5">
                        {currentInstanceCount > 1 && (
                          <button
                            onClick={() => handleInstanceCountChange(part.id, 'decrement')}
                            className="p-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            aria-label={`Decrease count for ${part.name}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleInstanceCountChange(part.id, 'increment')}
                          className="p-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          aria-label={`Increase count for ${part.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clicked Coords display moved here */} 
          {lastClickedCoords && (
            <div className="mt-4 p-3 border border-blue-300 bg-blue-50 rounded-md text-sm">
              <p className="font-semibold">Last clicked image coordinates (relative to visible image):</p>
              <p>x: <code>{lastClickedCoords.x}</code>, y: <code>{lastClickedCoords.y}</code></p>
            </div>
          )}

          {/* Spacer div */}
          <div className="my-8"></div>

          {/* ##### START CONFIGURATION UI MOVED FROM deck/page.tsx ##### */}
          {/* Conditionally render configuration sections only if parts are selected */}
          {selectedParts.length > 0 && (
            <div className="mt-8 w-full"> {/* Ensure this takes full width within its container */}
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-t pt-6">
                Configure Selected Components
              </h2>

              {/* Quick Deck Dimensions Card */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Overall Deck Dimensions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label htmlFor="deckLength" className="block text-sm font-medium text-gray-700 mb-1">Deck Length</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <input 
                        type="number" name="deckLength" id="deckLength"
                        value={overallDimensions.deckLength}
                        onChange={(e) => handleOverallDimensionChange('deckLength', e.target.value)}
                        className="block w-full border border-gray-300 rounded-md px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., 20"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-gray-500 sm:text-sm">ft</span></div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="deckWidth" className="block text-sm font-medium text-gray-700 mb-1">Deck Width</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <input 
                        type="number" name="deckWidth" id="deckWidth"
                        value={overallDimensions.deckWidth}
                        onChange={(e) => handleOverallDimensionChange('deckWidth', e.target.value)}
                        className="block w-full border border-gray-300 rounded-md px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., 10"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-gray-500 sm:text-sm">ft</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Property Section */}
              <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-gray-200 shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Edit Property for Selected Components:</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {propertyButtons.map(btn => (
                    <button
                      key={btn.value}
                      onClick={() => {
                        setActiveEditProperty(activeEditProperty === btn.value ? null : btn.value);
                        setActivePropertyBulkValue(undefined); 
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                        ${activeEditProperty === btn.value ? 'bg-indigo-600 text-white border-transparent' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                  {activeEditProperty && (
                    <button
                      onClick={() => {
                        setActiveEditProperty(null);
                        setActivePropertyBulkValue(undefined);
                      }}
                      className="px-3 py-1.5 text-sm font-medium rounded-md border border-red-500 text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Done Editing Property
                    </button>
                  )}
                </div>
                {activeEditProperty && componentConfigs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Apply "{propertyButtons.find(p=>p.value === activeEditProperty)?.label || 'Selected Property'}" to All Selected Components:</h4>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-1.5">
                      {activeEditProperty === 'coatingType' && (
                        <select 
                          value={activePropertyBulkValue as CoatingType || ''} 
                          onChange={e => setActivePropertyBulkValue(e.target.value as CoatingType || undefined)}
                          className="flex-grow text-sm p-1.5 rounded-md border border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500 min-w-[140px]"
                        >
                          <option value="">Select Finish...</option>
                          <option value="paint">Paint</option>
                          <option value="opaque_stain">Opaque Stain</option>
                          <option value="semi_transparent_stain">Semi-Trans Stain</option>
                        </select>
                      )}
                      {activeEditProperty === 'coats' && (
                         <select 
                          value={activePropertyBulkValue as number || ''} 
                          onChange={e => setActivePropertyBulkValue(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="flex-grow text-sm p-1.5 rounded-md border border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500 min-w-[140px]"
                        >
                          <option value="">Select Coats...</option>
                          <option value="1">1 Coat</option>
                          <option value="2">2 Coats</option>
                          <option value="3">3 Coats</option>
                        </select>
                      )}
                      {activeEditProperty === 'difficulty' && (
                         <select 
                          value={activePropertyBulkValue as DifficultyType || ''} 
                          onChange={e => setActivePropertyBulkValue(e.target.value as DifficultyType || undefined)}
                          className="flex-grow text-sm p-1.5 rounded-md border border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500 min-w-[140px]"
                        >
                          <option value="">Select Difficulty...</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      )}
                      {activeEditProperty === 'percentageAdjustment' && (
                         <input 
                          type="number"
                          value={activePropertyBulkValue as number || ''} 
                          onChange={e => setActivePropertyBulkValue(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="flex-grow text-sm p-1.5 rounded-md border border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500 min-w-[140px]"
                          placeholder="Enter % (e.g., 100)"
                        />
                      )}
                      {activeEditProperty === 'railingMaterial' && (
                         <select 
                          value={activePropertyBulkValue as RailingMaterialType || ''} 
                          onChange={e => setActivePropertyBulkValue(e.target.value as RailingMaterialType || undefined)}
                          className="flex-grow text-sm p-1.5 rounded-md border border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select Material...</option>
                          <option value="wood">Wood</option>
                          <option value="composite">Composite</option>
                          <option value="metal">Metal</option>
                          <option value="concrete">Concrete</option>
                          <option value="aluminum">Aluminum</option>
                        </select>
                      )}
                      {activeEditProperty === 'preparation' && (
                        <div className="flex flex-wrap gap-1">
                          {PREPARATION_OPTIONS.map(opt => {
                            const selected = Array.isArray(activePropertyBulkValue) && activePropertyBulkValue.includes(opt);
                            return (
                              <button
                                key={opt}
                                onClick={() => {
                                  const next = selected
                                    ? (activePropertyBulkValue as string[]).filter(p => p !== opt)
                                    : [...(activePropertyBulkValue as string[]), opt];
                                  setActivePropertyBulkValue(next);
                                }}
                                className={`px-2 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap ${
                                  selected
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <button 
                        onClick={handleApplyBulkEditToActiveProperty}
                        disabled={activePropertyBulkValue === undefined}
                        className="px-3 py-1 text-sm font-semibold rounded-md border border-green-500 bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 disabled:bg-green-400 w-full sm:w-auto"
                      >
                        Apply to All Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Component Details Section */}
              <div>
                <div className="flex justify-between items-center mb-4 mt-6">
                  <h3 className="text-xl font-semibold text-gray-700">Configure Individual Components</h3>
                  <button
                    onClick={() => setAreParametersVisible(prev => !prev)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                  >
                    {areParametersVisible ? 'Hide All Parameters' : 'Show All Parameters'}
                  </button>
                </div>
                {componentConfigs.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {componentConfigs.map(config => {
                      // railings in linear feet; all other components in square feet
                      let primaryDimensionDisplay: string;
                      let dimensionUnit: string;
                      let userValueField: keyof DeckSubComponentConfig;
                      let actualInputPlaceholder: string | undefined;

                      if (config.originalId === 'deck-railings') {
                        // linear feet for railings
                        primaryDimensionDisplay = `${parseFloatOrDefault(config.effectiveLength, 0).toFixed(1)} ft`;
                        dimensionUnit = 'ln.ft';
                        userValueField = 'userLength';
                        actualInputPlaceholder = config.placeholderForLength;
                      } else {
                        // area in square feet for all other components
                        primaryDimensionDisplay = `${parseFloatOrDefault(config.effectiveSqFt, 0).toFixed(1)} sq.ft`;
                        dimensionUnit = 'sq.ft';
                        userValueField = 'userSqFt';
                        actualInputPlaceholder = config.placeholderForSqFt;
                      }

                      return (
                        <div key={config.id} className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
                          {/* Row 1: Name input (auto-sizing) and controls aligned to edges */}
                          {/* Apply mb-3 only if parameters are visible OR if stairs details are visible below this row. */}
                          <div className={`flex items-center justify-between flex-wrap ${ (areParametersVisible ||
                            (config.originalId === 'deck-stairs' && config.isStairsDetailVisible))
                            ? 'mb-3' : ''
                          }`}>
                            {/* Component name input: auto-size to content */}
                            {(() => {
                              const placeholderText =
                                config.baseName +
                                (componentConfigs.filter(
                                  (c) => c.originalId === config.originalId,
                                ).length > 1
                                  ? ` (Set ${config.instanceNumber})`
                                  : '');

                              return (
                                <input
                                  type="text"
                                  value={config.name}
                                  onChange={(e) =>
                                    handleComponentConfigChange(
                                      config.id,
                                      'name',
                                      e.target.value,
                                    )
                                  }
                                  placeholder={placeholderText}
                                  size={config.name.length || placeholderText.length}
                                  className="text-lg font-bold text-gray-800 bg-transparent rounded-md outline-none px-0 py-1 focus:bg-white focus:ring-1 focus:ring-indigo-500 w-auto"
                                />
                              );
                            })()}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Configure / Hide toggle for details */}
                              {['deck-stairs','deck-posts','deck-trellis'].includes(config.originalId) && (
                                <button
                                  onClick={() =>
                                    handleComponentConfigChange(
                                      config.id,
                                      'isStairsDetailVisible',
                                      !config.isStairsDetailVisible,
                                    )
                                  }
                                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                                >
                                  {config.isStairsDetailVisible ? 'Hide' : 'Configure'}
                                </button>
                              )}
                              {/* SqFt / area input */}
                              <input
                                type="number"
                                value={(config[userValueField] as string) || ''}
                                onChange={(e) =>
                                  handleComponentConfigChange(
                                    config.id,
                                    userValueField,
                                    e.target.value,
                                  )
                                }
                                placeholder={actualInputPlaceholder || ''}
                                className="w-20 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 text-right"
                              />
                              <span className="text-xs text-gray-500">{dimensionUnit}</span>
                            </div>
                          </div>

                          {/* Row 2: Stairs specific configuration (conditionally rendered for stairs) */}
                          {config.originalId === 'deck-stairs' && config.isStairsDetailVisible && (
                            <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                              {/* Reverted to two-column layout, ensuring buttons remain small */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2"> 
                                {/* Column 1: Steps and Width inputs */}
                                <div className="space-y-2">
                                  <div>
                                    <label htmlFor={`steps-${config.id}`} className="block text-sm font-medium text-gray-700 mb-1">Steps:</label>
                                    <input id={`steps-${config.id}`} type="number" value={config.numStairs || ''} onChange={e => handleComponentConfigChange(config.id, 'numStairs', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 4"/>
                                  </div>
                                  <div>
                                    <label htmlFor={`width-${config.id}`} className="block text-sm font-medium text-gray-700 mb-1">Width (ft):</label>
                                    <input id={`width-${config.id}`} type="number" value={config.stairWidth || ''} onChange={e => handleComponentConfigChange(config.id, 'stairWidth', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 3"/>
                                  </div>
                                </div>

                                {/* Column 2: Include buttons (smaller size) */}
                                <div className="space-y-1 flex flex-col items-start"> {/* Tighter spacing for buttons */}
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Include:</label>
                                  {(['Treads', 'Risers', 'Stringers'] as const).map(compName => {
                                    const fieldKey = `include${compName}` as keyof DeckSubComponentConfig;
                                    const isSelected = !!config[fieldKey];
                                    return (
                                      <button
                                        key={compName}
                                        onClick={() => handleComponentConfigChange(config.id, fieldKey, !isSelected)}
                                        className={`w-full text-left px-2 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap 
                                          ${isSelected ? 'bg-indigo-500 text-white border-indigo-600 ring-1 ring-indigo-400' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                      >
                                        {compName}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Details for posts/supports */}
                          {config.originalId === 'deck-posts' && config.isStairsDetailVisible && (
                            <>
                              <div className="mt-4 pt-3 border-t border-gray-200 flex space-x-2">
                                <button
                                  onClick={() => handleComponentConfigChange(config.id, 'name', 'Columns')}
                                  className={`px-2 py-1 text-xs font-medium rounded-md ${config.name === 'Columns' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                                >
                                  Columns
                                </button>
                                <button
                                  onClick={() => handleComponentConfigChange(config.id, 'name', 'Supports')}
                                  className={`px-2 py-1 text-xs font-medium rounded-md ${config.name === 'Supports' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                                >
                                  Supports
                                </button>
                              </div>
                              <div className="mt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
                                  <div>
                                    <label htmlFor={`width-${config.id}`} className="block text-sm font-medium text-gray-700 mb-1">Width (ft):</label>
                                    <input
                                      id={`width-${config.id}`}
                                      type="number"
                                      value={config.width || ''}
                                      onChange={e => handleComponentConfigChange(config.id, 'width', e.target.value)}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder="e.g., 1"
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`height-${config.id}`} className="block text-sm font-medium text-gray-700 mb-1">Height (ft):</label>
                                    <input
                                      id={`height-${config.id}`}
                                      type="number"
                                      value={config.height || ''}
                                      onChange={e => handleComponentConfigChange(config.id, 'height', e.target.value)}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder="e.g., 8"
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`quantity-${config.id}`} className="block text-sm font-medium text-gray-700 mb-1">Quantity:</label>
                                    <input
                                      id={`quantity-${config.id}`}
                                      type="number"
                                      value={config.userQuantity || ''}
                                      onChange={e => handleComponentConfigChange(config.id, 'userQuantity', e.target.value)}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder="e.g., 4"
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Details for trellis/verticals */}
                          {config.originalId === 'deck-trellis' && config.isStairsDetailVisible && (
                            <>
                              <div className="mt-4 pt-3 border-t border-gray-200 flex space-x-2">
                                <button
                                  onClick={() => handleComponentConfigChange(config.id, 'name', 'Trellis')}
                                  className={`px-2 py-1 text-xs font-medium rounded-md ${config.name === 'Trellis' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                                >
                                  Trellis
                                </button>
                                <button
                                  onClick={() => handleComponentConfigChange(config.id, 'name', 'Verticals')}
                                  className={`px-2 py-1 text-xs font-medium rounded-md ${config.name === 'Verticals' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                                >
                                  Verticals
                                </button>
                              </div>
                              <div className="mt-2">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  <div>
                                    <label htmlFor={`length-${config.id}`} className="block text-sm font-medium text-gray-700 mb-1">Length (ft):</label>
                                    <input
                                      id={`length-${config.id}`}
                                      type="number"
                                      value={config.userLength || ''}
                                      onChange={e => handleComponentConfigChange(config.id, 'userLength', e.target.value)}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder="e.g., 10"
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`height-${config.id}`} className="block text-sm font-medium text-gray-700 mb-1">Height (ft):</label>
                                    <input
                                      id={`height-${config.id}`}
                                      type="number"
                                      value={config.height || ''}
                                      onChange={e => handleComponentConfigChange(config.id, 'height', e.target.value)}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder="e.g., 8"
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {areParametersVisible && (
                            <>
                              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 ${['deck-stairs','deck-posts','deck-trellis'].includes(config.originalId) && config.isStairsDetailVisible ? 'mt-4 pt-4 border-t' : 'mt-0'}`}>
                                <div className="sm:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjust %</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={config.percentageAdjustment || ''}
                                      onChange={(e) => handleComponentConfigChange(config.id, 'percentageAdjustment', e.target.value ? parseInt(e.target.value) : undefined)}
                                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                      placeholder="100"
                                    />
                                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">%</span>
                                  </div>
                                </div>

                                <div className="sm:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Finish</label>
                                  <select 
                                    value={config.coatingType || ''} 
                                    onChange={e => handleComponentConfigChange(config.id, 'coatingType', e.target.value as CoatingType || undefined)}
                                    className="w-full text-sm px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="">Select...</option>
                                    <option value="paint">Paint</option>
                                    <option value="opaque_stain">Opaque Stain</option>
                                    <option value="semi_transparent_stain">Semi-Trans Stain</option>
                                  </select>
                                </div>
                                
                                <div className="sm:col-span-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Coats</label>
                                  <div className="flex -space-x-px">
                                    {([1, 2, 3] as number[]).map(num => (
                                      <button 
                                        key={num}
                                        onClick={() => handleComponentConfigChange(config.id, 'coats', config.coats === num ? undefined : num)}
                                        className={`relative inline-flex items-center justify-center w-1/3 px-3 py-2 text-sm border border-gray-300 font-medium transition-colors
                                          ${num === 1 ? 'rounded-l-md' : ''}
                                          ${num === 3 ? 'rounded-r-md' : ''}
                                          ${config.coats === num ? 'bg-indigo-600 text-white z-10 ring-1 ring-indigo-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                  <div className="flex -space-x-px">
                                    {(['easy', 'medium', 'hard'] as DifficultyType[]).map(type => {
                                      const sel = config.difficulty === type;
                                      return (
                                        <button
                                          key={type}
                                          onClick={() =>
                                            handleComponentConfigChange(
                                              config.id,
                                              'difficulty',
                                              sel ? undefined : type
                                            )
                                          }
                                          className={`relative inline-flex items-center justify-center w-1/3 px-3 py-2 text-sm border border-gray-300 font-medium transition-colors capitalize
                                            ${type === 'easy' ? 'rounded-l-md' : ''}
                                            ${type === 'hard' ? 'rounded-r-md' : ''}
                                            ${sel ? 'bg-indigo-600 text-white z-10 ring-1 ring-indigo-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                        >
                                          {type}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                                  <select
                                    value={config.railingMaterial || ''}
                                    onChange={e =>
                                      handleComponentConfigChange(
                                        config.id,
                                        'railingMaterial',
                                        e.target.value as RailingMaterialType || undefined
                                      )
                                    }
                                    className="w-full text-sm px-3 py-2 rounded-md border border-gray-300 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="">Select...</option>
                                    <option value="wood">Wood</option>
                                    <option value="composite">Composite</option>
                                    <option value="metal">Metal</option>
                                    <option value="concrete">Concrete</option>
                                    <option value="aluminum">Aluminum</option>
                                  </select>
                                </div>
                              </div>
                              
                              {/* Preparation */}
                              <div className="sm:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preparation</label>
                                <div className="flex flex-wrap gap-1">
                                  {PREPARATION_OPTIONS.map(opt => {
                                    const selected = config.preparation?.includes(opt);
                                    return (
                                      <button
                                        key={opt}
                                        onClick={() => {
                                          const next = selected
                                            ? (config.preparation || []).filter(p => p !== opt)
                                            : [...(config.preparation || []), opt];
                                          handleComponentConfigChange(config.id, 'preparation', next);
                                        }}
                                        className={`px-2 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap ${
                                          selected
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                          
                        </div> 
                      );
                    })} 
                  </div> 
                ) : (
                  <p className="text-gray-500">Select components from the diagram above to configure them.</p>
                )}
              </div>
            </div>
          )}
          {/* ##### END CONFIGURATION UI MOVED FROM deck/page.tsx ##### */}

        </div> {/* Closes main content card (bg-white shadow-xl) */}

        {/* ADD Save Button here, after the main content card */}
        {selectedParts.length > 0 && mainDeckItemId && (
          <div className="w-full mt-8 pt-6 border-t border-gray-200 flex justify-end">
            <button 
              onClick={handleSaveConfiguration}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors disabled:opacity-50 w-full md:w-auto"
              disabled={selectedParts.length === 0 || !mainDeckItemId} // Keep disabled logic consistent
            >
              Save Configuration & Add to Estimate
            </button>
          </div>
        )}

      </div>
    </div>
  );
} 