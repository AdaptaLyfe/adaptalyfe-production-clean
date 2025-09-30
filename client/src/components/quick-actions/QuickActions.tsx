import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { GripVertical } from "lucide-react";
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
          description: "Drag and drop cards to reorder them.",
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
          <CustomizeDialog
            isOpen={isCustomizeOpen}
            onOpenChange={setIsCustomizeOpen}
            visibleKeys={Array.isArray(visibleKeys) ? visibleKeys : [...DEFAULT_VISIBLE_KEYS]}
            onVisibilityChange={handleVisibilityChange}
          />
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No quick actions selected. Click Customize to add some!</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
          <div className="flex gap-3">
            <button 
              onClick={toggleReorderMode}
              data-testid="button-reorder-quick-actions"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                isReorderMode 
                  ? 'bg-blue-500 text-white border-2 border-blue-500' 
                  : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50'
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
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4 flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-blue-600" />
            <p className="text-blue-800 text-sm font-medium">Drag and drop cards to reorder them</p>
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
            <div className="flex flex-wrap gap-4">
              {visibleActions.map((action) => (
                <div
                  key={action.key}
                  className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(16.666%-0.833rem)]"
                >
                  <SortableCard
                    id={action.key}
                    action={action}
                    isReorderMode={isReorderMode}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay dropAnimation={null}>
            {activeAction ? (
              <div className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(16.666%-0.833rem)]">
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
      <div className="mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Error loading Quick Actions. Please refresh the page.</p>
        </div>
      </div>
    );
  }
}
