const MODIFIER_KEYS = new Set(["Shift", "Control", "Meta", "Alt"]);

export function createKeySequence({ isMac, onComplete, timeoutMs = 1500 }) {
  let timer = null;

  const disarm = () => {
    clearTimeout(timer);
    timer = null;
  };

  return function handleInput(input) {
    if (input.type !== "keyDown") return false;

    if (timer !== null) {
      if (MODIFIER_KEYS.has(input.key)) return false;
      if (input.isAutoRepeat) return true;
      disarm();
      if (input.key.toLowerCase() === "r") {
        onComplete();
        return true;
      }
      return false;
    }

    const hasModifier = isMac ? input.meta : input.control;
    if (
      hasModifier &&
      !input.alt &&
      !input.shift &&
      input.key.toLowerCase() === "k"
    ) {
      timer = setTimeout(disarm, timeoutMs);
      return true;
    }
    return false;
  };
}
