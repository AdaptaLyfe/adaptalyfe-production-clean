// Build version: 2026-01-17-v3 - Force Railway cache bust
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Smile, 
  CheckSquare, 
  Calendar, 
  Stethoscope, 
  DollarSign, 
  MessageSquare,
  Users,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  Settings,
  Pill,
  BookOpen,
  Star,
  GraduationCap,
  FileText,
  GripVertical
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const ALL_ACTIONS = [
  {
    key: "mood-tracking",
    label: "Mood Log",
    description: "Track your mood",
    icon: Smile,
    route: "/mood-tracking",
    bgColor: "bg-orange-500"
  },
  {
    key: "mood-checkin",
    label: "Mood Check-in",
    description: "How are you feeling?",
    icon: Smile,
    route: "/mood-tracking",
    bgColor: "bg-pink-500"
  },
  {
    key: "daily-tasks",
    label: "Daily Tasks",
    description: "Complete activities",
    icon: CheckSquare,
    route: "/daily-tasks",
    bgColor: "bg-teal-500"
  },
  {
    key: "medical",
    label: "Health Records",
    description: "Personal health info",
    icon: Stethoscope,
    route: "/medical",
    bgColor: "bg-pink-500"
  },
  {
    key: "financial",
    label: "Bill Reminders",
    description: "Manage payments",
    icon: Calendar,
    route: "/financial",
    bgColor: "bg-blue-500"
  },
  {
    key: "ai-chat",
    label: "AI Chat Assistant",
    description: "Get help from AI",
    icon: MessageSquare,
    route: "/ai-chat",
    bgColor: "bg-cyan-500"
  },
  {
    key: "caregiver",
    label: "Contact Support",
    description: "Reach caregivers",
    icon: Users,
    route: "/caregiver",
    bgColor: "bg-indigo-500"
  },
  {
    key: "meal-shopping",
    label: "Meals & Shopping",
    description: "Plan and shop",
    icon: ShoppingCart,
    route: "/meal-shopping",
    bgColor: "bg-orange-500"
  },
  {
    key: "personal-documents",
    label: "Personal Documents",
    description: "Access important documents",
    icon: FileText,
    route: "/personal-documents",
    bgColor: "bg-blue-400"
  },
  {
    key: "pharmacy",
    label: "Medication List",
    description: "Manage medications",
    icon: Pill,
    route: "/pharmacy",
    bgColor: "bg-red-500"
  },
  {
    key: "resources",
    label: "Resources",
    description: "Helpful guides",
    icon: BookOpen,
    route: "/resources",
    bgColor: "bg-yellow-500"
  },
  {
    key: "rewards",
    label: "Achievements",
    description: "View rewards",
    icon: Star,
    route: "/rewards",
    bgColor: "bg-amber-500"
  },
  {
    key: "academic",
    label: "Academic Planner",
    description: "School tasks",
    icon: GraduationCap,
    route: "/academic-planner",
    bgColor: "bg-violet-500"
  }
];

interface SortableCardProps {
  action: typeof ALL_ACTIONS[0];
  index: number;
  totalCount: number;
  isReorderMode: boolean;
  onCardClick: (route: string) => void;
  onMove: (index: number, direction: 'left' | 'right') => void;
}

function SortableCard({ action, index, totalCount, isReorderMode, onCardClick, onMove }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: action.key,
    disabled: !isReorderMode 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const Icon = action.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`card-quick-action-${action.key}`}
      className={`
        bg-white rounded-2xl shadow-lg transition-all p-6 flex flex-col items-center text-center relative
        ${isReorderMode ? 'border-2 border-blue-300' : 'cursor-pointer hover:shadow-xl'}
        ${isDragging ? 'opacity-70 scale-105 shadow-2xl' : ''}
      `}
      onClick={() => !isReorderMode && onCardClick(action.route)}
    >
      {isReorderMode && (
        <>
          <div className="absolute top-2 left-0 right-0 flex justify-between px-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onMove(index, 'left'); }}
              disabled={index === 0}
              className={`p-1.5 rounded-full transition-colors ${
                index === 0 
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:bg-blue-300'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div 
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className="p-2.5 bg-blue-500 rounded-full cursor-grab active:cursor-grabbing touch-none select-none"
              style={{ touchAction: 'none' }}
            >
              <GripVertical className="w-5 h-5 text-white" />
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onMove(index, 'right'); }}
              disabled={index === totalCount - 1}
              className={`p-1.5 rounded-full transition-colors ${
                index === totalCount - 1 
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:bg-blue-300'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
      <div className={`w-16 h-16 ${action.bgColor} rounded-xl flex items-center justify-center mb-3 shadow-md ${isReorderMode ? 'mt-6' : ''}`}>
        <Icon className="text-white w-8 h-8" />
      </div>
      <h4 className="font-semibold text-gray-900 text-sm mb-1 leading-tight">
        {action.label}
      </h4>
      <p className="text-xs text-gray-600 leading-tight">
        {action.description}
      </p>
    </div>
  );
}

export default function CustomizableQuickActions() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  
  // Default visible actions - only 6 cards
  const [visibleActionKeys, setVisibleActionKeys] = useState([
    "meal-shopping", "medical", "daily-tasks", 
    "mood-checkin", "personal-documents", "financial"
  ]);

  const visibleActions = visibleActionKeys
    .map(key => ALL_ACTIONS.find(a => a.key === key))
    .filter(Boolean) as typeof ALL_ACTIONS;

  // Configure sensor - PointerSensor handles both mouse and touch on modern browsers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = visibleActionKeys.indexOf(active.id as string);
      const newIndex = visibleActionKeys.indexOf(over.id as string);
      setVisibleActionKeys(arrayMove(visibleActionKeys, oldIndex, newIndex));
    }
  };

  const moveItem = (index: number, direction: 'left' | 'right') => {
    const items = Array.from(visibleActionKeys);
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    setVisibleActionKeys(items);
  };

  const toggleAction = (key: string) => {
    if (visibleActionKeys.includes(key)) {
      setVisibleActionKeys(visibleActionKeys.filter(k => k !== key));
    } else {
      setVisibleActionKeys([...visibleActionKeys, key]);
    }
  };

  const toggleReorderMode = () => {
    setIsReorderMode(!isReorderMode);
    if (!isReorderMode) {
      toast({
        title: "Reorder Mode Active",
        description: "Drag the grip icon or use arrows to reorder.",
      });
    } else {
      toast({
        title: "Changes Saved",
        description: "Your new order has been saved.",
      });
    }
  };

  const handleCardClick = (route: string) => {
    if (!isReorderMode) {
      setLocation(route);
    }
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
          
          <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
            <DialogTrigger asChild>
              <button 
                data-testid="button-customize-quick-actions"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Customize
              </button>
            </DialogTrigger>
            <DialogContent className="!max-w-[95vw] !w-[95vw] md:!max-w-2xl md:!w-auto !p-4 !rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-lg font-bold">Customize Quick Actions</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto -mx-4 px-4 py-2">
                <div className="space-y-2">
                  {ALL_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    const isSelected = visibleActionKeys.includes(action.key);
                    
                    return (
                      <div 
                        key={action.key}
                        data-testid={`checkbox-${action.key}`}
                        className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
                          isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => toggleAction(action.key)}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleAction(action.key)}
                          className="w-6 h-6 flex-shrink-0"
                        />
                        <div className={`w-12 h-12 ${action.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                          <Icon className="text-white w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-base text-gray-900">{action.label}</p>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCustomizeOpen(false)} className="px-6">
                  Close
                </Button>
                <Button onClick={() => {
                  setIsCustomizeOpen(false);
                  toast({
                    title: "Quick Actions Updated",
                    description: `${visibleActionKeys.length} actions selected.`,
                  });
                }} className="px-6">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {isReorderMode && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4 flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-blue-600" />
          <p className="text-blue-800 text-sm font-medium">Drag the grip icon or tap arrows to reorder</p>
        </div>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleActionKeys}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {visibleActions.map((action, index) => (
              <SortableCard
                key={action.key}
                action={action}
                index={index}
                totalCount={visibleActions.length}
                isReorderMode={isReorderMode}
                onCardClick={handleCardClick}
                onMove={moveItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
