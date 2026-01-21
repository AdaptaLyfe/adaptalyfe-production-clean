import { useState, useEffect } from "react";
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
  const [tempVisibleKeys, setTempVisibleKeys] = useState<string[]>(visibleKeys);

  useEffect(() => {
    if (isOpen) {
      setTempVisibleKeys(visibleKeys);
    }
  }, [isOpen, visibleKeys]);

  const toggleAction = (key: string) => {
    if (tempVisibleKeys.includes(key)) {
      setTempVisibleKeys(tempVisibleKeys.filter(k => k !== key));
    } else {
      setTempVisibleKeys([...tempVisibleKeys, key]);
    }
  };

  const handleClose = () => {
    setTempVisibleKeys(visibleKeys);
    onOpenChange(false);
  };

  const handleSave = () => {
    onVisibilityChange(tempVisibleKeys);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      } else {
        onOpenChange(true);
      }
    }}>
      <DialogTrigger asChild>
        <button 
          data-testid="button-customize-quick-actions"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Customize
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] mx-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Customize Quick Actions</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {ALL_QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const isSelected = tempVisibleKeys.includes(action.key);
            
            return (
              <div 
                key={action.key}
                data-testid={`checkbox-${action.key}`}
                className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleAction(action.key)}
              >
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={() => toggleAction(action.key)}
                  onClick={(e: any) => e.stopPropagation()}
                  className="w-5 h-5"
                />
                <div className={`w-10 h-10 ${action.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="text-white w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{action.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
