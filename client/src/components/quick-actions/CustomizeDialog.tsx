import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";
import { ALL_QUICK_ACTIONS } from "./constants";

interface CustomizeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  visibleKeys: string[];
  onVisibilityChange: (keys: string[]) => void;
}

export function CustomizeDialog({ 
  isOpen, 
  onOpenChange, 
  visibleKeys, 
  onVisibilityChange 
}: CustomizeDialogProps) {
  const toggleAction = (key: string) => {
    if (visibleKeys.includes(key)) {
      onVisibilityChange(visibleKeys.filter(k => k !== key));
    } else {
      onVisibilityChange([...visibleKeys, key]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button 
          data-testid="button-customize-quick-actions"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Customize
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize Quick Actions</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {ALL_QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isSelected = visibleKeys.includes(action.key);
            
            return (
              <div 
                key={action.key}
                data-testid={`checkbox-${action.key}`}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleAction(action.key)}
              >
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={() => toggleAction(action.key)}
                  onClick={(e: any) => e.stopPropagation()}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
