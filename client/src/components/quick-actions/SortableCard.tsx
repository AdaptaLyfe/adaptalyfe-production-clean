import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, GripVertical } from "lucide-react";
import type { QuickAction } from "./constants";

interface SortableCardProps {
  id: string;
  action: QuickAction;
  isReorderMode: boolean;
  index?: number;
  totalCount?: number;
  onMove?: (index: number, direction: 'left' | 'right') => void;
}

export function SortableCard({ id, action, isReorderMode, index = 0, totalCount = 1, onMove }: SortableCardProps) {
  const [, setLocation] = useLocation();
  const Icon = action.icon;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: !isReorderMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  } as React.CSSProperties;

  const handleClick = () => {
    if (!isReorderMode) {
      setLocation(action.route);
    }
  };

  const handleMoveLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMove && index > 0) {
      onMove(index, 'left');
    }
  };

  const handleMoveRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMove && index < totalCount - 1) {
      onMove(index, 'right');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`card-quick-action-${action.key}`}
      onClick={handleClick}
      className={`
        bg-white rounded-2xl border p-3.5 relative h-full
        flex items-center gap-3 text-left transition-all
        ${isReorderMode 
          ? 'border-violet-300 border-dashed pt-12' 
          : 'border-slate-100 cursor-pointer hover:border-slate-200 hover:shadow-md'
        }
        ${isDragging ? 'scale-105 shadow-2xl' : ''}
      `}
    >
      {isReorderMode && (
        <div className="absolute top-2 left-0 right-0 flex justify-between px-2">
          <button 
            onClick={handleMoveLeft}
            disabled={index === 0}
            className={`p-1.5 rounded-full transition-colors ${
              index === 0 
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                : 'bg-violet-100 text-violet-600 hover:bg-violet-200 active:bg-violet-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div 
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="p-2 bg-violet-600 rounded-full cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="w-5 h-5 text-white" />
          </div>
          <button 
            onClick={handleMoveRight}
            disabled={index === totalCount - 1}
            className={`p-1.5 rounded-full transition-colors ${
              index === totalCount - 1 
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                : 'bg-violet-100 text-violet-600 hover:bg-violet-200 active:bg-violet-300'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className={`w-12 h-12 shrink-0 ${action.bgColor} rounded-xl flex items-center justify-center shadow-sm pointer-events-none`}>
        <Icon className="text-white w-6 h-6" />
      </div>
      <div className="min-w-0 pointer-events-none">
        <h4 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
          {action.label}
        </h4>
        <p className="text-xs text-slate-500 leading-tight truncate mt-1">
          {action.description}
        </p>
      </div>
    </div>
  );
}
