'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEstimate } from '../../../context/EstimateContext';
import { EstimateItem } from '../../../context/EstimateContext';

export default function ConfigureWroughtIronRailingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItemToEstimate } = useEstimate();

  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [originalItemName, setOriginalItemName] = useState<string>('');

  const [decorativeness, setDecorativeness] = useState<string>('');
  const [rustiness, setRustiness] = useState<string>('');
  const [plantsInWay, setPlantsInWay] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [height, setHeight] = useState<string>('');

  useEffect(() => {
    const idFromQuery = searchParams.get('id');
    if (idFromQuery) {
      setCurrentItemId(idFromQuery);
      setOriginalItemName(idFromQuery);
    }
  }, [searchParams]);

  const decorativenessOptions = [
    { label: 'Minimal', value: 'minimal' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'Highly Ornate', value: 'ornate' },
  ];

  const rustinessOptions = [
    { label: 'None', value: 'none' },
    { label: 'Light', value: 'light' },
    { label: 'Heavy', value: 'heavy' },
  ];

  const plantsOptions = [
    { label: 'No', value: 'no' },
    { label: 'Yes, a few', value: 'few' },
    { label: 'Yes, overgrown', value: 'overgrown' },
  ];

  const clearForm = useCallback(() => {
    setDecorativeness('');
    setRustiness('');
    setPlantsInWay('');
    setLength('');
    setHeight('');
  }, []);

  const renderOptionButton = (
    options: { label: string; value: string }[],
    selectedValue: string,
    setter: (value: string) => void,
    groupName: string
  ) => {
    return options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => setter(option.value)}
        className={`px-4 py-2 text-sm rounded-md border transition-colors font-medium 
          ${selectedValue === option.value 
            ? 'bg-blue-600 border-blue-600 text-white' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
      >
        {option.label}
      </button>
    ));
  };

  const saveCurrentConfiguration = (): boolean => {
    if (!currentItemId) {
      alert('Item ID is missing. Cannot add to estimate.');
      return false;
    }
    if (!decorativeness || !rustiness || !plantsInWay || !length || !height) {
      alert('Please complete all configuration options before adding.');
      return false;
    }

    const configurationSummary = 
      `Decor: ${decorativeness}, Rust: ${rustiness}, Plants: ${plantsInWay}, ` +
      `Length: ${length} ft, Height: ${height} ft`;
    
    const rawConfigurationData = {
      decorativeness,
      rustiness,
      plantsInWay,
      length,
      height,
    };

    const newItem: EstimateItem = {
      id: currentItemId,
      type: originalItemName || 'Wrought Iron Railings',
      configurationSummary,
      price: 500,
      rawConfigurationData,
      isConfigured: true,
    };

    addItemToEstimate(newItem);
    return true;
  };

  const handleAddToEstimateAndFinish = () => {
    if (saveCurrentConfiguration()) {
      router.push('/');
    }
  };

  const handleAddAndConfigureAnother = () => {
    if (saveCurrentConfiguration()) {
      clearForm();
      const newId = `${originalItemName}-${Date.now()}`;
      setCurrentItemId(newId);
      alert('Railings added! You can now configure another set.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
            <svg className="mr-2 size-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7"></path></svg>
            Back to selection
          </Link>
        </div>

        <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
          <div className="flex flex-col space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Configure Wrought Iron Railings</h1>
            <p className="text-sm text-gray-600 -mt-4 mb-2">Currently configuring: {currentItemId || 'New Railing'}</p>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">How decorative?</h2>
              <div className="flex flex-wrap gap-2">
                {renderOptionButton(decorativenessOptions, decorativeness, setDecorativeness, 'decorativeness')}
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">How rusty?</h2>
              <div className="flex flex-wrap gap-2">
                {renderOptionButton(rustinessOptions, rustiness, setRustiness, 'rustiness')}
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Plants in the way?</h2>
              <div className="flex flex-wrap gap-2">
                {renderOptionButton(plantsOptions, plantsInWay, setPlantsInWay, 'plants')}
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Dimensions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <label htmlFor="length" className="block text-sm font-medium text-gray-600 mb-1">Length</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      id="length" 
                      value={length}
                      onChange={(e) => setLength(e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="e.g., 10"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">ft</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-600 mb-1">Height</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      id="height" 
                      value={height}
                      onChange={(e) => setHeight(e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="e.g., 3"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">ft</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleAddToEstimateAndFinish}
                className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Add to Estimate
              </button>
              <button 
                onClick={handleAddAndConfigureAnother}
                className="w-full sm:w-auto flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Add & Configure Another Railing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
