import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocation } from "wouter";
import type { QuickAction } from "./constants";

interface SortableCardProps {
  id: string;
  action: QuickAction;
  isReorderMode: boolean;
}

export function SortableCard({ id, action, isReorderMode }: SortableCardProps) {
  const [, setLocation] = useLocation();
  const Icon = action.icon;
  
  const {
    attributes,
    listeners,
    setNodeRef,
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
    visibility: isDragging ? 'hidden' : 'visible',
    WebkitUserSelect: isReorderMode ? 'none' : 'auto',
    userSelect: isReorderMode ? 'none' : 'auto',
    WebkitTouchCallout: isReorderMode ? 'none' : 'default',
    touchAction: isReorderMode ? 'none' : 'auto',
  } as React.CSSProperties;

  const handleClick = () => {
    if (!isReorderMode) {
      setLocation(action.route);
    }
  };

  // Prevent text selection and context menu on mobile during reorder
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isReorderMode) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isReorderMode) {
      e.preventDefault();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isReorderMode) {
      e.preventDefault();
    }
  };

  // Merge listeners with our custom handlers
  const combinedListeners = isReorderMode ? {
    ...listeners,
    onTouchStart: (e: React.TouchEvent) => {
      handleTouchStart(e);
      listeners?.onTouchStart?.(e as any);
    },
    onPointerDown: (e: React.PointerEvent) => {
      handlePointerDown(e);
      listeners?.onPointerDown?.(e as any);
    },
    onContextMenu: handleContextMenu,
  } : listeners;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...combinedListeners}
      data-testid={`card-quick-action-${action.key}`}
      onClick={handleClick}
      className={`
        bg-white rounded-2xl shadow-lg p-6 
        flex flex-col items-center text-center
        ${isReorderMode 
          ? 'cursor-move border-2 border-blue-300' 
          : 'cursor-pointer hover:shadow-xl'
        }
      `}
    >
      <div className={`w-16 h-16 ${action.bgColor} rounded-xl flex items-center justify-center mb-3 shadow-md pointer-events-none`}>
        <Icon className="text-white w-8 h-8" />
      </div>
      <h4 className="font-semibold text-gray-900 text-sm mb-1 leading-tight line-clamp-1 pointer-events-none">
        {action.label}
      </h4>
      <p className="text-xs text-gray-600 leading-tight line-clamp-1 pointer-events-none">
        {action.description}
      </p>
    </div>
  );
}
