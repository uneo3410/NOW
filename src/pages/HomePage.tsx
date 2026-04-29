export function HomePage() {
  return (
    <main className="min-h-dvh bg-surface text-ink">
      <section className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-6 py-16 sm:px-10">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-medium text-moss">Personal timeline canvas</p>
          <h1 className="text-5xl font-semibold tracking-normal text-ink sm:text-7xl">
            Now 时间线
          </h1>
          <p className="mt-7 max-w-xl text-xl leading-8 text-muted sm:text-2xl sm:leading-10">
            用卡片计划今天，用时间线保存发生过的事。
          </p>
          <div className="mt-12 h-px w-28 bg-ember" />
        </div>
      </section>
    </main>
  );
}
