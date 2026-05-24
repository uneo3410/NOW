import { Button } from "../../../components/ui/Button";
import { CardEditor } from "../../cards/components/CardEditor";
import type { CreateCardInput } from "../../cards/types";

type CanvasToolbarProps = {
  canDelete: boolean;
  error: string | null;
  onClearSelection: () => void;
  onCreateCard: (input: CreateCardInput) => Promise<unknown>;
  onDeleteSelected: () => Promise<void>;
  onFitView: () => void;
  selectedKind: "card" | "edge" | null;
};

export function CanvasToolbar({
  canDelete,
  error,
  onClearSelection,
  onCreateCard,
  onDeleteSelected,
  onFitView,
  selectedKind,
}: CanvasToolbarProps) {
  return (
    <aside className="w-full rounded-[2rem] border border-line bg-surface/80 p-4 shadow-soft backdrop-blur lg:w-80">
      <div className="mb-5">
        <p className="text-sm font-medium text-moss">Canvas</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">思维画布</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          创建卡片、拖动位置，把指针移到卡片边缘后从连接点拉线。
        </p>
      </div>
      <CardEditor onCreate={onCreateCard} />
      {error ? (
        <p className="mt-4 rounded-2xl border border-ember/25 bg-ember/10 px-4 py-3 text-sm leading-6 text-ember">
          {error}
        </p>
      ) : null}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button onClick={onFitView} variant="secondary">
          归位
        </Button>
        <Button onClick={onClearSelection} variant="ghost">
          取消选择
        </Button>
      </div>
      <Button
        className="mt-2 w-full"
        disabled={!canDelete}
        onClick={onDeleteSelected}
        variant="danger"
      >
        {selectedKind === "edge" ? "删除所选连线" : selectedKind === "card" ? "删除所选卡片" : "删除所选"}
      </Button>
    </aside>
  );
}
