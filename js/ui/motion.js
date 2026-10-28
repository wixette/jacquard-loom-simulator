// The reader's wish for less motion (prefers-reduced-motion, docs/ui-design.md, Accessibility):
// the 3D camera jumps instead of flying and stops when let go, the guide scrolls at once, and
// css/ui.css turns the transitions off. The loom moves only when the learner plays it.

/** Whether the reader asked for reduced motion. @returns {boolean} */
export const reducedMotion = () => (typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)").matches : false);
