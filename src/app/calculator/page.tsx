'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
// Removed forgecalc.css import to use Tailwind completely

import oresDataRaw from '../../data/ores.json';
import weaponOddsRaw from '../../data/weaponOdds.json';
import armorOddsRaw from '../../data/armorOdds.json';
import forgeDataRaw from '../../data/forgeData.json';

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
const forgeData = forgeDataRaw as { basePrices: Record<string, number> };

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

  // If less than 3 ores, return empty odds (will show 0% in UI)
  if (totalCount < 3) {
    return { combinedMultiplier, totalCount, composition: {}, odds: {}, traits: [], rarity: 'Unknown' };
  }

  const MAX_ODDS_ORE_COUNT = 55; 
  
  let oddsKey = totalCount > MAX_ODDS_ORE_COUNT ? MAX_ODDS_ORE_COUNT.toString() : totalCount.toString();
  
  if (!oddsDict[oddsKey]) {
      const keys = Object.keys(oddsDict).map(Number).filter(k => k >= 3);
      if (keys.length === 0) {
        return { combinedMultiplier, totalCount, composition: {}, odds: {}, traits: [], rarity: 'Unknown' };
      }
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

// Function to find best ore count for each item type
function getBestOreCountForItem(itemName: string, craftType: "Weapon" | "Armor"): number {
  const oddsDict = craftType === "Weapon" ? weaponOdds : armorOdds;
  let bestCount = 0;
  let bestPct = 0;

  for (const [countStr, items] of Object.entries(oddsDict)) {
    const pct = items[itemName] || 0;
    if (pct > bestPct) {
      bestPct = pct;
      bestCount = parseInt(countStr);
    }
  }

  return bestCount;
}

// Function to get ore image path
function getOreImagePath(oreName: string): string | null {
  // Map ore names to image file names
  const imageMap: Record<string, string> = {
    "Stone Ore": "stone",
    "Sand Stone": "sand_stone",
    "Copper Ore": "cooper", // Note: file is named "cooper.png"
    "Iron Ore": "iron",
    "Tin Ore": "tin",
    "Silver Ore": "silver",
    "Gold Ore": "gold",
    "Mushroomite Ore": "mushroomite",
    "Platinum Ore": "platinum",
    "Bananite Ore": "bananite",
    "Cardboardite Ore": "cardboardite",
    "Aite Ore": "aite",
    "Poopite Ore": "poopite",
    "Cobalt Ore": "cobalt",
    "Titanium Ore": "titanium",
    "Lapis Lazuli Ore": "lapis_lazuli",
    "Volcanic Rock": "volcanic",
    "Quartz Ore": "quartz",
    "Amethyst Ore": "amethyst",
    "Topaz Ore": "topaz",
    "Diamond Ore": "diamond",
    "Sapphire Ore": "sapphirew", // Note: file is named "sapphirew.png"
    "Cuprite Ore": "cuprite",
    "Obsidian Ore": "obsidian",
    "Emerald Ore": "emerald",
    "Ruby Ore": "ruby",
    "Rivalite Ore": "rivalite",
    "Uranium Ore": "uranium",
    "Mythril Ore": "mythril",
    "Eye Ore": "eye",
    "Fireite Ore": "fireite",
    "Magmaite Ore": "magmaite",
    "Lightite Ore": "lightite",
    "Demonite Ore": "demonite",
    "Darkryte Ore": "darkryte",
  };

  const imageName = imageMap[oreName];
  if (imageName) {
    return `/ores/${imageName}.png`;
  }
  return null;
}

// Function to get armor items grouped by category (Light, Medium, Heavy)
function getArmorItemsByCategory(): Record<string, Array<{name: string, image: string, categoryKey: string}>> {
  return {
    "Light": [
      {name: "Light Helmet", image: "light_helmet", categoryKey: "Light Helmet"},
      {name: "Light Leggings", image: "light_leggings", categoryKey: "Light Leggings"},
      {name: "Light Chestplate", image: "light_chestplate", categoryKey: "Light Chestplate"},
    ],
    "Medium": [
      {name: "Medium Helmet", image: "medium_helmet", categoryKey: "Medium Helmet"},
      {name: "Medium Leggings", image: "medium_leggings", categoryKey: "Medium Leggings"},
      {name: "Medium Chestplate", image: "medium_chestplate", categoryKey: "Medium Chestplate"},
      {name: "Samurai Helmet", image: "samurai_helmet", categoryKey: "Medium Helmet"},
      {name: "Samurai Leggings", image: "samurai_leggings", categoryKey: "Medium Leggings"},
      {name: "Samurai Chestplate", image: "samurai_chestplate", categoryKey: "Medium Chestplate"},
    ],
    "Heavy": [
      {name: "Knight Helmet", image: "knight_helmet", categoryKey: "Heavy Helmet"},
      {name: "Dark Knight Helmet", image: "dark_knight_helmet", categoryKey: "Heavy Helmet"},
      {name: "Knight Leggings", image: "knight_leggings", categoryKey: "Heavy Leggings"},
      {name: "Dark Knight Leggings", image: "dark_knight_leggings", categoryKey: "Heavy Leggings"},
      {name: "Knight Chestplate", image: "knight_chestplate", categoryKey: "Heavy Chestplate"},
      {name: "Dark Knight Chestplate", image: "dark_knight_chestplate", categoryKey: "Heavy Chestplate"},
    ],
  };
}

// Function to calculate individual item chance based on category chance and item ratio
function getItemChance(itemName: string, categoryKey: string, categoryChance: number): number {
  // Items with 1/1 ratio (100% of category chance)
  const fullChanceItems = [
    "Light Helmet", "Light Leggings", "Light Chestplate",
    "Medium Helmet", "Medium Leggings", "Medium Chestplate",
    "Knight Helmet", "Knight Leggings", "Knight Chestplate"
  ];
  
  // Items with 1/2 ratio (50% of category chance)
  const halfChanceItems = [
    "Samurai Helmet", "Samurai Leggings", "Samurai Chestplate",
    "Dark Knight Helmet", "Dark Knight Leggings", "Dark Knight Chestplate"
  ];
  
  if (fullChanceItems.includes(itemName)) {
    return categoryChance * 1.0; // 1/1 = 100%
  } else if (halfChanceItems.includes(itemName)) {
    return categoryChance * 0.5; // 1/2 = 50%
  }
  
  return 0;
}

// Function to get possible item images with their chances for a category
function getPossibleItemImagesWithChances(categoryName: string, categoryChance: number, craftType: "Weapon" | "Armor"): Array<{image: string, ratio: string}> {
  if (craftType === "Weapon") {
    // For weapons, return single image with 1/1
    const weaponMap: Record<string, string> = {
      "Dagger": "dagger",
      "Straight Sword": "straight_sword",
      "Gauntlet": "gauntlet",
      "Katana": "katana",
      "Great Sword": "great_sword",
      "Great Axe": "great_axe",
      "Colossal Sword": "colossal_sword",
    };
    const imageName = weaponMap[categoryName];
    return imageName ? [{image: `/items/${imageName}.png`, ratio: "1/1"}] : [];
  } else {
    // For armor, return all variations with their ratios
    const armorByCategory = getArmorItemsByCategory();
    const allItems = Object.values(armorByCategory).flat();
    const categoryItems = allItems.filter(item => item.categoryKey === categoryName);
    
    return categoryItems.map(item => {
      const itemChance = getItemChance(item.name, item.categoryKey, categoryChance);
      const ratio = itemChance === categoryChance ? "1/1" : "1/2";
      return {
        image: `/items/${item.image}.png`,
        ratio: ratio
      };
    });
  }
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

// Function to calculate sell price: (base price x multiplier) + 10%
function calculateSellPrice(itemName: string, multiplier: number): number {
    const basePrice = forgeData.basePrices[itemName] || 0;
    if (basePrice === 0) return 0;
    const price = (basePrice * multiplier) * 1.1; // +10%
    return Math.round(price * 100) / 100; // Round to 2 decimal places
}

  // Component for Predicted Item Image
  const PredictedItemImage = ({ image, ratio, alt }: { image: string, ratio: string, alt: string }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    return (
      <div className="flex flex-col items-center">
        <img 
          src={image} 
          alt={alt}
          className="h-8 sm:h-10 md:h-12 w-auto object-contain opacity-80"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{ display: imageError ? 'none' : 'block' }}
        />
        {imageLoaded && !imageError && (
          <span className="text-[8px] sm:text-[9px] text-white mt-0.5 font-medium">
            {ratio}
          </span>
        )}
      </div>
    );
  };

  // Component for Slot Button to handle its own state cleanly
  const SlotButton = ({ slot, index, onRemoveOne }: { slot: SlotItem | null, index: number, onRemoveOne: (i: number) => void }) => {
      // If empty, render simple disabled-like button
      if (!slot) {
          return (
            <button 
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-2 border-zinc-600 border-dashed bg-black/60 transition-all flex flex-col items-center justify-center relative"
            >
                 <span className="text-zinc-500 text-[8px] sm:text-[10px] md:text-xs uppercase font-medium">Empty</span>
            </button>
          );
      }

      const oreImage = getOreImagePath(slot.name);
      
      return (
        <button 
            onClick={() => onRemoveOne(index)}
            className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-2 ${RarityColors[ores[slot.name].rarity] || 'border-white'} bg-black/60 hover:bg-black/80 transition-all cursor-pointer flex flex-col items-start justify-start p-0.5 sm:p-1 relative group overflow-hidden select-none animate-pop-in`}
        >
            {oreImage ? (
                <>
                    <img 
                        src={oreImage} 
                        alt={slot.name}
                        className="w-full h-full object-cover absolute inset-0 opacity-80"
                    />
                    <div className={`absolute inset-0 ${RarityBg[ores[slot.name].rarity]} opacity-30`} />
                </>
            ) : (
                <div className={`w-full h-full absolute inset-0 opacity-20 ${RarityBg[ores[slot.name].rarity]}`} />
            )}

            <span className={`text-[7px] sm:text-[8px] md:text-[10px] text-left leading-tight font-medium break-words w-full px-1 z-10 relative ${oreImage ? 'text-white' : ''}`}>{slot.name}</span>
            <span className="absolute bottom-0.5 sm:bottom-1 right-0.5 sm:right-1 text-[8px] sm:text-[10px] md:text-xs font-bold text-white z-10">x{slot.count}</span>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                <span className="text-red-500 text-[8px] sm:text-[9px] md:text-[10px] uppercase font-bold bg-black/80 px-0.5 sm:px-1 rounded">
                    Click to Remove
                </span>
            </div>
        </button>
      );
  };

  // Component for Ore Button with click animation
  const OreButton = ({ 
    oreName, 
    data, 
    oreImage, 
    onClick 
  }: { 
    oreName: string, 
    data: OreData, 
    oreImage: string | null, 
    onClick: () => void 
  }) => {
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
      setIsClicked(true);
      onClick();
      setTimeout(() => setIsClicked(false), 150); // Reset animation state
    };

    return (
        <button 
            onClick={handleClick}
            className={`aspect-square border ${RarityColors[data.rarity]} ${RarityBg[data.rarity]} bg-opacity-10 hover:bg-opacity-30 hover:brightness-155 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] duration-150 ease-out cursor-pointer flex flex-col items-start justify-start p-0.5 sm:p-1 relative group transition-all overflow-hidden ${isClicked ? 'animate-click' : ''}`}
        >
            {oreImage ? (
                <>
                    <img 
                        src={oreImage} 
                        alt={oreName}
                        className="w-full h-full object-cover absolute inset-0 opacity-80"
                    />
                    <div className={`absolute inset-0 ${RarityBg[data.rarity]} opacity-30`} />
                </>
            ) : null}
            <span 
                className={`text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-left leading-tight font-medium break-words w-full px-1 relative z-10 ${
                    oreImage 
                        ? 'text-white' 
                        : ''
                }`}
            >
                {oreName}
            </span>
            {/* Multiplier hint */}
            <span className="absolute bottom-0.5 right-0.5 sm:bottom-0.5 sm:right-1 text-[6px] sm:text-[7px] md:text-[8px] text-zinc-300 z-10 font-semibold">{data.multiplier}x</span>
        </button>
    );
  };

  // Component for Predicted Item Display to handle its own animation logic
  const PredictedItemDisplay = ({
    type,
    pct,
    craftType,
    possibleItems
  }: {
    type: string,
    pct: number,
    craftType: "Weapon" | "Armor",
    possibleItems: Array<{image: string, ratio: string}>
  }) => {
    // Only animate when the item type actually changes, not just the percentage
    // Using a key based on type ensures the component remounts and animation triggers only on type change
    return (
        <div
            key={type}
            className="bg-black/70 border border-zinc-600 rounded-sm px-3 sm:px-4 py-2 sm:py-2.5 text-center animate-fade-in absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xs sm:max-w-sm md:max-w-md z-10"
        >
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                Predicted {craftType}
            </div>
            <div className="text-sm sm:text-base md:text-lg font-bold text-green-400 mb-1.5">
                {type} <span className="text-zinc-300 font-normal">({(pct * 100).toFixed(1)}%)</span>
            </div>
            {possibleItems.length > 0 ? (
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    {possibleItems.map((item, idx) => (
                        <PredictedItemImage 
                            key={idx}
                            image={item.image}
                            ratio={item.ratio}
                            alt={`${type} variation ${idx + 1}`}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-[9px] sm:text-[10px] text-zinc-500 italic">
                    {craftType === "Weapon" ? "Weapon image coming soon" : "No images available"}
                </div>
            )}
        </div>
    );
  };

  export default function Calculator() {
  const [slots, setSlots] = useState<(SlotItem | null)[]>([null, null, null, null]);
  const [craftType, setCraftType] = useState<"Weapon" | "Armor">("Weapon");
  const [results, setResults] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [previousTopItem, setPreviousTopItem] = useState<string | null>(null);
  const [topItemChanged, setTopItemChanged] = useState(false);

  const filteredOreNames = useMemo(() => {
      const names = Object.keys(ores).filter(name => {
          // Filter by search term
          if (!name.toLowerCase().includes(searchTerm.toLowerCase())) {
              return false;
          }
          // Only show ores that have images
          return getOreImagePath(name) !== null;
      });
      
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
        setPreviousTopItem(null);
        return;
    }

    const computed = getItemChancesWithTraits(selected, craftType);
    
    // Track top item for animation
    const types = craftType === "Weapon" ? WEAPON_TYPES : ARMOR_TYPES;
    const sortedItems = types
      .map(type => ({ type, pct: computed.odds?.[type] || 0 }))
      .sort((a, b) => b.pct - a.pct);
    const currentTopItem = sortedItems[0]?.type || null;
    
    if (currentTopItem && currentTopItem !== previousTopItem && previousTopItem !== null && sortedItems[0]?.pct > 0) {
      // New item reached the top, trigger animation
      setTopItemChanged(true);
      setTimeout(() => setTopItemChanged(false), 800);
    }
    
    setPreviousTopItem(currentTopItem);
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

            {/* 3 Columns Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] xl:grid-cols-[300px_1fr_350px] gap-4 sm:gap-6 items-start lg:items-center">
                
                {/* LEFT PANEL: Forge Chances */}
                <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-full lg:max-h-[800px] bg-black/80 border-2 border-zinc-700 rounded-sm flex flex-col relative order-2 lg:order-1">
                    <div className="p-2 sm:p-3 border-b-2 border-zinc-700 bg-zinc-900/90">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white uppercase tracking-wide">Forge Chances</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4">
                        {craftType === "Armor" ? (() => {
                            // Group items by categoryKey (Light Helmet, Medium Chestplate, etc.)
                            const armorByCategory = getArmorItemsByCategory();
                            const categoryGroups: Record<string, Array<{name: string, image: string, chance: number, ratio: string}>> = {};
                            
                            // Process each category and group by categoryKey
                            Object.values(armorByCategory).flat().forEach(item => {
                                const categoryChance = results?.odds?.[item.categoryKey] || 0;
                                const itemChance = getItemChance(item.name, item.categoryKey, categoryChance);
                                const ratio = itemChance === categoryChance ? "1/1" : "1/2";
                                
                                if (!categoryGroups[item.categoryKey]) {
                                    categoryGroups[item.categoryKey] = [];
                                }
                                
                                categoryGroups[item.categoryKey].push({
                                    name: item.name,
                                    image: `/items/${item.image}.png`,
                                    chance: itemChance,
                                    ratio: ratio
                                });
                            });
                            
                            // Convert to array and sort by total category chance
                            const sortedCategories = Object.entries(categoryGroups)
                                .map(([categoryKey, items]) => ({
                                    categoryKey,
                                    categoryChance: results?.odds?.[categoryKey] || 0,
                                    items: items.sort((a, b) => b.chance - a.chance)
                                }))
                                .sort((a, b) => b.categoryChance - a.categoryChance);
                            
                            return sortedCategories.map((category, catIndex) => {
                                const isNewTop = catIndex === 0 && topItemChanged && category.categoryKey !== previousTopItem && category.categoryChance > 0;
                                return (
                                    <div 
                                        key={category.categoryKey} 
                                        className={`opacity-90 transition-all duration-300 ${
                                            isNewTop ? 'top-item-animation' : ''
                                        }`}
                                    >
                                        {/* Category Header */}
                                        <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                                            <span className="text-zinc-300 text-xs sm:text-sm font-medium">{category.categoryKey}</span>
                                            <span className={`text-xs sm:text-sm font-bold flex-shrink-0 ${category.categoryChance > 0 ? 'text-green-400' : 'text-zinc-600'}`}>
                                                ({(category.categoryChance * 100).toFixed(0)}%)
                                            </span>
                                        </div>
                                        
                                        {/* Variation Slots */}
                                        <div className="flex gap-1.5 sm:gap-2 mb-1">
                                            {category.items.map((item, itemIndex) => (
                                                <div 
                                                    key={item.name}
                                                    className={`flex-1 h-8 sm:h-10 md:h-12 bg-zinc-800/50 border border-zinc-700 rounded-sm flex flex-col items-center justify-center relative overflow-hidden ${category.categoryChance > 0 ? 'border-green-900/50 bg-green-900/10' : ''}`}
                                                >
                                                    <img 
                                                        src={item.image} 
                                                        alt={item.name}
                                                        className="w-full h-full object-contain opacity-80 p-1"
                                                    />
                                                    <span className="absolute bottom-0.5 left-0 right-0 text-[8px] sm:text-[9px] text-white text-center font-medium">
                                                        {item.ratio}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Single progress bar for the category */}
                                        <div className="h-0.5 sm:h-1 bg-zinc-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-green-500 transition-all duration-300 ease-out" 
                                                style={{ width: `${category.categoryChance * 100}%` }} 
                                            />
                                        </div>
                                    </div>
                                );
                            });
                        })() : (
                            // For Weapons: Show as is
                            currentTypes
                                .map(type => ({ 
                                    type, 
                                    pct: results?.odds?.[type] || 0,
                                    bestCount: getBestOreCountForItem(type, craftType)
                                }))
                                .sort((a, b) => b.pct - a.pct)
                                .map(({ type, pct, bestCount }, index) => {
                                const isNewTop = index === 0 && topItemChanged && type !== previousTopItem && pct > 0;
                                const itemImage = `/items/${type.toLowerCase().replace(/\s+/g, '_')}.png`;
                                return (
                                    <div 
                                        key={type} 
                                        className={`opacity-90 transition-all duration-300 ${
                                            isNewTop ? 'top-item-animation' : ''
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                                             <span className="text-zinc-400 text-xs sm:text-sm truncate pr-2">{type}</span>
                                             <span className={`text-xs sm:text-sm font-bold flex-shrink-0 ${pct > 0 ? 'text-green-400' : 'text-zinc-600'}`}>{(pct * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className={`h-8 sm:h-10 md:h-12 bg-zinc-800/50 border border-zinc-700 rounded-sm flex items-center justify-center relative overflow-hidden ${pct > 0 ? 'border-green-900/50 bg-green-900/10' : ''}`}>
                                            <span className="text-[9px] sm:text-[10px] md:text-xs text-zinc-400">Best: {bestCount} ores</span>
                                            <div 
                                                className="absolute bottom-0 left-0 h-0.5 sm:h-1 bg-green-500 transition-all duration-300 ease-out" 
                                                style={{ width: `${pct * 100}%` }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* CENTER PANEL: Cauldron & Slots */}
                <div className="flex flex-col items-center justify-start w-full relative order-1 lg:order-2 mb-6 lg:mb-0 pt-0">
                    {/* Chain decoration (visual only, simplified) */}
                    <div className="absolute top-0 w-full flex justify-center -z-10 opacity-50 pointer-events-none">
                         {/* You would put chain SVG here */}
                    </div>

                    {/* Predicted Item - Compact */}
                    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md min-h-[120px] sm:min-h-[140px] md:min-h-[160px] flex justify-center items-start">
                        {results && results.odds && Object.keys(results.odds).length > 0 && (() => {
                            const sortedItems = currentTypes
                                .map(type => ({ type, pct: results.odds[type] || 0 }))
                                .sort((a, b) => b.pct - a.pct);
                            const predictedItem = sortedItems[0];

                            if (predictedItem && predictedItem.pct > 0) {
                                const possibleItems = getPossibleItemImagesWithChances(predictedItem.type, predictedItem.pct, craftType);
                                return (
                                    <PredictedItemDisplay
                                        type={predictedItem.type}
                                        pct={predictedItem.pct}
                                        craftType={craftType}
                                        possibleItems={possibleItems}
                                    />
                                );
                            }
                            return null;
                        })()}
                    </div>
                    {results && results.odds && Object.keys(results.odds).length > 0 && (() => {
                        const sortedItems = currentTypes
                            .map(type => ({ type, pct: results.odds[type] || 0 }))
                            .sort((a, b) => b.pct - a.pct);
                        const predictedItem = sortedItems[0];
                        
                        if (predictedItem && predictedItem.pct > 0) {
                            const possibleItems = getPossibleItemImagesWithChances(predictedItem.type, predictedItem.pct, craftType);
                            const sellPrice = calculateSellPrice(predictedItem.type, results.combinedMultiplier);
                            return (
                                <div className="mb-5 sm:mb-6 mt-0 sm:mt-0 md:-mt-16 lg:-mt-24 xl:-mt-28 bg-black/70 border border-zinc-600 rounded-sm px-3 sm:px-4 py-2 sm:py-2.5 text-center">
                                    <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                                        Predicted {craftType}
                                    </div>
                                    <div className="text-sm sm:text-base md:text-lg font-bold text-green-400 mb-1.5">
                                        {predictedItem.type} <span className="text-zinc-300 font-normal">({(predictedItem.pct * 100).toFixed(1)}%)</span>
                                    </div>
                                    {possibleItems.length > 0 ? (
                                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2">
                                            {possibleItems.map((item, idx) => (
                                                <PredictedItemImage 
                                                    key={idx}
                                                    image={item.image}
                                                    ratio={item.ratio}
                                                    alt={`${predictedItem.type} variation ${idx + 1}`}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-[9px] sm:text-[10px] text-zinc-500 italic mb-2">
                                            {craftType === "Weapon" ? "Weapon image coming soon" : "No images available"}
                                        </div>
                                    )}
                                    {sellPrice > 0 && (
                                        <div className="text-[11px] sm:text-xs md:text-sm font-bold" style={{ color: '#D4AF37' }}>
                                            Masterwork price: ${sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Cauldron Area */}
                    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md flex flex-col items-center justify-center bg-radial-gradient from-orange-900/20 to-transparent rounded-full mb-1.5 sm:mb-2">
                        {/* Slots */}
                        <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-1.5 sm:mb-2 z-10 px-2 sm:px-0">
                            {slots.map((slot, idx) => (
                                <SlotButton 
                                    key={`${idx}-${slot?.name ?? 'empty'}-${slot?.count ?? 0}`}
                                    index={idx}
                                    slot={slot}
                                    onRemoveOne={removeOneOreFromSlot}
                                />
                            ))}
                        </div>

                        {/* Composition */}
                        {results && results.composition && Object.keys(results.composition).length > 0 && (
                            <div className="text-center mb-1.5 sm:mb-2 px-2">
                                <div className="text-[10px] sm:text-[11px] text-zinc-500 flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 leading-tight">
                                    {(() => {
                                        const compositionEntries = Object.entries(results.composition)
                                            .sort((a, b) => (b[1] as number) - (a[1] as number)); // Sort by percentage descending
                                        const maxPct = (compositionEntries[0]?.[1] as number) || 0;
                                        
                                        return compositionEntries.map(([oreName, pct], index) => {
                                            const pctNum = pct as number;
                                            const isHighest = pctNum === maxPct && pctNum > 0;
                                            return (
                                                <span key={oreName}>
                                                    <span className={isHighest ? 'text-yellow-400 font-semibold' : 'text-zinc-500'}>
                                                        {oreName}({pctNum.toFixed(0)}%)
                                                    </span>
                                                    {index < compositionEntries.length - 1 && (
                                                        <span className="text-zinc-600 mx-0.5">+</span>
                                                    )}
                                                </span>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}

                        <div className="text-center mb-1.5 sm:mb-2">
                             <div className="text-zinc-400 text-sm sm:text-base md:text-lg font-medium uppercase tracking-wider">Multiplier</div>
                             <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{results?.combinedMultiplier ? `${results.combinedMultiplier.toFixed(2)}x` : '0x'}</div>
                        </div>
                    </div>

                    {/* Active Traits - Outside Cauldron Area */}
                    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md min-h-[80px] mb-1.5 sm:mb-2">
                    {results?.traits && results.traits.length > 0 && (
                         <div className="w-full bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 animate-fade-in">
                            <h3 className="text-orange-400 font-bold mb-1.5 sm:mb-2 uppercase text-xs sm:text-sm text-center">Active Traits</h3>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                {results.traits.map((tr: any, idx: number) => (
                                    <div key={idx} className="text-[10px] sm:text-xs text-zinc-300 bg-white/5 p-1.5 sm:p-2 rounded border border-white/5 text-center w-full h-full flex flex-col justify-center">
                                        <div className="text-orange-300 font-bold mb-0.5 sm:mb-1">{tr.ore || 'Generic'}</div>
                                        <div className="space-y-0.5">
                                            {tr.lines.map((l: string, i: number) => (
                                                <div key={i} className="text-[9px] sm:text-[10px]">{l}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}
                    </div>

                    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md flex flex-col items-center gap-2 sm:gap-3 mt-8 sm:mt-12 md:mt-16">
                        <div className="text-center px-2">
                            <div className="text-[11px] sm:text-xs md:text-sm text-zinc-500 font-medium">
                                please consider leaving a{' '}
                                <a href="https://github.com/ghotality/theforge-crafting" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline">
                                    star
                                </a>
                                {' '}if you liked this website
                            </div>
                            <div className="text-[9px] sm:text-[10px] text-zinc-600 mt-1">
                                it motivates me so much
                            </div>
                        </div>
                        <button 
                            className="bg-gradient-to-t from-red-500/80 to-orange-500/80 hover:from-red-500 hover:to-orange-500 text-white font-bold py-2 sm:py-2.5 md:py-3 px-6 sm:px-7 md:px-8 rounded-sm border-2 border-red-900/50 uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 text-xs sm:text-sm md:text-base"
                            onClick={clearAll}
                        >
                            Clear
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

                                const oreImage = getOreImagePath(oreName);
                                
                                return (
                                    <OreButton 
                                        key={oreName}
                                        oreName={oreName}
                                        data={data}
                                        oreImage={oreImage}
                                        onClick={() => addOreToSlot(oreName)}
                                    />
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
