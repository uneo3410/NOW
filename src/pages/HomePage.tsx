import { QuickCapture } from "../features/capture/components/QuickCapture";
import { todayLocalDate } from "../utils/date";

export function HomePage() {
  const today = todayLocalDate();

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-5xl flex-col justify-center py-6 md:py-12">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem] md:items-center">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-medium text-moss">Personal timeline canvas</p>
          <h1 className="text-5xl font-semibold tracking-normal text-ink sm:text-7xl">
            Now 时间线
          </h1>
          <p className="mt-7 max-w-xl text-xl leading-8 text-muted sm:text-2xl sm:leading-10">
            用卡片计划今天，用时间线保存发生过的事。
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-medium text-surface shadow-soft transition hover:bg-ink/90"
              href={`/timeline?date=${today}`}
            >
              今日时间线
            </a>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-white/55 px-6 text-sm font-medium text-ink transition hover:bg-white"
              href={`/canvas?date=${today}`}
            >
              今日画布
            </a>
            <div className="hidden h-px w-28 bg-ember sm:block" />
          </div>
        </div>

        <div className="md:hidden">
          <QuickCapture />
        </div>

        <div className="hidden rounded-[1.75rem] border border-line bg-white/45 p-5 shadow-soft md:block">
          <p className="text-sm font-medium text-moss">今天</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{today}</p>
          <p className="mt-4 text-sm leading-6 text-muted">
            移动端负责快速捕捉，桌面端负责整理画布和回看时间线。
          </p>
        </div>
      </div>
    </section>
  );
}
