import { useCurrentDay } from "../features/day/hooks/useCurrentDay";
import { useDayWorkspace } from "../features/day/hooks/useDayWorkspace";
import { CanvasView } from "../features/canvas/components/CanvasView";

export function CanvasPage() {
  const date = useCurrentDay();
  const { error, isLoading, workspace } = useDayWorkspace(date);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col">
      <header className="mb-5">
        <h1 className="text-4xl font-semibold tracking-normal text-ink sm:text-5xl">思维画布</h1>
        <p className="mt-3 text-sm font-medium text-moss">{date}</p>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          把想法、计划和待办放到同一个空间里。手机上适合查看和轻量调整，复杂连线更适合回到桌面端完成。
        </p>
      </header>
      {error ? (
        <p className="mb-5 rounded-2xl border border-ember/25 bg-ember/10 px-4 py-3 text-sm text-ember">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <div className="rounded-[2rem] border border-line bg-white/45 px-6 py-12 text-center text-sm text-muted shadow-soft">
          正在准备当天工作区。
        </div>
      ) : (
        <CanvasView workspace={workspace} />
      )}
    </section>
  );
}
