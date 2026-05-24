import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";
import type { CardType, CreateCardInput } from "../types";
import { CardTypeToggle } from "./CardTypeToggle";

type CardEditorProps = {
  onCreate: (input: CreateCardInput) => Promise<unknown>;
};

export function CardEditor({ onCreate }: CardEditorProps) {
  const [type, setType] = useState<CardType>("thought");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreate({ content, type });
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <CardTypeToggle onChange={setType} value={type} />
      <Textarea
        className="min-h-24 rounded-3xl text-sm leading-6"
        maxLength={220}
        onChange={(event) => setContent(event.target.value)}
        placeholder={type === "todo" ? "写下一件想完成的事。" : "写下一个想法、灵感或备注。"}
        value={content}
      />
      <Button className="w-full" disabled={isSubmitting || !content.trim()} type="submit">
        创建卡片
      </Button>
    </form>
  );
}
