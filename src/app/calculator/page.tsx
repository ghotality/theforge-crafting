'use client';

import { useState, useEffect, useMemo, memo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// Removed forgecalc.css import to use Tailwind completely

import oresDataRaw from '../../data/ores.json';
import weaponOddsRaw from '../../data/weaponOdds.json';
import armorOddsRaw from '../../data/armorOdds.json';
import forgeDataRaw from '../../data/forgeData.json';

// Custom hook to detect mobile devices
function useIsMobile(breakpoint: number = 1024) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Initial check
    checkMobile();
    
    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150); // Debounce de 150ms
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);
  
  return isMobile;
}

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

const TrashIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <defs>
      <mask id="trashMask">
        <rect width="24" height="24" fill="white" />
        <line x1="9" y1="9" x2="9" y2="19" stroke="black" strokeWidth="1.5" />
        <line x1="12" y1="9" x2="12" y2="19" stroke="black" strokeWidth="1.5" />
        <line x1="15" y1="9" x2="15" y2="19" stroke="black" strokeWidth="1.5" />
      </mask>
    </defs>
    <path d="M5 7.5C5 6.67157 5.67157 6 6.5 6H17.5C18.3284 6 19 6.67157 19 7.5V20.5C19 21.3284 18.3284 22 17.5 22H6.5C5.67157 22 5 21.3284 5 20.5V7.5Z" mask="url(#trashMask)" />
    <path d="M8.5 2C8.5 2 8.5 1 9.5 1H14.5C15.5 1 15.5 2 15.5 2H19.5C20.3284 2 21 2.67157 21 3.5V4.5H3V3.5C3 2.67157 3.67157 2 4.5 2H8.5Z" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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
type ForgeData = {
  weapons: Record<string, number>;
  armor: Record<string, number>;
  weaponStats?: Record<string, number>;
  armorStats?: Record<string, number>;
};

const ores: OresData = oresDataRaw as unknown as OresData;
const weaponOdds: OddsData = weaponOddsRaw;
const armorOdds: OddsData = armorOddsRaw;
const forgeData: ForgeData = forgeDataRaw as ForgeData;

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

// Image version for cache busting - increment this when you update images
const IMAGE_VERSION = '2';

// Function to add version parameter to image URLs for cache busting
function addImageVersion(imagePath: string): string {
  return `${imagePath}?v=${IMAGE_VERSION}`;
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
    "Magenta Crystal Ore": "magenta_crystal",
    "Crimson Crystal Ore": "crimson_crystal",
    "Green Crystal Ore": "green_crystal",
    "Orange Crystal Ore": "orange_crystal",
    "Blue Crystal Ore": "blue_crystal",
    "Rainbow Crystal Ore": "rainbow_crystal",
    "Arcane Crystal Ore": "arcane_crystal",
  };

  const imageName = imageMap[oreName];
  if (imageName) {
    return addImageVersion(`/ores/${imageName}.png`);
  }
  return null;
}

// Function to get armor items grouped by category (Light, Medium, Heavy)
function getArmorItemsByCategory(): Record<string, Array<{name: string, image: string, categoryKey: string}>> {
  const createArmorItem = (name: string, image: string, categoryKey: string) => ({
    name,
    image: addImageVersion(`/items/${image}.png`),
    categoryKey
  });
  
  return {
    "Light": [
      createArmorItem("Light Helmet", "light_helmet", "Light Helmet"),
      createArmorItem("Light Leggings", "light_leggings", "Light Leggings"),
      createArmorItem("Light Chestplate", "light_chestplate", "Light Chestplate"),
    ],
    "Medium": [
      createArmorItem("Medium Helmet", "medium_helmet", "Medium Helmet"),
      createArmorItem("Medium Leggings", "medium_leggings", "Medium Leggings"),
      createArmorItem("Medium Chestplate", "medium_chestplate", "Medium Chestplate"),
      createArmorItem("Samurai Helmet", "samurai_helmet", "Medium Helmet"),
      createArmorItem("Samurai Leggings", "samurai_leggings", "Medium Leggings"),
      createArmorItem("Samurai Chestplate", "samurai_chestplate", "Medium Chestplate"),
    ],
    "Heavy": [
      createArmorItem("Knight Helmet", "knight_helmet", "Heavy Helmet"),
      createArmorItem("Dark Knight Helmet", "dark_knight_helmet", "Heavy Helmet"),
      createArmorItem("Knight Leggings", "knight_leggings", "Heavy Leggings"),
      createArmorItem("Dark Knight Leggings", "dark_knight_leggings", "Heavy Leggings"),
      createArmorItem("Knight Chestplate", "knight_chestplate", "Heavy Chestplate"),
      createArmorItem("Dark Knight Chestplate", "dark_knight_chestplate", "Heavy Chestplate"),
    ],
  };
}

// Function to get weapon items grouped by category
function getWeaponItemsByCategory(): Record<string, Array<{name: string, image: string, categoryKey: string}>> {
  const createWeaponItem = (name: string, image: string, categoryKey: string) => ({
    name,
    image: addImageVersion(`/weapons/${image}.png`),
    categoryKey
  });
  
  return {
    "Dagger": [
      createWeaponItem("Dagger", "dagger", "Dagger"),
      createWeaponItem("Gladius Dagger", "gladius_dagger", "Dagger"),
      createWeaponItem("Hook", "hook", "Dagger"),
    ],
    "Great Sword": [
      createWeaponItem("Crusader Sword", "crusader", "Great Sword"),
      createWeaponItem("Long Sword", "long_sword", "Great Sword"),
    ],
    "Great Axe": [
      createWeaponItem("Double Battle Axe", "double_battle_axe", "Great Axe"),
      createWeaponItem("Scythe", "scythe", "Great Axe"),
    ],
    "Katana": [
      createWeaponItem("Uchigatana", "uchigatana", "Katana"),
      createWeaponItem("Tachi", "tachi", "Katana"),
    ],
    "Straight Sword": [
      createWeaponItem("Falchion", "falchion", "Straight Sword"),
      createWeaponItem("Cutlass", "cutlass", "Straight Sword"),
      createWeaponItem("Rapier", "rapier", "Straight Sword"),
      createWeaponItem("Chaos", "chaos", "Straight Sword"),
    ],
    "Gauntlet": [
      createWeaponItem("Ironhand", "ironhand", "Gauntlet"),
      createWeaponItem("Relevator", "relevator", "Gauntlet"),
    ],
    "Colossal Sword": [
      createWeaponItem("Great Sword", "great_sword", "Colossal Sword"),
      createWeaponItem("Hammer", "hammer", "Colossal Sword"),
      createWeaponItem("Skull Crusher", "skull_crusher", "Colossal Sword"),
      createWeaponItem("Dragon Slayer", "dragon_slayer", "Colossal Sword"),
    ],
  };
}

// Function to calculate individual item chance based on category chance and item ratio
function getItemChance(itemName: string, categoryKey: string, categoryChance: number, craftType: "Weapon" | "Armor" = "Armor"): { chance: number, ratio: string } {
  if (craftType === "Armor") {
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
      return { chance: categoryChance * 1.0, ratio: "1/1" }; // 1/1 = 100%
    } else if (halfChanceItems.includes(itemName)) {
      return { chance: categoryChance * 0.5, ratio: "1/2" }; // 1/2 = 50%
    }
  } else if (craftType === "Weapon") {
    // Weapons with 1/1 ratio (100% of category chance)
    const fullChanceItems = [
      "Dagger", "Crusader Sword", "Double Battle Axe", "Uchigatana", 
      "Falchion", "Ironhand", "Great Sword"
    ];
    
    // Weapons with 1/2 ratio (50% of category chance)
    const halfChanceItems = [
      "Long Sword", "Cutlass"
    ];
    
    // Weapons with 1/4 ratio (25% of category chance)
    const quarterChanceItems = [
      "Gladius Dagger", "Scythe", "Tachi", "Rapier", "Relevator", "Hammer"
    ];
    
    // Weapons with 1/8 ratio (12.5% of category chance)
    const eighthChanceItems = [
      "Skull Crusher"
    ];
    
    // Weapons with 1/16 ratio (6.25% of category chance)
    const sixteenthChanceItems = [
      "Hook", "Chaos", "Dragon Slayer"
    ];
    
    if (fullChanceItems.includes(itemName)) {
      return { chance: categoryChance * 1.0, ratio: "1/1" };
    } else if (halfChanceItems.includes(itemName)) {
      return { chance: categoryChance * 0.5, ratio: "1/2" };
    } else if (quarterChanceItems.includes(itemName)) {
      return { chance: categoryChance * 0.25, ratio: "1/4" };
    } else if (eighthChanceItems.includes(itemName)) {
      return { chance: categoryChance * 0.125, ratio: "1/8" };
    } else if (sixteenthChanceItems.includes(itemName)) {
      return { chance: categoryChance * 0.0625, ratio: "1/16" };
    }
  }
  
  return { chance: 0, ratio: "0/0" };
}

// Function to get possible item images with their chances for a category
function getPossibleItemImagesWithChances(categoryName: string, categoryChance: number, craftType: "Weapon" | "Armor"): Array<{image: string, ratio: string, name: string, chance: number, categoryKey: string}> {
  if (craftType === "Weapon") {
    // For weapons, return all variations with their ratios
    const weaponByCategory = getWeaponItemsByCategory();
    const allItems = Object.values(weaponByCategory).flat();
    const categoryItems = allItems.filter(item => item.categoryKey === categoryName);
    
    return categoryItems.map(item => {
      const { chance, ratio } = getItemChance(item.name, item.categoryKey, categoryChance, "Weapon");
      return {
        image: item.image, // Already has version parameter
        ratio: ratio,
        name: item.name,
        chance: chance,
        categoryKey: item.categoryKey
      };
    });
  } else {
    // For armor, return all variations with their ratios
    const armorByCategory = getArmorItemsByCategory();
    const allItems = Object.values(armorByCategory).flat();
    const categoryItems = allItems.filter(item => item.categoryKey === categoryName);
    
    return categoryItems.map(item => {
      const { chance, ratio } = getItemChance(item.name, item.categoryKey, categoryChance, "Armor");
      return {
        image: item.image, // Already has version parameter
        ratio: ratio,
        name: item.name,
        chance: chance,
        categoryKey: item.categoryKey
      };
    });
  }
}

// Function to calculate masterwork price: (base price x multiplier) + 10%
function calculateMasterworkPrice(itemName: string, multiplier: number, craftType: "Weapon" | "Armor"): number | null {
  const priceData = craftType === "Weapon" ? forgeData.weapons : forgeData.armor;
  const basePrice = priceData[itemName];
  
  if (!basePrice) return null;
  
  const priceWithMultiplier = basePrice * multiplier;
  const finalPrice = priceWithMultiplier;
  
  return finalPrice;
}

// Function to calculate damage/defense: (base * multiplier) * 2
function calculateMasterworkStat(itemName: string, multiplier: number, craftType: "Weapon" | "Armor"): number | null {
  const statsData = craftType === "Weapon" ? forgeData.weaponStats : forgeData.armorStats;
  if (!statsData) return null;
  
  const baseStat = statsData[itemName];
  if (baseStat === undefined) return null;
  
  const finalStat = (baseStat * multiplier) * 2;
  return finalStat;
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

// Cache for failed image loads to prevent unnecessary requests
const failedImageCache = new Set<string>();
// Cache for successfully loaded images
const loadedImageCache = new Set<string>();

  // Component for Predicted Item Image - memoized to prevent unnecessary re-renders
  const PredictedItemImage = memo(({ image, ratio, alt, name, chance, multiplier, craftType, categoryKey }: { image: string, ratio: string, alt: string, name?: string, chance?: number, multiplier?: number, craftType?: "Weapon" | "Armor", categoryKey?: string }) => {
    // Check cache first - if failed, don't render anything
    if (failedImageCache.has(image)) {
      return null;
    }
    
    const [imageLoaded, setImageLoaded] = useState(loadedImageCache.has(image));
    const [imageError, setImageError] = useState(false);
    
    // If already loaded, show it immediately
    if (loadedImageCache.has(image)) {
      return (
        <div className="group relative flex flex-col items-center">
          <div className="relative h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12">
            <Image 
              src={image} 
              alt={alt}
              fill
              sizes="128px"
              className="object-contain opacity-80 transition-opacity duration-200 group-hover:opacity-100"
            />
          </div>
          <span className="text-[8px] sm:text-[9px] text-white mt-0.5 font-medium">
            {ratio}
          </span>
          {/* Tooltip on hover */}
          {name && chance !== undefined && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900/95 border border-zinc-600 rounded-sm text-white text-[9px] sm:text-[10px] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out pointer-events-none z-50 shadow-lg">
              <div className="font-semibold text-zinc-100">{name}</div>
              <div className="text-green-400 font-medium">{(chance * 100).toFixed(2)}%</div>
              {multiplier !== undefined && craftType && name && (() => {
                const stat = calculateMasterworkStat(name, multiplier, craftType);
                const priceKey = categoryKey || name;
                const price = calculateMasterworkPrice(priceKey, multiplier, craftType);
                return (
                  <>
                    {stat !== null && (
                      <div className={craftType === "Weapon" ? "text-red-300" : "text-green-300"}>
                        {craftType === "Weapon" ? "DMG" : "DEF"}: {craftType === "Weapon" ? stat.toFixed(2) : Math.round(stat).toString()}
                      </div>
                    )}
                    {price !== null && (
                      <div style={{ color: '#F4E4BC' }}>
                        ${price >= 1000 ? price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : price.toFixed(2)}
                      </div>
                    )}
                  </>
                );
              })()}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-600"></div>
            </div>
          )}
        </div>
      );
    }
    
    const handleLoad = () => {
      loadedImageCache.add(image);
      setImageLoaded(true);
    };
    
    const handleError = () => {
      failedImageCache.add(image);
      setImageError(true);
    };
    
    // Don't render img tag if we know it failed
    if (imageError) {
      return null;
    }
    
    return (
      <div className="group relative flex flex-col items-center">
        <div className="relative h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12">
          <Image 
            src={image} 
            alt={alt}
            fill
            sizes="128px"
            className="object-contain opacity-80 transition-opacity duration-200 group-hover:opacity-100"
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </div>
        {imageLoaded && !imageError && (
          <span className="text-[8px] sm:text-[9px] text-white mt-0.5 font-medium">
            {ratio}
          </span>
        )}
        {/* Tooltip on hover */}
        {name && chance !== undefined && imageLoaded && !imageError && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900/95 border border-zinc-600 rounded-sm text-white text-[9px] sm:text-[10px] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out pointer-events-none z-50 shadow-lg">
            <div className="font-semibold text-zinc-100">{name}</div>
            <div className="text-green-400 font-medium">{(chance * 100).toFixed(2)}%</div>
            {multiplier !== undefined && craftType && name && (() => {
              const stat = calculateMasterworkStat(name, multiplier, craftType);
              const price = calculateMasterworkPrice(name, multiplier, craftType);
              return (
                <>
                  {stat !== null && (
                    <div className={craftType === "Weapon" ? "text-red-300" : "text-green-300"}>
                      {craftType === "Weapon" ? "DMG" : "DEF"}: {craftType === "Weapon" ? stat.toFixed(2) : Math.round(stat).toString()}
                    </div>
                  )}
                  {price !== null && (
                    <div style={{ color: '#F4E4BC' }}>
                      ${price >= 1000 ? price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : price.toFixed(2)}
                    </div>
                  )}
                </>
              );
            })()}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-600"></div>
          </div>
        )}
      </div>
    );
  });

  // Component for Circular Progress Bar
  const CircularProgress = ({ progress, size = 64 }: { progress: number, size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress * circumference);
    
    return (
      <svg 
        width={size} 
        height={size} 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90"
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-100 ease-linear"
        />
      </svg>
    );
  };

  // Component for Slot Button to handle its own state cleanly
  const SlotButton = memo(({ slot, index, onRemoveOne, onRemoveAll, isMobile = false }: { slot: SlotItem | null, index: number, onRemoveOne: (i: number) => void, onRemoveAll: (i: number) => void, isMobile?: boolean }) => {
      const [isHolding, setIsHolding] = useState(false);
      const [progress, setProgress] = useState(0);
      const [isDeleting, setIsDeleting] = useState(false);
      const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
      const holdStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
      const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
      const wasHoldingRef = useRef(false);
      const isMountedRef = useRef(true);

      // Cleanup on unmount
      useEffect(() => {
        isMountedRef.current = true;
        return () => {
          isMountedRef.current = false;
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          if (holdStartTimeoutRef.current) {
            clearTimeout(holdStartTimeoutRef.current);
          }
          if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current);
          }
        };
      }, []);

      // If empty, render simple disabled-like button
      if (!slot) {
          return (
            <button 
                className={`border-2 border-zinc-600 border-dashed bg-black/60 transition-all flex flex-col items-center justify-center relative ${
                  isMobile 
                    ? 'w-full aspect-square' 
                    : 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20'
                }`}
            >
                 <span className={`text-zinc-500 uppercase font-medium ${isMobile ? 'text-xs' : 'text-[8px] sm:text-[10px] md:text-xs'}`}>Empty</span>
            </button>
          );
      }

      const oreImage = getOreImagePath(slot.name);
      
      // Shared logic for starting the hold
      const startHold = () => {
        wasHoldingRef.current = false;
        
        // Wait 150ms before starting the hold progress
        // This allows quick taps/clicks to work normally
        holdStartTimeoutRef.current = setTimeout(() => {
          setIsHolding(true);
          setProgress(0);
          
          // Start progress animation
          const startTime = Date.now();
          const duration = 750; // 0.75 seconds
          
          const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(elapsed / duration, 1);
            setProgress(newProgress);
            
            if (newProgress >= 1) {
              clearInterval(interval);
              progressIntervalRef.current = null;
              // Ensure progress is at 100% before deletion
              setProgress(1);
              // Small delay to ensure visual completion
              setTimeout(() => {
                wasHoldingRef.current = true;
                setIsHolding(false);
                setProgress(0);
                handleDelete(() => onRemoveAll(index));
              }, 50);
            }
          }, 16); // ~60fps
          
          // Store interval reference (we'll clean it up on release)
          progressIntervalRef.current = interval;
        }, 150);
      };

      // Shared logic for ending the hold
      const endHold = () => {
        // Clear the hold start timeout if it hasn't fired yet
        if (holdStartTimeoutRef.current) {
          clearTimeout(holdStartTimeoutRef.current);
          holdStartTimeoutRef.current = null;
        }
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        // Mark that we were holding if progress > 0
        if (progress > 0) {
          wasHoldingRef.current = true;
        }
        setIsHolding(false);
        setProgress(0);
      };

      // Mouse events (desktop)
      const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        startHold();
      };

      const handleMouseUp = () => {
        endHold();
      };

      const handleMouseLeave = () => {
        endHold();
      };

      // Touch events (mobile)
      const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent default to avoid double-firing with mouse events
        startHold();
      };

      const handleTouchEnd = (e: React.TouchEvent) => {
        e.preventDefault();
        // If we were holding, don't trigger tap
        if (wasHoldingRef.current || progress > 0) {
          endHold();
          return;
        }
        endHold();
        // Trigger single tap action (remove one)
        if (!isHolding && progress === 0) {
          handleDelete(() => onRemoveOne(index));
        }
      };

      const handleTouchCancel = () => {
        endHold();
      };

      const handleClick = (e: React.MouseEvent) => {
        // Prevent click if we were holding (even briefly)
        if (wasHoldingRef.current) {
          e.preventDefault();
          wasHoldingRef.current = false;
          return;
        }
        // Only trigger if we didn't hold at all (and not on touch devices - touch handles its own tap)
        if (!isHolding && progress === 0 && !('ontouchstart' in window)) {
          handleDelete(() => onRemoveOne(index));
        }
      };

      const handleDelete = (deleteCallback: () => void) => {
        // Apply visual feedback immediately
        setIsDeleting(true);
        // Call callback immediately to allow rapid consecutive clicks
        deleteCallback();
        // Reset animation state after a brief moment (visual only, doesn't block)
        // Clear any existing timeout
        if (deleteTimeoutRef.current) {
          clearTimeout(deleteTimeoutRef.current);
        }
        deleteTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setIsDeleting(false);
          }
        }, 100);
      };
      
      return (
        <button 
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onClick={handleClick}
            className={`border-2 ${isDeleting ? 'slot-deleting' : RarityColors[ores[slot.name].rarity] || 'border-white'} bg-black/60 hover:bg-black/80 transition-all cursor-pointer flex flex-col items-start justify-start p-0.5 sm:p-1 relative group overflow-hidden select-none ${isDeleting ? '' : 'animate-reverse-zoom'} ${
              isMobile 
                ? 'w-full aspect-square' 
                : 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20'
            }`}
        >
            <div className={`slot-content w-full h-full absolute inset-0`}>
              {oreImage ? (
                  <>
                      <Image 
                          src={oreImage} 
                          alt={slot.name}
                          fill
                          sizes="100px"
                          className="object-cover opacity-80"
                      />
                      <div className={`absolute inset-0 ${RarityBg[ores[slot.name].rarity]} opacity-30`} />
                  </>
              ) : (
                  <div className={`w-full h-full absolute inset-0 opacity-20 ${RarityBg[ores[slot.name].rarity]}`} />
              )}
            </div>

            <span className={`text-left leading-tight font-medium break-words w-full px-1 z-10 relative ${oreImage ? 'text-white' : ''} slot-content ${
              isMobile ? 'text-[10px]' : 'text-[7px] sm:text-[8px] md:text-[10px]'
            }`}>{slot.name}</span>
            <span className={`absolute font-bold text-white z-10 slot-content ${
              isMobile ? 'bottom-1 right-1 text-sm' : 'bottom-0.5 sm:bottom-1 right-0.5 sm:right-1 text-[8px] sm:text-[10px] md:text-xs'
            }`}>x{slot.count}</span>
            
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity z-20 pointer-events-none bg-black/40 ${isHolding || isDeleting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
                    {isHolding && !isDeleting && (
                        <CircularProgress progress={progress} size={56} />
                    )}
                    <TrashIcon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white/80 drop-shadow-[0_0_10px_rgba(255,0,0,1)] filter relative z-10 ${isHolding ? 'scale-110' : ''} ${isDeleting ? 'trash-icon-deleting' : ''} transition-transform`} />
                </div>
            </div>
        </button>
      );
  }, (prevProps, nextProps) => {
    // Custom comparison function for memo
    return (
      prevProps.index === nextProps.index &&
      prevProps.isMobile === nextProps.isMobile &&
      prevProps.slot?.name === nextProps.slot?.name &&
      prevProps.slot?.count === nextProps.slot?.count
    );
  });

  // Component for Ore Button with click animation
  const OreButton = memo(({ 
    oreName, 
    data, 
    oreImage, 
    onClick,
    isMobile = false
  }: { 
    oreName: string, 
    data: OreData, 
    oreImage: string | null, 
    onClick: () => void,
    isMobile?: boolean
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
                    <Image 
                        src={oreImage} 
                        alt={oreName}
                        fill
                        sizes="100px"
                        className="object-cover opacity-80"
                    />
                    <div className={`absolute inset-0 ${RarityBg[data.rarity]} opacity-30`} />
                </>
            ) : null}
            {/* Ore name - larger on mobile */}
            <span 
                className={`text-left leading-tight font-medium break-words w-full px-0.5 relative z-10 ${
                    oreImage ? 'text-white' : ''
                } ${
                    isMobile 
                        ? 'text-[9px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' 
                        : 'text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px]'
                }`}
            >
                {oreName}
            </span>
            {/* Multiplier hint - larger on mobile */}
            <span className={`absolute z-10 font-bold ${
                isMobile 
                    ? 'bottom-0.5 right-0.5 text-[12px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' 
                    : 'bottom-0.5 right-0.5 sm:bottom-0.5 sm:right-1 text-[8px] sm:text-[9px] md:text-[11px] text-zinc-300'
            }`}>{data.multiplier}x</span>
        </button>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for memo
    return (
      prevProps.oreName === nextProps.oreName &&
      prevProps.isMobile === nextProps.isMobile &&
      prevProps.data.multiplier === nextProps.data.multiplier &&
      prevProps.data.rarity === nextProps.data.rarity &&
      prevProps.oreImage === nextProps.oreImage
    );
  });

  // Component for Predicted Item Display to handle its own animation logic
  const PredictedItemDisplay = ({
    results,
    currentTypes,
    craftType
  }: {
    results: any,
    currentTypes: string[],
    craftType: "Weapon" | "Armor"
  }) => {
    // Memoize calculations to prevent unnecessary recalculations
    const predictedData = useMemo(() => {
      const hasResults = results && results.odds && Object.keys(results.odds).length > 0;
      if (!hasResults) {
        return { isVisible: false, predictedItem: null, possibleItems: [], masterworkPrice: null, masterworkStat: null };
      }
      
      const sortedItems = currentTypes
        .map(type => ({ type, pct: results.odds[type] || 0 }))
        .sort((a, b) => b.pct - a.pct);
      const predictedItem = sortedItems[0];
      const isVisible = predictedItem && predictedItem.pct > 0;
      
      if (!isVisible) {
        return { isVisible: false, predictedItem: null, possibleItems: [], masterworkPrice: null, masterworkStat: null };
      }
      
      const possibleItems = getPossibleItemImagesWithChances(predictedItem.type, predictedItem.pct, craftType);
      // Filter out images that we know have failed
      const filteredItems = possibleItems.filter(item => !failedImageCache.has(item.image));
      const multiplier = results?.combinedMultiplier || 0;
      const masterworkPrice = calculateMasterworkPrice(predictedItem.type, multiplier, craftType);
      
      // Calculate stats for all variants to get min-max range
      const stats = filteredItems
        .map(item => calculateMasterworkStat(item.name, multiplier, craftType))
        .filter((stat): stat is number => stat !== null);
      
      let masterworkStat: number | { min: number, max: number } | null = null;
      
      if (stats.length > 0) {
        if (stats.length === 1) {
          // Single variant - show single value
          masterworkStat = stats[0];
        } else {
          // Multiple variants - check if all stats are equal
          const min = Math.min(...stats);
          const max = Math.max(...stats);
          
          // If min and max are the same (all variants have same stat), show single value
          if (Math.abs(min - max) < 0.01) { // Use small epsilon for floating point comparison
            masterworkStat = min;
          } else {
            // Different stats - show range
            masterworkStat = { min, max };
          }
        }
      }
      
      return { isVisible, predictedItem, possibleItems: filteredItems, masterworkPrice, masterworkStat };
    }, [results, currentTypes, craftType]);
    
    const { isVisible, predictedItem, possibleItems, masterworkPrice, masterworkStat } = predictedData;

    return (
        <div
            className={`bg-black/70 border border-zinc-600 px-3 sm:px-4 py-2 sm:py-2.5 text-center w-full z-10 transition-all duration-500 ease-out corner-decoration ${
                isVisible ? 'opacity-100 transform-none' : 'opacity-0 transform translate-y-2'
            }`}
        >
            <div className="corner-decor-top-left border-zinc-600"></div>
            <div className="corner-decor-top-right border-zinc-600"></div>
            <div className="corner-decor-bottom-left border-zinc-600"></div>
            <div className="corner-decor-bottom-right border-zinc-600"></div>
            <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mb-0.5">
                Predicted {craftType}
            </div>
            <div className="text-sm sm:text-base md:text-lg font-bold text-green-400 mb-1.5">
                {predictedItem?.type || 'None'} <span className="text-zinc-300 font-normal">({predictedItem ? (predictedItem.pct * 100).toFixed(1) : '0.0'}%)</span>
            </div>
            {possibleItems.length > 0 ? (
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1.5">
                    {possibleItems.map((item) => (
                        <PredictedItemImage
                            key={item.image}
                            image={item.image}
                            ratio={item.ratio}
                            alt={`${predictedItem?.type || 'item'} variation`}
                            name={item.name}
                            chance={item.chance}
                            multiplier={results?.combinedMultiplier || 0}
                            craftType={craftType}
                            categoryKey={item.categoryKey}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-[9px] sm:text-[10px] text-zinc-500 italic mb-1.5">
                    {craftType === "Weapon" ? "Weapon image coming soon" : "No images available"}
                </div>
            )}
            <div className={`text-[10px] sm:text-xs font-semibold transition-opacity duration-300 ${masterworkPrice !== null ? 'opacity-100' : 'opacity-0'}`}>
                {masterworkPrice !== null && masterworkStat !== null && (
                  <>
                    <div className={craftType === "Weapon" ? "text-red-300" : "text-green-300"}>
                      {craftType === "Weapon" ? "Damage" : "Defense"}: {
                        typeof masterworkStat === 'number' 
                          ? (craftType === "Weapon" ? masterworkStat.toFixed(2) : Math.round(masterworkStat).toString())
                          : (craftType === "Weapon" 
                              ? `${masterworkStat.min.toFixed(2)}-${masterworkStat.max.toFixed(2)}`
                              : `${Math.round(masterworkStat.min)}-${Math.round(masterworkStat.max)}`)
                      }
                    </div>
                    <div style={{ color: '#F4E4BC' }}>
                      Price: ${masterworkPrice >= 1000 ? masterworkPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : masterworkPrice.toFixed(2)}
                    </div>
                  </>
                )}
            </div>
        </div>
    );
  };

  // Traits Modal Component for Mobile
  const TraitsModal = ({ 
    isOpen, 
    onClose, 
    traits 
  }: { 
    isOpen: boolean, 
    onClose: () => void, 
    traits: { ore: string, lines: string[] }[] 
  }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div className="relative w-full max-w-sm bg-zinc-900 border-2 border-zinc-700 shadow-2xl animate-fade-in max-h-[80vh] overflow-hidden flex flex-col corner-decoration">
          <div className="corner-decor-top-left border-zinc-700"></div>
          <div className="corner-decor-top-right border-zinc-700"></div>
          <div className="corner-decor-bottom-left border-zinc-700"></div>
          <div className="corner-decor-bottom-right border-zinc-700"></div>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-zinc-700 bg-zinc-800/50">
            <h3 className="text-orange-400 font-bold uppercase text-sm tracking-wide flex items-center gap-2">
              <EyeIcon className="w-4 h-4" />
              Active Traits
            </h3>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-zinc-400 hover:text-white" />
            </button>
          </div>
          
          {/* Traits Content */}
          <div className="overflow-y-auto p-3 flex-1">
            {traits && traits.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {traits.map((tr: { ore: string, lines: string[] }, idx: number) => (
                  <div key={idx} className="text-xs text-zinc-300 bg-white/5 p-3 border border-white/10 corner-decoration relative">
                    <div className="corner-decor-top-left border-white/10"></div>
                    <div className="corner-decor-top-right border-white/10"></div>
                    <div className="corner-decor-bottom-left border-white/10"></div>
                    <div className="corner-decor-bottom-right border-white/10"></div>
                    <div className="text-orange-300 font-bold mb-1.5 text-sm">{tr.ore || 'Generic'}</div>
                    <div className="space-y-1">
                      {tr.lines.map((l: string, i: number) => (
                        <div key={i} className="text-[11px] leading-relaxed">{l}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-zinc-500 py-8">
                <p className="text-sm">No active traits</p>
                <p className="text-xs mt-1">Add ores with 10%+ composition to see traits</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  export default function Calculator() {
  const [slots, setSlots] = useState<(SlotItem | null)[]>([null, null, null, null]);
  const [craftType, setCraftType] = useState<"Weapon" | "Armor">("Weapon");
  const [searchTerm, setSearchTerm] = useState("");
  const [previousTopItem, setPreviousTopItem] = useState<string | null>(null);
  const [topItemChanged, setTopItemChanged] = useState(false);
  const [isTraitsModalOpen, setIsTraitsModalOpen] = useState(false);
  const [isTraitsFadingOut, setIsTraitsFadingOut] = useState(false);
  const [shouldShowTraits, setShouldShowTraits] = useState(false);
  const previousTraitsLengthRef = useRef<number>(0);
  
  const isMobile = useIsMobile();

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

  // Calculate results whenever slots or craftType changes - memoized for performance
  const results = useMemo(() => {
    const selected: Record<string, number> = {};
    let count = 0;
    slots.forEach(slot => {
        if (slot) {
            selected[slot.name] = (selected[slot.name] || 0) + slot.count;
            count += slot.count;
        }
    });

    if (count === 0) {
        return null;
    }

    return getItemChancesWithTraits(selected, craftType);
  }, [slots, craftType]);

  // Track top item for animation
  useEffect(() => {
    if (!results) {
      setPreviousTopItem(null);
      return;
    }

    const types = craftType === "Weapon" ? WEAPON_TYPES : ARMOR_TYPES;
    const sortedItems = types
      .map(type => ({ type, pct: results.odds?.[type] || 0 }))
      .sort((a, b) => b.pct - a.pct);
    const currentTopItem = sortedItems[0]?.type || null;
    
    if (currentTopItem && currentTopItem !== previousTopItem && previousTopItem !== null && sortedItems[0]?.pct > 0) {
      // New item reached the top, trigger animation
      setTopItemChanged(true);
      setTimeout(() => setTopItemChanged(false), 800);
    }
    
    setPreviousTopItem(currentTopItem);
  }, [results, craftType, previousTopItem]);

  // Handle traits fade-out animation
  useEffect(() => {
    const currentTraitsLength = results?.traits?.length || 0;
    const hadTraits = previousTraitsLengthRef.current > 0;
    const hasTraits = currentTraitsLength > 0;
    
    if (hasTraits) {
      // Traits appeared, show them immediately
      setIsTraitsFadingOut(false);
      setShouldShowTraits(true);
    } else if (hadTraits && !hasTraits) {
      // Traits disappeared (went from having traits to none), start fade-out
      setIsTraitsFadingOut(true);
      // After animation completes, hide the element
      const timer = setTimeout(() => {
        setShouldShowTraits(false);
        setIsTraitsFadingOut(false);
      }, 400); // Match animation duration
      previousTraitsLengthRef.current = 0;
      return () => clearTimeout(timer);
    }
    
    // Update ref for next render
    previousTraitsLengthRef.current = currentTraitsLength;
  }, [results?.traits]);

  const addOreToSlot = useCallback((oreName: string) => {
    setSlots(prev => {
      // Check if ore exists in a slot
      const existingIndex = prev.findIndex(s => s?.name === oreName);
      
      if (existingIndex !== -1) {
        // Increment count
        const newSlots = [...prev];
        const current = newSlots[existingIndex]!;
        newSlots[existingIndex] = { ...current, count: current.count + 1 };
        return newSlots;
      }

      // Find first empty slot
      const emptyIndex = prev.findIndex(s => s === null);
      if (emptyIndex !== -1) {
        const newSlots = [...prev];
        newSlots[emptyIndex] = { name: oreName, count: 1 };
        return newSlots;
      }
      return prev;
    });
  }, []);

  const removeOneOreFromSlot = useCallback((index: number) => {
    setSlots(prev => {
      const newSlots = [...prev];
      const slot = newSlots[index];
      if (slot) {
        if (slot.count > 1) {
          newSlots[index] = { ...slot, count: slot.count - 1 };
        } else {
          newSlots[index] = null;
        }
      }
      return newSlots;
    });
  }, []);

  const removeAllOresFromSlot = useCallback((index: number) => {
    setSlots(prev => {
      const newSlots = [...prev];
      newSlots[index] = null;
      return newSlots;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSlots([null, null, null, null]);
  }, []);

  const currentTypes = craftType === "Weapon" ? WEAPON_TYPES : ARMOR_TYPES;

  return (
    <div className="min-h-screen text-zinc-100 selection:bg-orange-500/30 relative overflow-hidden font-sans">
      {/* Background Image Container */}
      <div className="fixed inset-0 -z-20">
         <Image 
            src="/forge.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ opacity: 0.4 }}
            priority
            quality={85}
         />
      </div>
      
      {/* Overlays */}
      <div className="fixed inset-0 -z-10 bg-zinc-950/80" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50" />

      {/* Traits Modal for Mobile */}
      {isMobile && (
        <TraitsModal 
          isOpen={isTraitsModalOpen} 
          onClose={() => setIsTraitsModalOpen(false)} 
          traits={results?.traits || []} 
        />
      )}

        {/* Main Container */}
        <div className={`min-h-screen flex flex-col p-3 sm:p-4 md:p-8 max-w-[1600px] mx-auto pt-6 sm:pt-8 pb-6 ${isMobile ? 'overflow-x-hidden' : ''}`}>
            
            {/* Header Row - Back Button and Clear Button (mobile only) */}
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <Link 
                    href="/"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs sm:text-sm font-medium"
                >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Home
                </Link>
                
                {/* Clear Button - Mobile Only, positioned top right */}
                {isMobile && (
                    <button 
                        className="bg-gradient-to-t from-red-500/80 to-orange-500/80 hover:from-red-500 hover:to-orange-500 text-white font-bold py-1.5 px-4 rounded-sm border border-red-900/50 uppercase tracking-wider transition-all shadow-lg shadow-red-900/20 text-xs"
                        onClick={clearAll}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* 3 Columns Layout - Restructured for Mobile */}
            <div className={`flex-1 grid gap-4 sm:gap-6 items-start lg:items-center ${
              isMobile 
                ? 'grid-cols-1' 
                : 'grid-cols-1 lg:grid-cols-[280px_1fr_320px] xl:grid-cols-[300px_1fr_350px]'
            }`}>
                
                {/* LEFT PANEL: Forge Chances - Order 4 on mobile (bottom), Order 1 on desktop */}
                <div className={`bg-black/80 border-2 border-zinc-700 flex flex-col relative corner-decoration ${
                  isMobile 
                    ? 'h-[350px] order-4' 
                    : 'h-[400px] sm:h-[500px] md:h-[600px] lg:h-full lg:max-h-[800px] order-2 lg:order-1'
                }`}>
                    <div className="corner-decor-top-left border-zinc-700"></div>
                    <div className="corner-decor-top-right border-zinc-700"></div>
                    <div className="corner-decor-bottom-left border-zinc-700"></div>
                    <div className="corner-decor-bottom-right border-zinc-700"></div>
                    <div className="p-2 sm:p-3 border-b-2 border-zinc-700 bg-zinc-900/90 relative z-0 pointer-events-none">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white uppercase tracking-wide">Forge Chances</h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 relative z-10">
                        {craftType === "Armor" ? (() => {
                            // Group items by categoryKey (Light Helmet, Medium Chestplate, etc.)
                            const armorByCategory = getArmorItemsByCategory();
                            const categoryGroups: Record<string, Array<{name: string, image: string, chance: number, ratio: string}>> = {};
                            
                            // Process each category and group by categoryKey
                            Object.values(armorByCategory).flat().forEach(item => {
                                const categoryChance = results?.odds?.[item.categoryKey] || 0;
                                const { chance, ratio } = getItemChance(item.name, item.categoryKey, categoryChance, "Armor");
                                
                                                if (!categoryGroups[item.categoryKey]) {
                                                    categoryGroups[item.categoryKey] = [];
                                                }
                                                
                                                categoryGroups[item.categoryKey].push({
                                                    name: item.name,
                                                    image: item.image, // Already has version parameter
                                                    chance: chance,
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
                                        className={`opacity-90 transition-all duration-300 relative ${
                                            isNewTop ? 'top-item-animation' : ''
                                        }`}
                                    >
                                        {/* Category Header */}
                                        <div className="flex justify-between items-center mb-1 sm:mb-1.5 relative z-0">
                                            <span className="text-zinc-300 text-xs sm:text-sm font-medium">{category.categoryKey}</span>
                                            <span className={`text-xs sm:text-sm font-bold flex-shrink-0 ${category.categoryChance > 0 ? 'text-green-400' : 'text-zinc-600'}`}>
                                                ({(category.categoryChance * 100).toFixed(0)}%)
                                            </span>
                                        </div>
                                        
                                        {/* Variation Slots */}
                                        <div className={`bg-zinc-800/50 border border-zinc-700 p-1.5 sm:p-2 mb-1 flex gap-1.5 sm:gap-2 relative corner-decoration ${category.categoryChance > 0 ? 'border-green-900/50 bg-green-900/10' : ''}`}>
                                            <div className={`corner-decor-top-left ${category.categoryChance > 0 ? 'border-green-900/50' : 'border-zinc-700'}`}></div>
                                            <div className={`corner-decor-top-right ${category.categoryChance > 0 ? 'border-green-900/50' : 'border-zinc-700'}`}></div>
                                            <div className={`corner-decor-bottom-left ${category.categoryChance > 0 ? 'border-green-900/50' : 'border-zinc-700'}`}></div>
                                            <div className={`corner-decor-bottom-right ${category.categoryChance > 0 ? 'border-green-900/50' : 'border-zinc-700'}`}></div>
                                            {category.items.map((item, itemIndex) => (
                                                <div 
                                                    key={item.name}
                                                    className="group flex-1 h-8 sm:h-10 md:h-12 flex flex-col items-center justify-center relative overflow-visible"
                                                >
                                                    <div className="relative w-full h-full">
                                                      <Image 
                                                          src={item.image} 
                                                          alt={item.name}
                                                          fill
                                                          sizes="128px"
                                                          className="object-contain opacity-80 transition-opacity duration-200 group-hover:opacity-100"
                                                      />
                                                    </div>
                                                    <span className="absolute bottom-0 left-0 right-0 text-[8px] sm:text-[9px] text-white text-center font-medium">
                                                        {item.ratio}
                                                    </span>
                                                    {/* Tooltip on hover */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900/95 border border-zinc-600 rounded-sm text-white text-[9px] sm:text-[10px] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out pointer-events-none z-[9999] shadow-lg">
                                                        <div className="font-semibold text-zinc-100">{item.name}</div>
                                                        <div className="text-green-400 font-medium">{(item.chance * 100).toFixed(2)}%</div>
                                                        {results?.combinedMultiplier !== undefined && (() => {
                                                          const stat = calculateMasterworkStat(item.name, results.combinedMultiplier, "Armor");
                                                          const price = calculateMasterworkPrice(category.categoryKey, results.combinedMultiplier, "Armor");
                                                          return (
                                                            <>
                                                              {stat !== null && (
                                                                <div className="text-green-300">
                                                                  DEF: {Math.round(stat).toString()}
                                                                </div>
                                                              )}
                                                              {price !== null && (
                                                                <div style={{ color: '#F4E4BC' }}>
                                                                  ${price >= 1000 ? price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : price.toFixed(2)}
                                                                </div>
                                                              )}
                                                            </>
                                                          );
                                                        })()}
                                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-600"></div>
                                                    </div>
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
                        })() : (() => {
                            // For Weapons: Group items by categoryKey (Dagger, Great Sword, etc.)
                            const weaponByCategory = getWeaponItemsByCategory();
                            const categoryGroups: Record<string, Array<{name: string, image: string, chance: number, ratio: string}>> = {};
                            
                            // Process each category and group by categoryKey
                            Object.values(weaponByCategory).flat().forEach(item => {
                                const categoryChance = results?.odds?.[item.categoryKey] || 0;
                                const { chance, ratio } = getItemChance(item.name, item.categoryKey, categoryChance, "Weapon");
                                
                                                if (!categoryGroups[item.categoryKey]) {
                                                    categoryGroups[item.categoryKey] = [];
                                                }
                                                
                                                categoryGroups[item.categoryKey].push({
                                                    name: item.name,
                                                    image: item.image, // Already has version parameter
                                                    chance: chance,
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
                                        className={`opacity-90 transition-all duration-300 relative ${
                                            isNewTop ? 'top-item-animation' : ''
                                        }`}
                                    >
                                        {/* Category Header */}
                                        <div className="flex justify-between items-center mb-1 sm:mb-1.5 relative z-0">
                                            <span className="text-zinc-300 text-xs sm:text-sm font-medium">{category.categoryKey}</span>
                                            <span className={`text-xs sm:text-sm font-bold flex-shrink-0 ${category.categoryChance > 0 ? 'text-green-400' : 'text-zinc-600'}`}>
                                                ({(category.categoryChance * 100).toFixed(0)}%)
                                            </span>
                                        </div>
                                        
                                        {/* Variation Slots */}
                                        <div className={`bg-zinc-800/50 border border-zinc-700 p-1.5 sm:p-2 mb-1 flex gap-1.5 sm:gap-2 relative z-10 corner-decoration ${category.categoryChance > 0 ? 'border-green-900/50 bg-green-900/10' : ''}`}>
                                            <div className={`corner-decor-top-left ${category.categoryChance > 0 ? 'border-green-900/50' : 'border-zinc-700'}`}></div>
                                            <div className={`corner-decor-top-right ${category.categoryChance > 0 ? 'border-green-900/50' : 'border-zinc-700'}`}></div>
                                            <div className={`corner-decor-bottom-left ${category.categoryChance > 0 ? 'border-green-900/50' : 'border-zinc-700'}`}></div>
                                            <div className={`corner-decor-bottom-right ${category.categoryChance > 0 ? 'border-green-900/50' : 'border-zinc-700'}`}></div>
                                            {category.items.map((item, itemIndex) => (
                                                <div 
                                                    key={item.name}
                                                    className="group flex-1 h-8 sm:h-10 md:h-12 flex flex-col items-center justify-center relative overflow-visible z-20"
                                                >
                                                    <div className="relative w-full h-full z-10">
                                                      <Image 
                                                          src={item.image} 
                                                          alt={item.name}
                                                          fill
                                                          sizes="128px"
                                                          className="object-contain opacity-80 transition-opacity duration-200 group-hover:opacity-100"
                                                          loading="lazy"
                                                      />
                                                    </div>
                                                    <span className="absolute bottom-0 left-0 right-0 text-[8px] sm:text-[9px] text-white text-center font-medium z-10">
                                                        {item.ratio}
                                                    </span>
                                                    {/* Tooltip on hover */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900/95 border border-zinc-600 rounded-sm text-white text-[9px] sm:text-[10px] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out pointer-events-none z-[100] shadow-lg">
                                                        <div className="font-semibold text-zinc-100">{item.name}</div>
                                                        <div className="text-green-400 font-medium">{(item.chance * 100).toFixed(2)}%</div>
                                                        {results?.combinedMultiplier !== undefined && (() => {
                                                          const stat = calculateMasterworkStat(item.name, results.combinedMultiplier, "Weapon");
                                                          const price = calculateMasterworkPrice(category.categoryKey, results.combinedMultiplier, "Weapon");
                                                          return (
                                                            <>
                                                              {stat !== null && (
                                                                <div className="text-red-300">
                                                                  DMG: {stat.toFixed(2)}
                                                                </div>
                                                              )}
                                                              {price !== null && (
                                                                <div style={{ color: '#F4E4BC' }}>
                                                                  ${price >= 1000 ? price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : price.toFixed(2)}
                                                                </div>
                                                              )}
                                                            </>
                                                          );
                                                        })()}
                                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-600"></div>
                                                    </div>
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
                        })()}
                    </div>
                </div>

                {/* CENTER PANEL: Cauldron & Slots - Order 1 on mobile (top), Order 2 on desktop */}
                <div className={`flex flex-col items-center justify-start w-full relative ${
                  isMobile 
                    ? 'order-1 mb-4' 
                    : 'order-1 lg:order-2 mb-6 lg:mb-0'
                } pt-0`}>
                    {/* Chain decoration (visual only, simplified) */}
                    <div className="absolute top-0 w-full flex justify-center -z-10 opacity-50 pointer-events-none">
                         {/* You would put chain SVG here */}
                    </div>

                    {/* Predicted Item - Compact with reserved height */}
                    <div className={`relative w-full flex justify-center items-start ${
                      isMobile 
                        ? 'max-w-full h-[130px] mb-3' 
                        : 'max-w-xs sm:max-w-sm md:max-w-md min-h-[120px] sm:min-h-[140px] md:min-h-[160px] mb-4 sm:mb-5 md:mb-6'
                    }`}>
                        <PredictedItemDisplay
                            results={results}
                            currentTypes={currentTypes}
                            craftType={craftType}
                        />
                    </div>

                    {/* Cauldron Area - Fixed height for mobile */}
                    <div className={`relative w-full flex flex-col items-center justify-center bg-radial-gradient from-orange-900/20 to-transparent rounded-full ${
                      isMobile 
                        ? 'max-w-full h-[220px] mb-2' 
                        : 'max-w-xs sm:max-w-sm md:max-w-md mb-1.5 sm:mb-2'
                    }`}>
                        {/* Slots - Full width on mobile */}
                        <div className={`grid grid-cols-4 z-10 ${
                          isMobile 
                            ? 'gap-3 mb-2 w-full px-3' 
                            : 'gap-2 sm:gap-3 md:gap-4 mb-1.5 sm:mb-2 px-2 sm:px-0'
                        }`}>
                            {slots.map((slot, idx) => (
                                <SlotButton 
                                    key={`${idx}-${slot?.name ?? 'empty'}-${slot?.count ?? 0}`}
                                    index={idx}
                                    slot={slot}
                                    onRemoveOne={removeOneOreFromSlot}
                                    onRemoveAll={removeAllOresFromSlot}
                                    isMobile={isMobile}
                                />
                            ))}
                        </div>

                        {/* Composition - Fixed height container */}
                        <div className={`text-center px-2 ${isMobile ? 'h-[24px] mb-2' : 'mb-1.5 sm:mb-2'}`}>
                            {results && results.composition && Object.keys(results.composition).length > 0 ? (
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
                            ) : (
                                <div className="h-full" /> /* Reserved space */
                            )}
                        </div>

                        <div className={`text-center ${isMobile ? 'mt-1' : 'mb-1.5 sm:mb-2'}`}>
                             <div className={`text-zinc-400 font-medium uppercase tracking-wider ${isMobile ? 'text-sm' : 'text-sm sm:text-base md:text-lg'}`}>Multiplier</div>
                             <div className={`font-bold text-white ${isMobile ? 'text-3xl' : 'text-2xl sm:text-3xl md:text-4xl'}`}>{results?.combinedMultiplier ? `${results.combinedMultiplier.toFixed(2)}x` : '0x'}</div>
                        </div>
                    </div>

                    {/* Active Traits - Button on Mobile (always reserve space), Full display on Desktop */}
                    <div className={`w-full ${isMobile ? 'h-[44px]' : 'max-w-xs sm:max-w-sm md:max-w-md min-h-[80px]'} mb-1.5 sm:mb-2`}>
                    {isMobile ? (
                        /* Mobile: Show button to open traits modal - invisible when no traits but space is reserved */
                        shouldShowTraits && results?.traits && results.traits.length > 0 && (
                            <button
                                onClick={() => setIsTraitsModalOpen(true)}
                                className={`w-full py-2.5 px-4 border bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30 flex items-center justify-center gap-2 corner-decoration relative ${
                                    isTraitsFadingOut ? 'animate-fade-out pointer-events-none' : 'animate-fade-in'
                                }`}
                            >
                                <div className="corner-decor-top-left border-orange-500/50"></div>
                                <div className="corner-decor-top-right border-orange-500/50"></div>
                                <div className="corner-decor-bottom-left border-orange-500/50"></div>
                                <div className="corner-decor-bottom-right border-orange-500/50"></div>
                                <EyeIcon className="w-4 h-4" />
                                <span className="font-bold uppercase text-xs tracking-wide">
                                  View Active Traits ({results.traits.length})
                                </span>
                            </button>
                        )
                    ) : (
                        /* Desktop: Show full traits panel with fade in/out animations */
                        shouldShowTraits && (isTraitsFadingOut || (results?.traits && results.traits.length > 0)) && (
                             <div className={`w-full bg-black/40 border border-white/10 p-2 sm:p-3 md:p-4 corner-decoration relative ${
                               isTraitsFadingOut ? 'animate-fade-out' : 'animate-fade-in'
                             }`}>
                                <div className="corner-decor-top-left border-white/10"></div>
                                <div className="corner-decor-top-right border-white/10"></div>
                                <div className="corner-decor-bottom-left border-white/10"></div>
                                <div className="corner-decor-bottom-right border-white/10"></div>
                                <h3 className="text-orange-400 font-bold mb-1.5 sm:mb-2 uppercase text-xs sm:text-sm text-center">Active Traits</h3>
                                {results?.traits && results.traits.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        {results.traits.map((tr: any, idx: number) => (
                                            <div key={idx} className="text-[10px] sm:text-xs text-zinc-300 bg-white/5 p-1.5 sm:p-2 border border-white/5 text-center w-full h-full flex flex-col justify-center corner-decoration relative">
                                                <div className="corner-decor-top-left border-white/5"></div>
                                                <div className="corner-decor-top-right border-white/5"></div>
                                                <div className="corner-decor-bottom-left border-white/5"></div>
                                                <div className="corner-decor-bottom-right border-white/5"></div>
                                                <div className="text-orange-300 font-bold mb-0.5 sm:mb-1">{tr.ore || 'Generic'}</div>
                                                <div className="space-y-0.5">
                                                    {tr.lines.map((l: string, i: number) => (
                                                        <div key={i} className="text-[9px] sm:text-[10px]">{l}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                             </div>
                        )
                    )}
                    </div>

                    {/* Desktop Only: Star message and Clear button */}
                    {!isMobile && (
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
                    )}
                </div>

                {/* RIGHT PANEL: Ore Selector - Order 3 on mobile (above forge chances), Order 3 on desktop */}
                <div className={`bg-black/80 border-2 border-zinc-700 flex flex-col relative corner-decoration ${
                  isMobile 
                    ? 'h-[280px] order-3' 
                    : 'h-[400px] sm:h-[500px] md:h-[600px] lg:h-full lg:max-h-[800px] order-3'
                }`}>
                    <div className="corner-decor-top-left border-zinc-700"></div>
                    <div className="corner-decor-top-right border-zinc-700"></div>
                    <div className="corner-decor-bottom-left border-zinc-700"></div>
                    <div className="corner-decor-bottom-right border-zinc-700"></div>
                     <div className="p-2 sm:p-3 border-b-2 border-zinc-700 bg-zinc-900/90">
                        <div className="flex justify-between items-center mb-2 sm:mb-3">
                            <h2 className={`font-bold text-white uppercase tracking-wide ${isMobile ? 'text-sm' : 'text-base sm:text-lg md:text-xl'}`}>Select Ores</h2>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search ores..." 
                            className="w-full bg-zinc-950 border border-zinc-700 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Ore Grid - 4 columns on mobile with smaller icons */}
                    <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">
                        <div className={`grid gap-1.5 sm:gap-2 ${
                          isMobile 
                            ? 'grid-cols-4' 
                            : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4'
                        }`}>
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
                                        isMobile={isMobile}
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
