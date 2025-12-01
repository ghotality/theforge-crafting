'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
// Removed forgecalc.css import to use Tailwind completely

import oresDataRaw from '../../data/ores.json';
import weaponOddsRaw from '../../data/weaponOdds.json';
import armorOddsRaw from '../../data/armorOdds.json';

// Simple Icons components (SVG)
const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const ForkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3v12" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);

// --- Types ---
type Trait = {
  maxStat: number;
  description: string;
};

type OreData = {
  rarity: string;
  multiplier: number;
  traitType: string | null;
  traits: Trait[];
};

type SlotItem = {
  name: string;
  count: number;
};

type OresData = Record<string, OreData>;
type OddsData = Record<string, Record<string, number>>;

const ores: OresData = oresDataRaw as unknown as OresData;
const weaponOdds: OddsData = weaponOddsRaw;
const armorOdds: OddsData = armorOddsRaw;

// --- Helper Functions ---
function calculateCombinedMultiplier(selectedOres: Record<string, number>) {
  let totalMultiplier = 0, totalCount = 0;
  for (const [ore, count] of Object.entries(selectedOres)) {
    if (!ores[ore]) continue;
    totalMultiplier += ores[ore].multiplier * count;
    totalCount += count;
  }
  return totalCount ? totalMultiplier / totalCount : 0;
}

function calculateTransferredStat(x: number) {
  let y = 4.5 * x - 35; 
  if (y < 0) y = 0; 
  if (y > 100) y = 100; 
  return y / 100;
}

function getItemChancesWithTraits(selectedOres: Record<string, number>, craftType: string = "Weapon") {
  const oddsDict = craftType === "Weapon" ? weaponOdds : armorOdds;
  const combinedMultiplier = calculateCombinedMultiplier(selectedOres);
  const totalCount = Object.values(selectedOres).reduce((a, b) => a + b, 0);
  
  // If no ores, return defaults
  if (totalCount === 0) return { combinedMultiplier: 0, totalCount: 0, composition: {}, odds: {}, traits: [], rarity: 'Unknown' };

  const MAX_ODDS_ORE_COUNT = 55; 
  
  let oddsKey = totalCount > MAX_ODDS_ORE_COUNT ? MAX_ODDS_ORE_COUNT.toString() : totalCount.toString();
  
  if (!oddsDict[oddsKey]) {
      const keys = Object.keys(oddsDict).map(Number);
      const maxKey = Math.max(...keys);
      oddsKey = maxKey.toString();
  }

  const odds = oddsDict[oddsKey] || {};

  const composition: Record<string, number> = {};
  for (const [ore, count] of Object.entries(selectedOres)) {
    composition[ore] = (count / totalCount * 100);
  }

  const traits: { ore: string, lines: string[] }[] = [];
  for (const [oreName, pct] of Object.entries(composition)) {
    const oreData = ores[oreName];
    if (!oreData || !Array.isArray(oreData.traits)) continue;
    if (oreData.traitType !== "All" && oreData.traitType !== craftType) continue;
    if (pct < 10) continue;

    const transferredFraction = calculateTransferredStat(pct);
    const oreTraitParts: string[] = [];

    for (let i = 0; i < oreData.traits.length; i++) {
      const t1 = oreData.traits[i];
      if (typeof t1.maxStat !== "number") continue;
      let line = `${(transferredFraction * t1.maxStat).toFixed(2)}% ${t1.description}`;
      
      const shouldMerge = t1.description.trim().match(/(with|of|for|per|to|in)$/i)
        && oreData.traits[i + 1] && typeof oreData.traits[i + 1].maxStat === "number";
      
      if (shouldMerge) {
        const t2 = oreData.traits[i + 1];
        line += ` ${(transferredFraction * t2.maxStat).toFixed(2)}% ${t2.description}`;
        i++;
      }
      oreTraitParts.push(line);
    }
    if (oreTraitParts.length) traits.push({ ore: oreName, lines: oreTraitParts });
  }

  if (!traits.length && totalCount > 0) {
      // Do not push a dummy trait here anymore, so that checking for length 0 correctly hides the section.
      // traits.push({ ore: '', lines: [] });
  }

  const highestOre = Object.entries(composition).reduce((a, b) => b[1] > a[1] ? b : a, ["", 0])[0];
  const rarity = ores[highestOre]?.rarity || "Unknown";

  const sortedOdds = Object.fromEntries(
    Object.entries(odds).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1])
  );

  return { combinedMultiplier, totalCount, composition, odds: sortedOdds, traits, rarity };
}

// --- Components ---

const RarityColors: Record<string, string> = {
    "Common": "border-slate-500 text-slate-300",
    "Uncommon": "border-green-500 text-green-400",
    "Rare": "border-blue-500 text-blue-400",
    "Epic": "border-purple-500 text-purple-400",
    "Legendary": "border-yellow-500 text-yellow-400",
    "Mythical": "border-red-500 text-red-500",
    "Divine": "border-pink-500 text-pink-400",
    "Unknown": "border-gray-700 text-gray-500"
};

const RarityBg: Record<string, string> = {
    "Common": "bg-slate-500/20",
    "Uncommon": "bg-green-500/20",
    "Rare": "bg-blue-500/20",
    "Epic": "bg-purple-500/20",
    "Legendary": "bg-yellow-500/20",
    "Mythical": "bg-red-500/20",
    "Divine": "bg-pink-500/20",
    "Unknown": "bg-gray-800/50"
};

const WEAPON_TYPES = [
    "Dagger", "Straight Sword", "Gauntlet", "Katana", "Great Sword", "Great Axe", "Colossal Sword"
];

const ARMOR_TYPES = [
    "Light Helmet", "Light Leggings", "Light Chestplate",
    "Medium Helmet", "Medium Leggings", "Medium Chestplate",
    "Heavy Helmet", "Heavy Leggings", "Heavy Chestplate"
];


  // --- Helper Hooks for Long Press ---
  function useLongPress(callback: () => void, onClick: () => void, ms = 1000) {
    const [startLongPress, setStartLongPress] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      let timerId: NodeJS.Timeout;
      let animationFrameId: number;
      let startTime: number;

      if (startLongPress) {
        startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const p = Math.min(100, (elapsed / ms) * 100);
            setProgress(p);
            
            if (p < 100) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };
        animationFrameId = requestAnimationFrame(animate);

        timerId = setTimeout(() => {
          callback();
          setStartLongPress(false);
          setProgress(0);
        }, ms);
      } else {
        setProgress(0);
      }

      return () => {
        clearTimeout(timerId);
        cancelAnimationFrame(animationFrameId);
      };
    }, [startLongPress, callback, ms]);

    return {
      onMouseDown: () => setStartLongPress(true),
      onMouseUp: () => {
          if (startLongPress && progress < 100) onClick();
          setStartLongPress(false);
      },
      onMouseLeave: () => setStartLongPress(false),
      onTouchStart: () => setStartLongPress(true),
      onTouchEnd: () => {
           if (startLongPress && progress < 100) onClick();
           setStartLongPress(false);
      },
      progress
    };
  }

  // Component for Slot Button to handle its own state cleanly
  const SlotButton = ({ slot, index, onRemoveOne, onRemoveAll }: { slot: SlotItem | null, index: number, onRemoveOne: (i: number) => void, onRemoveAll: (i: number) => void }) => {
      const longPress = useLongPress(
        () => onRemoveAll(index),
        () => onRemoveOne(index),
        600 // ms for long press
      );

      // If empty, render simple disabled-like button, or clickable to add if we had add-modal. 
      // Current logic: clicking empty does nothing or selects if we implement selection. 
      // But parent handles add. This component is just for display/removal interaction of occupied slots.
      // Actually, if it's empty, we just show empty state.
      
      if (!slot) {
          return (
            <button 
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-2 border-zinc-600 border-dashed bg-black/60 transition-all flex flex-col items-center justify-center relative"
            >
                 <span className="text-zinc-500 text-[8px] sm:text-[10px] md:text-xs uppercase font-medium">Empty</span>
            </button>
          );
      }

      return (
        <button 
            className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-2 ${RarityColors[ores[slot.name].rarity] || 'border-white'} bg-black/60 hover:bg-black/80 transition-all flex flex-col items-center justify-center relative group overflow-hidden select-none`}
            {...longPress}
        >
            <div className={`w-full h-full absolute inset-0 opacity-20 ${RarityBg[ores[slot.name].rarity]}`} />
            
            {/* Progress Bar for Delete */}
            {longPress.progress > 0 && (
                <div className="absolute inset-0 bg-red-900/50 z-0 flex items-end">
                    <div 
                        className="w-full bg-red-600/80 transition-all duration-75 ease-linear"
                        style={{ height: `${longPress.progress}%` }}
                    />
                </div>
            )}

            <span className="text-[7px] sm:text-[8px] md:text-[10px] text-center leading-tight px-0.5 sm:px-1 z-10 font-bold relative">{slot.name}</span>
            <span className="absolute bottom-0.5 sm:bottom-1 right-0.5 sm:right-1 text-[8px] sm:text-[10px] md:text-xs font-bold text-white z-10 drop-shadow-md">x{slot.count}</span>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                <span className="text-red-500 text-[8px] sm:text-[9px] md:text-[10px] uppercase font-bold bg-black/80 px-0.5 sm:px-1 rounded transform translate-y-[-15px]">
                    Click -1<br/>Hold Clear
                </span>
            </div>
        </button>
      );
  };

  export default function Calculator() {
  const [slots, setSlots] = useState<(SlotItem | null)[]>([null, null, null, null]);
  const [craftType, setCraftType] = useState<"Weapon" | "Armor">("Weapon");
  const [results, setResults] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOreNames = useMemo(() => {
      const names = Object.keys(ores).filter(name => 
          name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return names.sort((a, b) => {
          const diff = ores[b].multiplier - ores[a].multiplier; // Descending multiplier
          return diff !== 0 ? diff : a.localeCompare(b);
      });
  }, [searchTerm]);

  // Calculate results whenever slots or craftType changes
  useEffect(() => {
    const selected: Record<string, number> = {};
    let count = 0;
    slots.forEach(slot => {
        if (slot) {
            selected[slot.name] = (selected[slot.name] || 0) + slot.count;
            count += slot.count;
        }
    });

    if (count === 0) {
        setResults(null);
        return;
    }

    const computed = getItemChancesWithTraits(selected, craftType);
    setResults(computed);
  }, [slots, craftType]);

  const addOreToSlot = (oreName: string) => {
    // Check if ore exists in a slot
    const existingIndex = slots.findIndex(s => s?.name === oreName);
    
    if (existingIndex !== -1) {
        // Increment count
        const newSlots = [...slots];
        const current = newSlots[existingIndex]!;
        newSlots[existingIndex] = { ...current, count: current.count + 1 };
        setSlots(newSlots);
        return;
    }

    // Find first empty slot
    const emptyIndex = slots.findIndex(s => s === null);
    if (emptyIndex !== -1) {
        const newSlots = [...slots];
        newSlots[emptyIndex] = { name: oreName, count: 1 };
        setSlots(newSlots);
    }
  };

  const removeOneOreFromSlot = (index: number) => {
      const newSlots = [...slots];
      const slot = newSlots[index];
      if (slot) {
          if (slot.count > 1) {
              newSlots[index] = { ...slot, count: slot.count - 1 };
          } else {
              newSlots[index] = null;
          }
          setSlots(newSlots);
      }
  };

  const removeOreFromSlot = (index: number) => {
      const newSlots = [...slots];
      newSlots[index] = null;
      setSlots(newSlots);
  };

  const clearAll = () => {
      setSlots([null, null, null, null]);
  };

  const currentTypes = craftType === "Weapon" ? WEAPON_TYPES : ARMOR_TYPES;

  return (
    <div className="min-h-screen text-zinc-100 selection:bg-orange-500/30 relative overflow-hidden font-sans">
      {/* Background Image Container */}
      <div className="fixed inset-0 -z-20">
         <img 
            src="/forge.png"
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.4 }}
         />
      </div>
      
      {/* Overlays */}
      <div className="fixed inset-0 -z-10 bg-zinc-950/80" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50" />

        {/* Main Container */}
        <div className="min-h-screen flex flex-col p-3 sm:p-4 md:p-8 max-w-[1600px] mx-auto pt-6 sm:pt-8 pb-6">
            
            {/* Back Button */}
            <div className="mb-3 sm:mb-4">
                <Link 
                    href="/"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs sm:text-sm font-medium"
                >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Home
                </Link>
            </div>

            {/* Info / Credits Section */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 text-[10px] sm:text-xs text-zinc-500 font-medium px-2">
                <span className="text-center">
                    Support this project by giving a star on{' '}
                    <a href="https://github.com/ghotality/theforge-calculator" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline inline-flex items-center gap-1">
                        <GithubIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        GitHub
                    </a>
                </span>
                <span className="hidden md:inline text-zinc-700">•</span>
                <span className="text-center">
                    Based on data from{' '}
                    <a href="https://github.com/KamrynH-CS/theforge-calculator" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline inline-flex items-center gap-1">
                        <ForkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        KamrynH-CS/theforge-calculator
                    </a>
                </span>
            </div>

            {/* 3 Columns Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] xl:grid-cols-[300px_1fr_350px] gap-4 sm:gap-6 items-start lg:items-center">
                
                {/* LEFT PANEL: Forge Chances */}
                <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-full lg:max-h-[800px] bg-black/80 border-2 border-zinc-700 rounded-sm flex flex-col relative order-2 lg:order-1">
                    <div className="p-2 sm:p-3 border-b-2 border-zinc-700 bg-zinc-900/90">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white uppercase tracking-wide">Forge Chances</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
                        {currentTypes
                            .map(type => ({ type, pct: results?.odds?.[type] || 0 }))
                            .sort((a, b) => b.pct - a.pct)
                            .map(({ type, pct }) => {
                            return (
                                <div key={type} className="opacity-90">
                                    <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                                         <span className="text-zinc-400 text-xs sm:text-sm truncate pr-2">{type}</span>
                                         <span className={`text-xs sm:text-sm font-bold flex-shrink-0 ${pct > 0 ? 'text-green-400' : 'text-zinc-600'}`}>{(pct * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className={`h-8 sm:h-10 md:h-12 bg-zinc-800/50 border border-zinc-700 rounded-sm flex items-center justify-center relative overflow-hidden ${pct > 0 ? 'border-green-900/50 bg-green-900/10' : ''}`}>
                                        {/* Placeholder for icon */}
                                        <span className="text-[9px] sm:text-[10px] md:text-xs text-zinc-600">No Icon Yet</span>
                                        {pct > 0 && <div className="absolute bottom-0 left-0 h-0.5 sm:h-1 bg-green-500" style={{ width: `${pct * 100}%` }} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* CENTER PANEL: Cauldron & Slots */}
                <div className="flex flex-col items-center justify-center w-full relative order-1 lg:order-2 mb-6 lg:mb-0">
                    {/* Chain decoration (visual only, simplified) */}
                    <div className="absolute top-0 w-full flex justify-center -z-10 opacity-50 pointer-events-none">
                         {/* You would put chain SVG here */}
                    </div>

                    {/* Cauldron Area */}
                    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square flex flex-col items-center justify-center bg-radial-gradient from-orange-900/20 to-transparent rounded-full mb-4 sm:mb-6 md:mb-8">
                        {/* Slots */}
                        <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8 z-10 px-2 sm:px-0">
                            {slots.map((slot, idx) => (
                                <SlotButton 
                                    key={idx} 
                                    index={idx}
                                    slot={slot}
                                    onRemoveOne={removeOneOreFromSlot}
                                    onRemoveAll={removeOreFromSlot}
                                />
                            ))}
                        </div>

                        <div className="text-center mb-4 sm:mb-6">
                             <div className="text-zinc-400 text-sm sm:text-base md:text-lg font-medium uppercase tracking-wider">Multiplier</div>
                             <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{results?.combinedMultiplier ? `${results.combinedMultiplier.toFixed(2)}x` : '0x'}</div>
                        </div>

                        {results?.traits && results.traits.length > 0 && (
                             <div className="w-full bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 max-h-[150px] sm:max-h-[180px] md:max-h-[200px] overflow-y-auto mb-4 sm:mb-6">
                                <h3 className="text-orange-400 font-bold mb-2 uppercase text-xs sm:text-sm text-center">Active Traits</h3>
                                <div className="space-y-1.5 sm:space-y-2">
                                    {results.traits.map((tr: any, idx: number) => (
                                        <div key={idx} className="text-[10px] sm:text-xs text-zinc-300 bg-white/5 p-1.5 sm:p-2 rounded border border-white/5 text-center">
                                            <div className="text-orange-300 font-bold mb-0.5 sm:mb-1">{tr.ore || 'Generic'}</div>
                                            {tr.lines.map((l: string, i: number) => <div key={i}>{l}</div>)}
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>

                    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex gap-4 justify-center">
                        <button 
                            className="bg-gradient-to-t from-red-500/80 to-orange-500/80 hover:from-red-500 hover:to-orange-500 text-white font-bold py-2 sm:py-2.5 md:py-3 px-6 sm:px-7 md:px-8 rounded-sm border-2 border-red-900/50 uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 text-xs sm:text-sm md:text-base"
                            onClick={clearAll}
                        >
                            Clear Receipt
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: Ore Selector */}
                <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-full lg:max-h-[800px] bg-black/80 border-2 border-zinc-700 rounded-sm flex flex-col relative order-3">
                     <div className="p-2 sm:p-3 border-b-2 border-zinc-700 bg-zinc-900/90">
                        <div className="flex justify-between items-center mb-2 sm:mb-3">
                            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white uppercase tracking-wide">Select Ores</h2>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search ores..." 
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Ore Grid */}
                    <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2">
                            {filteredOreNames.map(oreName => {
                                const data = ores[oreName];
                                // Always show all ores, ignoring trait compatibility for selection
                                // const isCompatible = data.traitType === "All" || data.traitType === craftType || !data.traitType;
                                // if (!isCompatible && data.traitType !== null) return null; 

                                return (
                                    <button 
                                        key={oreName}
                                        onClick={() => addOreToSlot(oreName)}
                                        className={`aspect-square border ${RarityColors[data.rarity]} ${RarityBg[data.rarity]} bg-opacity-10 hover:bg-opacity-30 flex flex-col items-center justify-center p-0.5 sm:p-1 relative group transition-all`}
                                    >
                                        <span className="text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-center leading-tight font-medium break-words w-full px-0.5">{oreName}</span>
                                        {/* Multiplier hint */}
                                        <span className="absolute bottom-0.5 right-0.5 sm:bottom-0.5 sm:right-1 text-[6px] sm:text-[7px] md:text-[8px] text-zinc-400">{data.multiplier}x</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="grid grid-cols-2 border-t-2 border-zinc-700">
                        <button 
                            onClick={() => setCraftType('Weapon')}
                            className={`py-3 sm:py-3.5 md:py-4 text-center font-bold uppercase tracking-wider text-xs sm:text-sm transition-colors ${craftType === 'Weapon' ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
                        >
                            Weapon
                        </button>
                        <button 
                            onClick={() => setCraftType('Armor')}
                            className={`py-3 sm:py-3.5 md:py-4 text-center font-bold uppercase tracking-wider text-xs sm:text-sm transition-colors ${craftType === 'Armor' ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
                        >
                            Armor
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}
