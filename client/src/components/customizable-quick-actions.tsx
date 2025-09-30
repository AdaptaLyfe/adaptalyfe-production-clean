import { useState } from "react";
import { Link } from "wouter";
import { 
  Smile, 
  CheckSquare, 
  Calendar, 
  Stethoscope, 
  DollarSign, 
  MessageSquare,
  Users,
  ShoppingCart,
  GripVertical,
  Settings,
  Pill,
  BookOpen,
  Star,
  GraduationCap
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const ALL_ACTIONS = [
  {
    key: "mood-tracking",
    label: "Mood & Tracking",
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
    label: "Medical Info & Appointments",
    description: "Manage health info",
    icon: Stethoscope,
    route: "/medical",
    bgColor: "bg-purple-500"
  },
  {
    key: "financial",
    label: "Financial Management",
    description: "Track finances",
    icon: DollarSign,
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
    label: "Meal Shopping",
    description: "Plan meals",
    icon: ShoppingCart,
    route: "/meal-shopping",
    bgColor: "bg-green-500"
  },
  {
    key: "pharmacy",
    label: "Pharmacy",
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

export default function CustomizableQuickActions() {
  const { toast } = useToast();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  
  // Default visible actions
  const [visibleActionKeys, setVisibleActionKeys] = useState([
    "mood-tracking", "mood-checkin", "daily-tasks", "medical", 
    "financial", "ai-chat", "caregiver", "meal-shopping"
  ]);

  const visibleActions = visibleActionKeys
    .map(key => ALL_ACTIONS.find(a => a.key === key))
    .filter(Boolean) as typeof ALL_ACTIONS;

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(visibleActionKeys);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setVisibleActionKeys(items);
    toast({
      title: "Quick Actions Reordered",
      description: "Your new order has been saved.",
    });
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
        description: "Drag and drop cards to reorder them.",
      });
    } else {
      toast({
        title: "Reorder Mode Disabled",
        description: "Your changes have been saved.",
      });
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
        <div className="flex gap-3">
          <button 
            onClick={toggleReorderMode}
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
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                <Settings className="w-4 h-4" />
                Customize
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Customize Quick Actions</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {ALL_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const isSelected = visibleActionKeys.includes(action.key);
                  
                  return (
                    <div 
                      key={action.key}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleAction(action.key)}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleAction(action.key)}
                      />
                      <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="text-white w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{action.label}</p>
                        <p className="text-xs text-gray-600 truncate">{action.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsCustomizeOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsCustomizeOpen(false);
                  toast({
                    title: "Quick Actions Updated",
                    description: `${visibleActionKeys.length} actions selected.`,
                  });
                }}>
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
          <p className="text-blue-800 text-sm font-medium">Drag and drop cards to reorder them</p>
        </div>
      )}
      
      <div className="relative">
        {isReorderMode ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="quick-actions" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {visibleActions.map((action, index) => {
                    const Icon = action.icon;
                    
                    return (
                      <Draggable key={action.key} draggableId={action.key} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex-shrink-0 w-[140px] transition-all ${
                              snapshot.isDragging ? 'opacity-75 scale-105 shadow-2xl' : ''
                            }`}
                          >
                            <div className="bg-white rounded-xl shadow-md border-2 border-blue-300 cursor-move">
                              <div className="p-4 flex flex-col items-center text-center">
                                <div className={`w-14 h-14 ${action.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                                  <Icon className="text-white w-7 h-7" />
                                </div>
                                <h4 className="font-semibold text-gray-900 text-xs mb-1 leading-tight">
                                  {action.label}
                                </h4>
                                <p className="text-[10px] text-gray-600 leading-tight">
                                  {action.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {visibleActions.map((action) => {
              const Icon = action.icon;
              
              return (
                <Link key={action.key} href={action.route}>
                  <div className="flex-shrink-0 w-[140px] bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="p-4 flex flex-col items-center text-center">
                      <div className={`w-14 h-14 ${action.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                        <Icon className="text-white w-7 h-7" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-xs mb-1 leading-tight">
                        {action.label}
                      </h4>
                      <p className="text-[10px] text-gray-600 leading-tight">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
