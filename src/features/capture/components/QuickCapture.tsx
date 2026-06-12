import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";
import { CardTypeToggle } from "../../cards/components/CardTypeToggle";
import type { CardType } from "../../cards/types";
import { useQuickCapture } from "../hooks/useQuickCapture";

type QuickCaptureProps = {
  onCreated?: () => void;
};

export function QuickCapture({ onCreated }: QuickCaptureProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<CardType>("todo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCapture, date, error, feedback, isLoading } = useQuickCapture();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const card = await createCapture({ content, type });

      if (card) {
        setContent("");
        onCreated?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-line bg-white/70 p-4 shadow-soft backdrop-blur">
      <div className="mb-4">
        <p className="text-sm font-medium text-moss">{date}</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">今天先抓住它。</h2>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <CardTypeToggle onChange={setType} value={type} />
        <Textarea
          className="min-h-28 rounded-3xl text-sm leading-6"
          maxLength={220}
          onChange={(event) => setContent(event.target.value)}
          placeholder={getPlaceholder(type)}
          value={content}
        />
        <Button
          className="w-full"
          disabled={isLoading || isSubmitting || !content.trim()}
          type="submit"
        >
          {isSubmitting ? "保存中" : "捕捉"}
        </Button>
      </form>

      {feedback ? <p className="mt-3 text-sm font-medium text-moss">{feedback}</p> : null}
      {error ? (
        <p className="mt-3 rounded-2xl border border-ember/25 bg-ember/10 px-4 py-3 text-sm leading-6 text-ember">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function getPlaceholder(type: CardType): string {
  if (type === "todo") {
    return "一件今天想完成的事。";
  }

  if (type === "sticky") {
    return "一张想贴在画布上的便签。";
  }

  return "一个刚冒出来的想法。";
}
