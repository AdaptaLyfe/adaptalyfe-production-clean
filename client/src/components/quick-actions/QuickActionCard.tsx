import { useLocation } from "wouter";
import type { QuickAction } from "./constants";

interface QuickActionCardProps {
  action: QuickAction;
  isReorderMode: boolean;
  isDragging?: boolean;
}

export function QuickActionCard({ action, isReorderMode, isDragging = false }: QuickActionCardProps) {
  const [, setLocation] = useLocation();
  const Icon = action.icon;

  const handleClick = () => {
    if (!isReorderMode) {
      setLocation(action.route);
    }
  };

  return (
    <div
      data-testid={`card-quick-action-${action.key}`}
      onClick={handleClick}
      className={`
        bg-white rounded-2xl shadow-lg p-6 
        flex flex-col items-center text-center
        transition-shadow duration-200
        ${isReorderMode 
          ? 'cursor-move border-2 border-blue-300' 
          : 'cursor-pointer hover:shadow-xl'
        }
      `}
    >
      <div className={`w-16 h-16 ${action.bgColor} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
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
