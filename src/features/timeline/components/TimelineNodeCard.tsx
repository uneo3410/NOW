import { useState } from "react";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "../../../utils/date";
import type { TimelineNode } from "../types";

type TimelineNodeCardProps = {
  node: TimelineNode;
  onDelete: (node: TimelineNode) => Promise<void>;
  onUpdate: (node: TimelineNode, patch: Partial<TimelineNode>) => Promise<unknown>;
};

export function TimelineNodeCard({ node, onDelete, onUpdate }: TimelineNodeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(node.content);
  const [happenedAt, setHappenedAt] = useState(toDateTimeLocalValue(node.happenedAt));
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!content.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedNode = await onUpdate(node, {
        content,
        happenedAt: fromDateTimeLocalValue(happenedAt),
      });

      if (updatedNode) {
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setContent(node.content);
    setHappenedAt(toDateTimeLocalValue(node.happenedAt));
    setIsEditing(false);
  }

  async function handleDelete() {
    const shouldDelete = window.confirm("删除这个时间节点？这个操作不会影响其他记录。");

    if (shouldDelete) {
      await onDelete(node);
    }
  }

  return (
    <article className="group relative cursor-default rounded-xl border border-white/70 bg-white/[0.48] p-6 shadow-[0_18px_54px_rgba(0,64,112,0.10),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_0_0_1px_rgba(255,255,255,0.42)] backdrop-blur-[34px] transition-all duration-700 hover:-translate-y-1 hover:bg-white/[0.56] hover:shadow-[0_22px_60px_rgba(0,64,112,0.13),inset_0_1px_0_rgba(255,255,255,0.78),inset_0_0_0_1px_rgba(255,255,255,0.46)]">
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#005f6d] opacity-90">
        <time dateTime={node.happenedAt}>{formatTimelineStamp(node.happenedAt)}</time>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-4">
          <Textarea
            maxLength={480}
            onChange={(event) => setContent(event.target.value)}
            value={content}
          />
          <Input
            className="border-white/70 bg-white/65 focus:border-primary focus:ring-primary/10"
            onChange={(event) => setHappenedAt(event.target.value)}
            type="datetime-local"
            value={happenedAt}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              className="min-h-10 rounded-full px-4 text-sm font-medium text-muted transition hover:bg-white/60 hover:text-ink"
              onClick={handleCancel}
              type="button"
            >
              取消
            </button>
            <button
              className="min-h-10 rounded-full bg-primary px-5 text-sm font-medium text-white shadow-soft transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving || !content.trim()}
              onClick={handleSave}
              type="button"
            >
              保存修改
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-[#303747]">
            {node.content}
          </p>
          <div className="absolute right-3 top-3 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button
              aria-label="编辑节点"
              className="grid size-8 place-items-center rounded-full bg-white/70 text-xs font-semibold text-primary shadow-sm transition hover:bg-white"
              onClick={() => setIsEditing(true)}
              type="button"
            >
              E
            </button>
            <button
              aria-label="删除节点"
              className="grid size-8 place-items-center rounded-full bg-white/70 text-xs font-semibold text-ember shadow-sm transition hover:bg-white"
              onClick={handleDelete}
              type="button"
            >
              X
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function formatTimelineStamp(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}
