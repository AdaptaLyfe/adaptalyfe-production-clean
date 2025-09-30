import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QuickActionCard } from "./QuickActionCard";
import type { QuickAction } from "./constants";

interface SortableCardProps {
  id: string;
  action: QuickAction;
  isReorderMode: boolean;
}

export function SortableCard({ id, action, isReorderMode }: SortableCardProps) {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <QuickActionCard
        action={action}
        isReorderMode={isReorderMode}
        isDragging={isDragging}
      />
    </div>
  );
}
