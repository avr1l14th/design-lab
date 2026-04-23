import Link from "next/link";
import { prototypes } from "@/prototypes-registry";

export default function Home() {
  return (
    <main className="min-h-full w-full bg-white px-6 py-24">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-16">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
            mymeet.ai design lab
          </h1>
          <p className="mt-1 text-lg text-zinc-500">
            Interactive prototypes
          </p>
        </header>

        <ul className="divide-y divide-zinc-100">
          {prototypes.length === 0
            ? Array.from({ length: 2 }).map((_, i) => (
                <li key={i} className="flex items-center gap-4 py-4">
                  <div className="h-12 w-12 shrink-0 rounded-md bg-zinc-100" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-400">
                      Название прототипа
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-300">
                      Дата последнего изменения
                    </p>
                  </div>
                </li>
              ))
            : prototypes.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/${p.slug}`}
                    className="group flex items-center gap-4 py-4 transition-colors hover:bg-zinc-50 -mx-3 px-3 rounded-lg"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                      {p.previewImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.previewImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-950 truncate">
                        {p.title}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500 truncate">
                        {p.updatedAt}
                        {p.description ? ` · ${p.description}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
        </ul>
      </div>
    </main>
  );
}
