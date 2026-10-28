import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { optimisticallyUpdateDailyTaskCompletion } from "@/lib/daily-task-completion";
import type { DailyTask } from "@shared/schema";

export function getLocalCalendarDate(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

type Vars = { taskId: number; isCompleted: boolean; date: string };

/**
 * Same behaviour as the original Task Management module:
 * optimistic tick, rollback on failure, and "Task updated" / "Error" toasts.
 */
export function useToggleDailyTask() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ taskId, isCompleted, date }: Vars) =>
      apiRequest("PATCH", `/api/daily-tasks/${taskId}/complete`, { isCompleted, date }),
    onMutate: async ({ taskId, isCompleted, date }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/daily-tasks"] });
      const previousTasks = queryClient.getQueryData<DailyTask[]>(["/api/daily-tasks"]);
      queryClient.setQueryData<DailyTask[]>(["/api/daily-tasks"], (current) =>
        (Array.isArray(current) ? current : []).map((task) =>
          task.id === taskId
            ? optimisticallyUpdateDailyTaskCompletion(
                task as DailyTask & { completionDates?: string[] },
                date,
                isCompleted,
              )
            : task,
        ),
      );
      return { previousTasks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Task updated", description: "Task completion status has been updated." });
    },
    onError: (_error, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["/api/daily-tasks"], context.previousTasks);
      }
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggle = (task: DailyTask) =>
    mutation.mutate({ taskId: task.id, isCompleted: !task.isCompleted, date: getLocalCalendarDate() });

  return { toggle, isPending: mutation.isPending };
}
