/**
 * DailyGuideCard — Adaptalyfe Guide daily briefing card
 *
 * Renders the structured DailyGuideResponse returned by POST /api/ai/daily-guide.
 * READ-ONLY display only — no actions, no editing, no chat.
 *
 * States:
 *  - Loading  → lightweight skeleton (dashboard remains fully usable)
 *  - Error    → friendly unavailable message (no technical details shown)
 *  - Success  → greeting, summary, highlights, nextAction
 */

import { Sparkles, CheckCircle2, Calendar, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDailyGuide, type DailyGuideHighlight } from "@/hooks/useDailyGuide";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function highlightIcon(type: DailyGuideHighlight["type"]) {
  switch (type) {
    case "task":        return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />;
    case "appointment": return <Calendar     className="w-4 h-4 text-blue-500  shrink-0 mt-0.5" aria-hidden="true" />;
    case "calendar":    return <Clock        className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" aria-hidden="true" />;
  }
}

function priorityBadge(priority: DailyGuideHighlight["priority"]) {
  if (!priority || priority === "normal") return null;
  const styles =
    priority === "high"
      ? "bg-red-100 text-red-700 border-red-200"
      : "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <Badge variant="outline" className={`text-xs px-1.5 py-0 ml-2 ${styles}`}>
      {priority}
    </Badge>
  );
}

// ─── Skeleton (loading) ────────────────────────────────────────────────────────

function DailyGuideSkeleton() {
  return (
    <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" aria-hidden="true" />
          <CardTitle className="text-base font-semibold text-indigo-700">Adaptalyfe Guide</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3" aria-busy="true" aria-label="Loading your Daily Guide">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-indigo-100 rounded w-2/5" />
          <div className="h-3 bg-gray-100 rounded w-4/5" />
          <div className="h-3 bg-gray-100 rounded w-3/5" />
          <div className="border-t border-indigo-50 pt-3 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Error / unavailable ───────────────────────────────────────────────────────

function DailyGuideUnavailable() {
  return (
    <Card className="border border-gray-200 bg-gray-50">
      <CardContent className="flex items-start gap-3 py-5">
        <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-gray-500">
          Your Guide isn't available right now. You can still use Adaptalyfe normally.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function DailyGuideCard() {
  const { data, isLoading, isError } = useDailyGuide();

  if (isLoading) return <DailyGuideSkeleton />;
  if (isError || !data)  return <DailyGuideUnavailable />;

  const { greeting, summary, highlights, nextAction } = data;

  return (
    <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" aria-hidden="true" />
          <CardTitle className="text-base font-semibold text-indigo-700">
            Adaptalyfe Guide
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Greeting + summary */}
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-snug">{greeting}</p>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{summary}</p>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div
            className="space-y-2 border-t border-indigo-50 pt-3"
            aria-label="Today's highlights"
          >
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">
              Today's highlights
            </p>
            <ul className="space-y-2" role="list">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  {highlightIcon(h.type)}
                  <span className="text-sm text-gray-700 leading-snug flex-1">
                    {h.title}
                    {h.time && (
                      <span className="text-gray-400 ml-1 text-xs">· {h.time}</span>
                    )}
                  </span>
                  {priorityBadge(h.priority)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next action */}
        {nextAction && (
          <div
            className="flex items-start gap-2 bg-indigo-50 rounded-lg px-3 py-2.5 border border-indigo-100"
            aria-label="Suggested next action"
          >
            <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-indigo-800 leading-snug">
                {nextAction.title}
              </p>
              {nextAction.reason && (
                <p className="text-xs text-indigo-600 mt-0.5 leading-snug">
                  {nextAction.reason}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
