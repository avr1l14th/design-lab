"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { prototypes } from "@/prototypes-registry";

export default function Home() {
  return (
    <main className="min-h-full w-full bg-zinc-50 px-6 py-20 dark:bg-black sm:px-10">
      <div className="mx-auto w-full max-w-4xl">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12"
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-500">
            Design Lab
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            Interactive prototypes
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Живые прототипы из Figma. Тыкай, давай фидбек.
          </p>
        </motion.header>

        {prototypes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-base text-zinc-500">
              Прототипов пока нет. Скоро появятся.
            </p>
          </motion.div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {prototypes.map((p, i) => (
              <motion.li
                key={p.slug}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              >
                <Link
                  href={`/${p.slug}`}
                  className="group block rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-400 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                      {p.title}
                    </h2>
                    <span className="text-zinc-400 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {p.description}
                  </p>
                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-xs text-zinc-400">
                    обновлено: {p.updatedAt}
                  </p>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
