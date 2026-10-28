import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCard } from "./SortableCard";
import { QuickActionCard } from "./QuickActionCard";
import { CustomizeDialog } from "./CustomizeDialog";
import { ALL_QUICK_ACTIONS, DEFAULT_VISIBLE_KEYS, type QuickAction } from "./constants";
import { GripVertical, LayoutGrid, Crown, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY_ORDER = "quick-actions-order";
const STORAGE_KEY_VISIBLE = "quick-actions-visible";

function loadFromStorage(key: string, fallback: string[]): string[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored || stored === 'null' || stored === 'undefined') {
      return fallback;
    }
    
    const parsed = JSON.parse(stored);
    
    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      return fallback;
    }
    
    if (!parsed.every(item => typeof item === 'string')) {
      return fallback;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    localStorage.removeItem(key);
    return fallback;
  }
}

export default function QuickActions() {
  const { toast } = useToast();
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  const tier = String(user?.subscriptionTier || "free").toLowerCase();
  const isFreePlan = tier === "free" || tier === "basic";
  const planLabel = isFreePlan ? "Basic Plan" : `${tier[0].toUpperCase()}${tier.slice(1)} Plan`;

  const cardShell = "rounded-3xl bg-white/80 border border-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-4 sm:p-5";
  const title = (
    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
      <LayoutGrid className="h-5 w-5 text-slate-700" />
      Quick Actions <span className="text-sm font-normal text-slate-500">({planLabel})</span>
    </h3>
  );
  const upgradeLink = isFreePlan ? (
    <Link href="/subscription">
      <span className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 cursor-pointer whitespace-nowrap">
        <Crown className="h-4 w-4" />
        Upgrade for more features
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  ) : null;
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => 
    loadFromStorage(STORAGE_KEY_VISIBLE, [...DEFAULT_VISIBLE_KEYS])
  );

  const [orderedKeys, setOrderedKeys] = useState<string[]>(() => 
    loadFromStorage(STORAGE_KEY_ORDER, [...DEFAULT_VISIBLE_KEYS])
  );

  useEffect(() => {
    try {
      if (Array.isArray(orderedKeys) && orderedKeys.length > 0) {
        localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(orderedKeys));
      }
    } catch (error) {
      console.error("Error saving order:", error);
    }
  }, [orderedKeys]);

  useEffect(() => {
    try {
      if (Array.isArray(visibleKeys) && visibleKeys.length > 0) {
        localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify(visibleKeys));
      }
    } catch (error) {
      console.error("Error saving visibility:", error);
    }
  }, [visibleKeys]);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  let visibleActions: QuickAction[] = [];
  try {
    const safeOrderedKeys = Array.isArray(orderedKeys) ? orderedKeys : [...DEFAULT_VISIBLE_KEYS];
    const safeVisibleKeys = Array.isArray(visibleKeys) ? visibleKeys : [...DEFAULT_VISIBLE_KEYS];
    
    visibleActions = safeOrderedKeys
      .filter(key => key && typeof key === 'string' && safeVisibleKeys.includes(key))
      .map(key => ALL_QUICK_ACTIONS.find(a => a && a.key === key))
      .filter((action): action is QuickAction => !!action && typeof action === 'object' && 'key' in action);
  } catch (error) {
    console.error("Error building visible actions:", error);
    visibleActions = [];
  }

  const activeAction = activeId 
    ? ALL_QUICK_ACTIONS.find(a => a && a.key === activeId) 
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    try {
      setActiveId(event.active.id as string);
    } catch (error) {
      console.error("Error in handleDragStart:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    try {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        setOrderedKeys((keys) => {
          if (!Array.isArray(keys) || keys.length === 0) return [...DEFAULT_VISIBLE_KEYS];
          const oldIndex = keys.indexOf(active.id as string);
          const newIndex = keys.indexOf(over.id as string);
          if (oldIndex === -1 || newIndex === -1) return keys;
          return arrayMove(keys, oldIndex, newIndex);
        });
      }
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
    }
  };

  const toggleReorderMode = () => {
    try {
      setIsReorderMode(!isReorderMode);
      if (!isReorderMode) {
        toast({
          title: "Reorder Mode Active",
          description: "Drag the blue grip or tap arrows to reorder.",
        });
      } else {
        toast({
          title: "Changes Saved",
          description: "Your new order has been saved.",
        });
      }
    } catch (error) {
      console.error("Error toggling reorder mode:", error);
    }
  };

  const moveItem = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= visibleActions.length) return;
    
    setOrderedKeys((keys) => {
      if (!Array.isArray(keys) || keys.length === 0) return keys;
      const newKeys = [...keys];
      const visibleKey = visibleActions[index]?.key;
      const targetKey = visibleActions[newIndex]?.key;
      if (!visibleKey || !targetKey) return keys;
      
      const keyIndex = newKeys.indexOf(visibleKey);
      const targetKeyIndex = newKeys.indexOf(targetKey);
      if (keyIndex === -1 || targetKeyIndex === -1) return keys;
      
      [newKeys[keyIndex], newKeys[targetKeyIndex]] = [newKeys[targetKeyIndex], newKeys[keyIndex]];
      return newKeys;
    });
  };

  const handleVisibilityChange = (newVisibleKeys: string[]) => {
    try {
      if (!Array.isArray(newVisibleKeys)) return;
      
      setVisibleKeys(newVisibleKeys);
      
      const currentOrdered = Array.isArray(orderedKeys) ? orderedKeys : [...DEFAULT_VISIBLE_KEYS];
      const newKeys = newVisibleKeys.filter(k => k && !currentOrdered.includes(k));
      if (newKeys.length > 0) {
        setOrderedKeys([...currentOrdered, ...newKeys]);
      }
      
      toast({
        title: "Quick Actions Updated",
        description: `${newVisibleKeys.length} actions selected.`,
      });
    } catch (error) {
      console.error("Error handling visibility change:", error);
    }
  };

  if (!visibleActions || visibleActions.length === 0) {
    return (
      <div className={cardShell}>
        <div className="flex items-center justify-between mb-4">
          {title}
          <CustomizeDialog
            isOpen={isCustomizeOpen}
            onOpenChange={setIsCustomizeOpen}
            visibleKeys={Array.isArray(visibleKeys) ? visibleKeys : [...DEFAULT_VISIBLE_KEYS]}
            onVisibilityChange={handleVisibilityChange}
          />
        </div>
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-slate-600">No quick actions selected. Click Customize to add some!</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className={cardShell}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {title}
          <div className="flex items-center gap-2 sm:gap-3">
            {upgradeLink}
            <button 
              onClick={toggleReorderMode}
              data-testid="button-reorder-quick-actions"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                isReorderMode 
                  ? 'bg-violet-600 text-white border-violet-600' 
                  : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <GripVertical className="w-4 h-4" />
              Reorder
            </button>
            
            <CustomizeDialog
              isOpen={isCustomizeOpen}
              onOpenChange={setIsCustomizeOpen}
              visibleKeys={Array.isArray(visibleKeys) ? visibleKeys : [...DEFAULT_VISIBLE_KEYS]}
              onVisibilityChange={handleVisibilityChange}
            />
          </div>
        </div>
        
        {isReorderMode && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 mb-4 flex items-center gap-2 select-none">
            <GripVertical className="w-5 h-5 text-violet-600" />
            <p className="text-violet-800 text-sm font-medium">Drag the blue grip or tap arrows to reorder</p>
          </div>
        )}
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={visibleActions.map(a => a.key)}
            strategy={rectSortingStrategy}
          >
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3 ${isReorderMode ? 'select-none' : ''}`}>
              {visibleActions.map((action, index) => (
                <div key={action.key} className="min-w-0">
                  <SortableCard
                    id={action.key}
                    action={action}
                    isReorderMode={isReorderMode}
                    index={index}
                    totalCount={visibleActions.length}
                    onMove={moveItem}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay dropAnimation={null}>
            {activeAction ? (
              <div className="w-full">
                <QuickActionCard
                  action={activeAction}
                  isReorderMode={isReorderMode}
                  isDragging={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    );
  } catch (error) {
    console.error("Error rendering QuickActions:", error);
    return (
      <div className={cardShell}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Error loading Quick Actions. Please refresh the page.</p>
        </div>
      </div>
    );
  }
}
