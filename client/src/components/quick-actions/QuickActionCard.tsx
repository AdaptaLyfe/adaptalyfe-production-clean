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
        bg-white rounded-2xl border p-4 shadow-xl
        flex items-center gap-3 text-left
        ${isReorderMode 
          ? 'cursor-move border-violet-300' 
          : 'cursor-pointer border-slate-100'
        }
      `}
    >
      <div className={`w-12 h-12 shrink-0 ${action.bgColor} rounded-xl flex items-center justify-center shadow-sm`}>
        <Icon className="text-white w-6 h-6" />
      </div>
      <div className="min-w-0">
        <h4 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{action.label}</h4>
        <p className="text-xs text-slate-500 leading-tight truncate mt-1">{action.description}</p>
      </div>
    </div>
  );
}
