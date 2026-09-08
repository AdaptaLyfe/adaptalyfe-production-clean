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
      <DialogContent className="!max-w-[95vw] !w-[95vw] md:!max-w-2xl md:!w-auto !p-4 !rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-bold">Customize Quick Actions</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mx-4 px-4 py-2">
          <div className="space-y-2">
            {ALL_QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const isSelected = tempVisibleKeys.includes(action.key);
              
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
                    onClick={(e: any) => e.stopPropagation()}
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
          <Button variant="outline" onClick={handleClose} className="px-6">
            Close
          </Button>
          <Button onClick={handleSave} className="px-6">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
