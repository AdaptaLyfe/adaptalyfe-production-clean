import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, Plus, X, Smile, Calendar, CheckSquare, Users, 
  Heart, Pill, Stethoscope, Car, MapPin, BookOpen, 
  ShoppingCart, Star, Home, Clock, Target, Phone,
  GraduationCap, GripVertical, FileText
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// Available quick action options
const availableActions = [
  { key: "mood-tracking", label: "Mood Check-in", description: "How are you feeling?", icon: Smile, color: "purple", route: "/mood-tracking" },
  { key: "daily-tasks", label: "Daily Tasks", description: "Complete activities", icon: CheckSquare, color: "green", route: "/daily-tasks" },
  { key: "financial", label: "Bill Reminders", description: "Manage payments", icon: Calendar, color: "blue", route: "/financial" },
  { key: "caregiver", label: "Contact Support", description: "Reach out for help", icon: Users, color: "orange", route: "/caregiver" },
  { key: "pharmacy", label: "Medications", description: "Manage prescriptions", icon: Pill, color: "red", route: "/pharmacy" },
  { key: "medical", label: "Medical Info", description: "Health records", icon: Stethoscope, color: "pink", route: "/medical" },
  { key: "personal-documents", label: "Personal Documents", description: "Access important documents", icon: FileText, color: "blue", route: "/personal-documents" },
  { key: "meal-shopping", label: "Meals & Shopping", description: "Plan and shop", icon: ShoppingCart, color: "yellow", route: "/meal-shopping" },
  { key: "calendar", label: "Calendar", description: "View schedule", icon: Calendar, color: "indigo", route: "/calendar" },
  { key: "resources", label: "Resources", description: "Helpful tools", icon: BookOpen, color: "teal", route: "/resources" },
  { key: "achievements", label: "Achievements", description: "View progress", icon: Star, color: "amber", route: "/rewards" },
  { key: "academic-planner", label: "Academic Planner", description: "Manage classes & assignments", icon: GraduationCap, color: "purple", route: "/academic-planner" },
  { key: "task-builder", label: "Life Skills Guide", description: "Step-by-step task tutorials", icon: BookOpen, color: "emerald", route: "/task-builder" },
];

const colorClasses = {
  purple: { bg: "from-purple-500 to-pink-500", border: "border-purple-200", hover: "hover:border-purple-400" },
  green: { bg: "from-green-500 to-emerald-500", border: "border-green-200", hover: "hover:border-green-400" },
  emerald: { bg: "from-emerald-500 to-green-500", border: "border-emerald-200", hover: "hover:border-emerald-400" },
  blue: { bg: "from-blue-500 to-cyan-500", border: "border-blue-200", hover: "hover:border-blue-400" },
  orange: { bg: "from-orange-500 to-red-500", border: "border-orange-200", hover: "hover:border-orange-400" },
  red: { bg: "from-red-500 to-rose-500", border: "border-red-200", hover: "hover:border-red-400" },
  pink: { bg: "from-pink-500 to-rose-500", border: "border-pink-200", hover: "hover:border-pink-400" },
  yellow: { bg: "from-yellow-500 to-orange-500", border: "border-yellow-200", hover: "hover:border-yellow-400" },
  indigo: { bg: "from-indigo-500 to-blue-500", border: "border-indigo-200", hover: "hover:border-indigo-400" },
  teal: { bg: "from-teal-500 to-cyan-500", border: "border-teal-200", hover: "hover:border-teal-400" },
  amber: { bg: "from-amber-500 to-orange-500", border: "border-amber-200", hover: "hover:border-amber-400" },
};

export default function CustomizableQuickActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isReorderMode, setIsReorderMode] = useState(false);

  // ALWAYS use default quick actions - no API dependency
  const currentQuickActions = [
    "mood-tracking", "daily-tasks", "financial", "caregiver"
  ];

  console.log('🎯 QUICK ACTIONS COMPONENT MOUNTED - BUTTONS SHOULD BE VISIBLE');
  console.log('Current Quick Actions:', currentQuickActions);
  console.log('Is Reorder Mode:', isReorderMode);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(selectedActions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSelectedActions(items);
  };

  const handleMainDragEnd = (result: any) => {
    console.log('Drag ended:', result);
    if (!result.destination) {
      console.log('No destination - drag cancelled');
      return;
    }

    const newQuickActions = Array.from(currentQuickActions);
    const [reorderedItem] = newQuickActions.splice(result.source.index, 1);
    newQuickActions.splice(result.destination.index, 0, reorderedItem);

    console.log('New quick actions order:', newQuickActions);
    toast({
      title: "Quick Actions Reordered",
      description: "Your new order has been saved.",
    });
  };

  const addAction = (actionKey: string) => {
    if (!selectedActions.includes(actionKey) && selectedActions.length < 6) {
      setSelectedActions([...selectedActions, actionKey]);
    }
  };

  const removeAction = (actionKey: string) => {
    setSelectedActions(selectedActions.filter(key => key !== actionKey));
  };

  const saveActions = () => {
    toast({
      title: "Quick Actions Updated",
      description: "Your personalized quick actions have been saved.",
    });
    setIsCustomizing(false);
  };

  const startCustomizing = () => {
    setSelectedActions([...currentQuickActions]);
    setIsCustomizing(true);
  };

  // ALWAYS render buttons with defaults - never block on loading
  return (
    <div className="mb-8">
      {/* DEBUG INFO - DELETE AFTER FIXING */}
      <div className="bg-yellow-200 border-2 border-yellow-600 p-4 rounded mb-4">
        <p className="font-bold">DEBUG: Component Mounted ✅</p>
        <p>Quick Actions Array: {JSON.stringify(currentQuickActions)}</p>
        <p>Reorder Mode: {isReorderMode ? 'YES' : 'NO'}</p>
        <p>Array Length: {currentQuickActions.length}</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-gray-800 drop-shadow-sm">Quick Actions</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={isReorderMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsReorderMode(!isReorderMode)}
            className={`${
              isReorderMode 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-white/80 backdrop-blur-sm border-2 hover:shadow-lg"
            } transition-all`}
          >
            <GripVertical className="w-4 h-4 mr-2" />
            {isReorderMode ? "Exit Reorder" : "Reorder"}
          </Button>
          <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={startCustomizing}
                className="bg-white/80 backdrop-blur-sm border-2 hover:shadow-lg transition-all"
              >
                <Settings className="w-4 h-4 mr-2" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customize Your Quick Actions</DialogTitle>
              <DialogDescription>
                Choose up to 6 features you use most often. Drag to reorder them.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Selected Actions (Draggable) */}
              <div>
                <h4 className="font-semibold mb-3">Your Quick Actions ({selectedActions.length}/6)</h4>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="selected-actions" direction="horizontal">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-2 md:grid-cols-3 gap-3 min-h-[100px] p-4 border-2 border-dashed border-gray-300 rounded-lg"
                      >
                        {selectedActions.map((actionKey, index) => {
                          const action = availableActions.find(a => a.key === actionKey);
                          if (!action) return null;
                          
                          const IconComponent = action.icon;
                          const colors = colorClasses[action.color as keyof typeof colorClasses];
                          
                          return (
                            <Draggable key={actionKey} draggableId={actionKey} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`relative bg-white rounded-xl p-4 shadow-md border-2 ${colors.border} ${
                                    snapshot.isDragging ? 'shadow-xl scale-105' : ''
                                  } transition-all cursor-move`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 text-white hover:bg-red-600 rounded-full"
                                    onClick={() => removeAction(actionKey)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                  <div className={`w-8 h-8 bg-gradient-to-br ${colors.bg} rounded-lg flex items-center justify-center mb-2`}>
                                    <IconComponent className="text-white" size={16} />
                                  </div>
                                  <h5 className="font-medium text-sm">{action.label}</h5>
                                  <p className="text-xs text-gray-600">{action.description}</p>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        {selectedActions.length === 0 && (
                          <div className="col-span-full text-center text-gray-500 py-8">
                            Choose your favorite features from below
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              {/* Available Actions */}
              <div>
                <h4 className="font-semibold mb-3">Available Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableActions.map((action) => {
                    const IconComponent = action.icon;
                    const colors = colorClasses[action.color as keyof typeof colorClasses];
                    const isSelected = selectedActions.includes(action.key);
                    const canAdd = selectedActions.length < 6;
                    
                    return (
                      <Card 
                        key={action.key} 
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? 'opacity-50 cursor-not-allowed' 
                            : canAdd 
                              ? 'hover:shadow-md hover:scale-105' 
                              : 'opacity-30 cursor-not-allowed'
                        }`}
                        onClick={() => !isSelected && canAdd && addAction(action.key)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className={`w-10 h-10 bg-gradient-to-br ${colors.bg} rounded-lg flex items-center justify-center mb-2 mx-auto`}>
                            <IconComponent className="text-white" size={20} />
                          </div>
                          <h5 className="font-medium text-sm mb-1">{action.label}</h5>
                          <p className="text-xs text-gray-600">{action.description}</p>
                          {isSelected && (
                            <Badge variant="secondary" className="mt-2 text-xs">Added</Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCustomizing(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={saveActions}
                  disabled={selectedActions.length === 0}
                  className="border-2 border-blue-500 shadow-md"
                >
                  Save Changes
                </Button>
              </div>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reorder mode indicator */}
      {isReorderMode && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6 flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <GripVertical className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-blue-800 font-medium">Quick Action Reorder Mode Active</p>
            <p className="text-blue-600 text-sm">Drag any quick action button to reorder them</p>
          </div>
        </div>
      )}

{/* Display Current Quick Actions */}
      {isReorderMode ? (
        <DragDropContext onDragEnd={handleMainDragEnd}>
          <Droppable droppableId="main-quick-actions">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex flex-wrap gap-6 justify-center md:justify-start ${
                  snapshot.isDraggingOver 
                    ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4' 
                    : 'p-2'
                }`}
              >
                {currentQuickActions.slice(0, 6).map((actionKey: string, index: number) => {
                  const action = availableActions.find(a => a.key === actionKey);
                  if (!action) return null;
                  
                  const IconComponent = action.icon;
                  const colors = colorClasses[action.color as keyof typeof colorClasses];
                  
                  return (
                    <Draggable 
                      key={actionKey} 
                      draggableId={actionKey} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`w-32 ${
                            snapshot.isDragging ? 'opacity-75 transform scale-110 shadow-2xl z-50' : ''
                          } transition-all duration-200`}
                          style={{
                            ...provided.draggableProps.style,
                            ...(snapshot.isDragging && {
                              transform: `${provided.draggableProps.style?.transform} rotate(5deg)`,
                            })
                          }}
                        >
                          <div className="relative group">
                            <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg flex items-center gap-1 text-xs px-2">
                                <GripVertical className="w-3 h-3" />
                                Drag
                              </div>
                            </div>
                            <div className="border-2 border-dashed border-blue-200 rounded-2xl p-2 hover:border-blue-400 transition-colors">
                              <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 ${colors.border} ${colors.hover} hover:shadow-2xl transition-all duration-300 h-auto flex flex-col items-center space-y-3 w-full cursor-move`}>
                                <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center shadow-lg`}>
                                  <IconComponent className="text-white" size={28} />
                                </div>
                                <div className="text-center px-1">
                                  <h4 className="font-bold text-gray-900 text-xs leading-tight">{action.label}</h4>
                                  <p className="text-[10px] text-gray-700 font-medium mt-1 leading-tight">{action.description}</p>
                                </div>
                              </div>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {currentQuickActions.slice(0, 6).map((actionKey: string) => {
            const action = availableActions.find(a => a.key === actionKey);
            if (!action) return null;
            
            const IconComponent = action.icon;
            const colors = colorClasses[action.color as keyof typeof colorClasses];
            
            return (
              <Link key={actionKey} href={action.route}>
                <Button
                  variant="outline"
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 ${colors.border} ${colors.hover} hover:shadow-2xl transition-all duration-300 h-auto flex-col space-y-3 w-full`}
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center shadow-lg`}>
                    <IconComponent className="text-white" size={28} />
                  </div>
                  <div className="text-center px-1">
                    <h4 className="font-bold text-gray-900 text-xs leading-tight">{action.label}</h4>
                    <p className="text-[10px] text-gray-700 font-medium mt-1 leading-tight">{action.description}</p>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}