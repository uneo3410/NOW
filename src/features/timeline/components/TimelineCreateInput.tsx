import { useEffect, useRef, useState, type FormEvent } from "react";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "../../../utils/date";
import type { CreateTimelineNodeInput } from "../types";

type TimelineCreateInputProps = {
  isOpen: boolean;
  onCreate: (input: CreateTimelineNodeInput) => Promise<unknown>;
};

export function TimelineCreateInput({ isOpen, onCreate }: TimelineCreateInputProps) {
  const [content, setContent] = useState("");
  const [happenedAt, setHappenedAt] = useState(toDateTimeLocalValue());
  const [isTimeDrawerOpen, setIsTimeDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsTimeDrawerOpen(false);
      }
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsTimeDrawerOpen(false);
    }
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreate({
        content,
        happenedAt: happenedAt ? fromDateTimeLocalValue(happenedAt) : undefined,
      });
      setContent("");
      setHappenedAt(toDateTimeLocalValue());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className={[
        "group relative w-full origin-left transition-all duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        isOpen
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-2 scale-[0.96] opacity-0",
      ].join(" ")}
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <div className="timeline-now-input-shell ml-16 flex w-full items-center justify-between rounded-full py-3 pl-8 pr-3 transition-all duration-500">
        <input
          aria-label="当下发生了什么"
          className="timeline-now-input-field min-w-0 flex-1 border-none bg-transparent text-lg font-normal leading-[1.6] outline-none placeholder:font-light focus:ring-0"
          id="timeline-content"
          maxLength={480}
          onChange={(event) => setContent(event.target.value)}
          placeholder="当下发生了什么？"
          value={content}
        />
        <button
          aria-expanded={isTimeDrawerOpen}
          aria-label="选择发生时间"
          className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-300 hover:bg-white/40 hover:text-[var(--timeline-now-input-button-text)]"
          onClick={(event) => {
            event.stopPropagation();
            setIsTimeDrawerOpen((value) => !value);
          }}
          title="选择发生时间"
          type="button"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          >
            schedule
          </span>
        </button>
        <button
          aria-label="钉入时间线"
          className="timeline-now-input-button flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white shadow-sm transition-all duration-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 group-hover:scale-[1.03]"
          disabled={isSubmitting || !content.trim()}
          type="submit"
        >
          {isSubmitting ? (
            "..."
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              send
            </span>
          )}
        </button>
      </div>
      <div
        className={[
          "absolute left-0 top-[calc(100%+12px)] z-50 w-64 rounded-xl border border-white/70 bg-white/[0.54] p-4 shadow-[0_18px_54px_rgba(0,64,112,0.11),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[34px] transition-all duration-300",
          isTimeDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        id="time-picker-dropdown"
      >
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#006875] opacity-80">
          Set Moment Time
        </div>
        <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-line">
          <span className="mb-1 block">Date & Time</span>
          <input
            className="min-h-10 w-full rounded-lg border border-white/70 bg-white/[0.55] px-3 text-sm font-normal tracking-normal text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            onChange={(event) => setHappenedAt(event.target.value)}
            type="datetime-local"
            value={happenedAt}
          />
        </label>
      </div>
    </form>
  );
}
