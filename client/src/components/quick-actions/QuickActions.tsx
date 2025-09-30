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
    if (!stored) return fallback;
    
    const parsed = JSON.parse(stored);
    
    // Ensure it's an array with at least one element
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallback;
    }
    
    // Ensure all elements are strings
    if (!parsed.every(item => typeof item === 'string')) {
      return fallback;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return fallback;
  }
}

export default function QuickActions() {
  const { toast } = useToast();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => 
    loadFromStorage(STORAGE_KEY_VISIBLE, DEFAULT_VISIBLE_KEYS)
  );

  const [orderedKeys, setOrderedKeys] = useState<string[]>(() => 
    loadFromStorage(STORAGE_KEY_ORDER, DEFAULT_VISIBLE_KEYS)
  );

  useEffect(() => {
    if (Array.isArray(orderedKeys) && orderedKeys.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(orderedKeys));
      } catch (error) {
        console.error("Error saving order to localStorage:", error);
      }
    }
  }, [orderedKeys]);

  useEffect(() => {
    if (Array.isArray(visibleKeys) && visibleKeys.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify(visibleKeys));
      } catch (error) {
        console.error("Error saving visibility to localStorage:", error);
      }
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

  // Build visible actions with maximum safety
  const visibleActions = (() => {
    if (!Array.isArray(orderedKeys)) return [];
    if (!Array.isArray(visibleKeys)) return [];
    
    return orderedKeys
      .filter(key => typeof key === 'string' && visibleKeys.includes(key))
      .map(key => ALL_QUICK_ACTIONS.find(a => a.key === key))
      .filter((action): action is QuickAction => action !== undefined);
  })();

  const activeAction = activeId 
    ? ALL_QUICK_ACTIONS.find(a => a.key === activeId) 
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setOrderedKeys((keys) => {
        if (!Array.isArray(keys) || keys.length === 0) return keys;
        const oldIndex = keys.indexOf(active.id as string);
        const newIndex = keys.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return keys;
        return arrayMove(keys, oldIndex, newIndex);
      });
    }
  };

  const toggleReorderMode = () => {
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
  };

  const handleVisibilityChange = (newVisibleKeys: string[]) => {
    if (!Array.isArray(newVisibleKeys)) return;
    
    setVisibleKeys(newVisibleKeys);
    
    const currentOrdered = Array.isArray(orderedKeys) ? orderedKeys : [];
    const newKeys = newVisibleKeys.filter(k => !currentOrdered.includes(k));
    if (newKeys.length > 0) {
      setOrderedKeys([...currentOrdered, ...newKeys]);
    }
    
    toast({
      title: "Quick Actions Updated",
      description: `${newVisibleKeys.length} actions selected.`,
    });
  };

  if (!visibleActions || visibleActions.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
          <CustomizeDialog
            isOpen={isCustomizeOpen}
            onOpenChange={setIsCustomizeOpen}
            visibleKeys={Array.isArray(visibleKeys) ? visibleKeys : []}
            onVisibilityChange={handleVisibilityChange}
          />
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No quick actions selected. Click Customize to add some!</p>
        </div>
      </div>
    );
  }

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
            visibleKeys={Array.isArray(visibleKeys) ? visibleKeys : []}
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
        
        <DragOverlay>
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
}
