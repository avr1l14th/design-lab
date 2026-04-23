"use client";

import { Agentation } from "agentation";

/**
 * Dev-only feedback widget. Only rendered when NODE_ENV !== 'production'
 * (the parent already guards via layout, but double-check here too).
 */
export default function AgentationDev() {
  if (process.env.NODE_ENV === "production") return null;
  return <Agentation endpoint="http://localhost:4747" />;
}
