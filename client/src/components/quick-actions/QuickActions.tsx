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

export default function QuickActions() {
  const { toast } = useToast();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Load from localStorage or use defaults
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_VISIBLE);
    return stored ? JSON.parse(stored) : DEFAULT_VISIBLE_KEYS;
  });

  const [orderedKeys, setOrderedKeys] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_ORDER);
    return stored ? JSON.parse(stored) : DEFAULT_VISIBLE_KEYS;
  });

  // Persist to localStorage whenever order or visibility changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(orderedKeys));
  }, [orderedKeys]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify(visibleKeys));
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

  const visibleActions = orderedKeys
    .filter(key => visibleKeys.includes(key))
    .map(key => ALL_QUICK_ACTIONS.find(a => a.key === key))
    .filter(Boolean) as QuickAction[];

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
        const oldIndex = keys.indexOf(active.id as string);
        const newIndex = keys.indexOf(over.id as string);
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
    setVisibleKeys(newVisibleKeys);
    
    // Add any newly visible items to the ordered list
    const newKeys = newVisibleKeys.filter(k => !orderedKeys.includes(k));
    if (newKeys.length > 0) {
      setOrderedKeys([...orderedKeys, ...newKeys]);
    }
    
    toast({
      title: "Quick Actions Updated",
      description: `${newVisibleKeys.length} actions selected.`,
    });
  };

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
            visibleKeys={visibleKeys}
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
