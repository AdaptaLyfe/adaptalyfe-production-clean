import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw,
  X,
  GripVertical,
  Eye,
  EyeOff
} from "lucide-react";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";

interface DashboardCustomizerProps {
  onClose: () => void;
}

export default function DashboardCustomizer({ onClose }: DashboardCustomizerProps) {
  const {
    allModules,
    enabledModules,
    disabledModules,
    toggleModule,
    resetToDefault,
    moveModuleUp,
    moveModuleDown,
    addEnhancedFeatures
  } = useDashboardLayout();

  const hasEnhancedFeatures = allModules.some(m => m.name.includes('Premium'));
  const enhancedFeatures = allModules.filter(m => m.name.includes('Premium'));
  const regularModules = disabledModules.filter(m => !m.name.includes('Premium'));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <CardTitle>Customize Your Dashboard</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={resetToDefault}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="text-sm text-gray-600">
            Customize which skill modules appear on your dashboard and change their order. 
            Use the arrow buttons to move modules up or down, or toggle them on/off.
          </div>

          {/* Enabled Modules */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Active Modules
              <Badge variant="secondary">{enabledModules.length}</Badge>
            </h3>
            
            <div className="space-y-2">
              {enabledModules
                .sort((a, b) => a.order - b.order)
                .map((module, index) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{module.name}</p>
                      <p className="text-xs text-gray-500">Position: {index + 1}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => moveModuleUp(module.id)}
                        disabled={index === 0}
                        variant="ghost"
                        size="sm"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => moveModuleDown(module.id)}
                        disabled={index === enabledModules.length - 1}
                        variant="ghost"
                        size="sm"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Switch
                      checked={module.enabled}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Features Section */}
          {!hasEnhancedFeatures && (
            <div className="border-2 border-dashed border-amber-200 rounded-lg p-4 bg-amber-50">
              <div className="text-center">
                <h3 className="font-semibold text-amber-900 mb-2">🌟 Premium Enhanced Features</h3>
                <p className="text-sm text-amber-800 mb-3">
                  Unlock advanced tools for independence and personal growth
                </p>
                <Button
                  onClick={addEnhancedFeatures}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  Show Premium Features
                </Button>
              </div>
            </div>
          )}

          {/* Enhanced Premium Features */}
          {enhancedFeatures.length > 0 && (
            <div>
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                🌟 Premium Enhanced Features
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                  {enhancedFeatures.length}
                </Badge>
              </h3>
              
              <div className="space-y-2">
                {enhancedFeatures.map((module) => (
                  <div
                    key={module.id}
                    className={`flex items-center justify-between p-3 border-2 rounded-lg ${
                      module.enabled 
                        ? 'border-purple-300 bg-gradient-to-r from-purple-100 to-blue-100' 
                        : 'border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="font-medium text-purple-900">{module.name}</p>
                        <p className="text-xs text-purple-600">
                          {module.enabled ? 'Premium feature - active on dashboard' : 'Premium feature - toggle to activate'}
                        </p>
                      </div>
                    </div>
                    
                    <Switch
                      checked={module.enabled}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Hidden Modules */}
          {regularModules.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <EyeOff className="w-4 h-4" />
                Hidden Basic Modules
                <Badge variant="outline">{regularModules.length}</Badge>
              </h3>
              
              <div className="space-y-2">
                {regularModules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <div>
                        <p className="font-medium text-gray-600">{module.name}</p>
                        <p className="text-xs text-gray-400">Currently hidden</p>
                      </div>
                    </div>
                    
                    <Switch
                      checked={module.enabled}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Tips for Customization</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Put your most important skills at the top</li>
              <li>• Hide modules you don't use regularly</li>
              <li>• You can always turn modules back on later</li>
              <li>• Changes are saved automatically</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}