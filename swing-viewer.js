(() => {
  "use strict";

  const root = document.getElementById("swingPositionViewer");
  if (!root) return;

  const positions = [
    {
      title: "Address",
      description: "Build a balanced starting position before the club moves. Your posture should feel athletic, comfortable, and ready—not rigid.",
      thought: "Balanced and ready.",
      checks: ["Feet stable with pressure centered", "Arms hanging naturally", "Eyes settled on the ball"]
    },
    {
      title: "Takeaway",
      description: "Begin with the chest, arms, and club moving together. The club stays low while your balance and posture remain quiet.",
      thought: "Move everything together.",
      checks: ["Chest starts the motion", "Hands stay calm", "Feet remain planted"]
    },
    {
      title: "Lead Arm Parallel",
      description: "Continue turning as the wrists begin to set. The lead arm approaches parallel while your head and lower body stay organized.",
      thought: "Turn—then let it rise.",
      checks: ["Lead arm extended, not rigid", "Trail knee stays supported", "Body remains centered"]
    },
    {
      title: "Top of Backswing",
      description: "Complete the backswing in balance. Your body is loaded inside the trail side without drifting away from the ball.",
      thought: "Loaded, not loose.",
      checks: ["Shoulders fully turned", "Pressure inside trail foot", "Arms retain width"]
    },
    {
      title: "Transition",
      description: "Start the change of direction from the ground. Pressure moves toward the lead side while the arms begin to fall naturally.",
      thought: "Shift, then unwind.",
      checks: ["Lead-side pressure increases", "Hands fall before they race", "Chest stays composed"]
    },
    {
      title: "Delivery",
      description: "Bring the club into the hitting zone while the body keeps rotating. The hands lead and the clubhead follows.",
      thought: "Keep turning through.",
      checks: ["Trail elbow works in front", "Shaft approaches on plane", "Hips continue opening"]
    },
    {
      title: "Impact",
      description: "Meet the ball with forward pressure and continued rotation. Impact is a moment within the motion—not a place to stop.",
      thought: "Through the ball.",
      checks: ["Pressure favors lead side", "Hands slightly ahead", "Chest keeps rotating"]
    },
    {
      title: "Release",
      description: "Let the arms extend toward the target as speed carries the club beyond the ball. Avoid forcing or holding the clubface.",
      thought: "Long and free.",
      checks: ["Arms extend naturally", "Trail heel begins to rise", "Eyes follow the shot"]
    },
    {
      title: "Trail Arm Parallel",
      description: "Allow the club to rise as the torso completes its turn. The arms fold naturally, the chest faces the target, and most pressure is on the lead side.",
      thought: "Around and up.",
      checks: ["Chest faces the target", "Trail knee moves through", "Motion remains smooth"]
    },
    {
      title: "Balanced Finish",
      description: "Finish tall, turned, and stable enough to hold the pose. A balanced finish is evidence that the whole motion stayed organized.",
      thought: "Finish and hold.",
      checks: ["Weight supported by lead leg", "Trail foot rests on its toe", "Body quiet and balanced"]
    }
  ];

  const image = root.querySelector("#scSwingImage");
  const badge = root.querySelector("#scPositionBadge");
  const count = root.querySelector("#scPositionCount");
  const title = root.querySelector("#scPositionTitle");
  const description = root.querySelector("#scPositionDescription");
  const thought = root.querySelector("#scSimpleThought");
  const checks = root.querySelector("#scPositionChecks");
  const range = root.querySelector("#scSwingRange");
  const positionButtons = root.querySelector("#scPositionButtons");
  const playButton = root.querySelector("#scPlay");
  const reverseButton = root.querySelector("#scPlayReverse");

  let current = 0;
  let view = "front";
  let timer = null;
  let direction = 1;
  let narrationTimers = [];
  let queuedNarration = null;

  positionButtons.innerHTML = positions.map((position, index) =>
    `<button type="button" data-sc-position="${index}" aria-label="P${index + 1}: ${position.title}">P${index + 1}</button>`
  ).join("");

  ["front", "three-quarter"].forEach(camera => {
    for (let index = 1; index <= 10; index += 1) {
      const preload = new Image();
      preload.src = `assets/swing-positions/${camera}/p${index}.webp?v=0150`;
    }
  });

  function announcePlayback() {
    const forward = Boolean(timer && direction === 1);
    const reverse = Boolean(timer && direction === -1);
    playButton.setAttribute("aria-pressed", String(forward));
    reverseButton.setAttribute("aria-pressed", String(reverse));
    playButton.textContent = forward ? "❚❚ Playing" : "▶ Play";
    reverseButton.textContent = reverse ? "❚❚ Reversing" : "◀ Play Reverse";
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
    announcePlayback();
  }

  function render(index) {
    current = Math.max(0, Math.min(positions.length - 1, index));
    const position = positions[current];
    const cameraLabel = view === "front" ? "Front view" : "Three-quarter view";

    image.src = `assets/swing-positions/${view}/p${current + 1}.webp?v=0150`;
    image.alt = `${cameraLabel} of golfer at P${current + 1}, ${position.title}`;
    badge.textContent = `P${current + 1}`;
    count.textContent = `Position ${current + 1} of 10`;
    title.textContent = `P${current + 1} · ${position.title}`;
    description.textContent = position.description;
    thought.textContent = position.thought;
    checks.innerHTML = position.checks.map(item => `<li>${item}</li>`).join("");
    range.value = String(current + 1);

    positionButtons.querySelectorAll("button").forEach((button, buttonIndex) => {
      const active = buttonIndex === current;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  }

  function normalizePosition(value) {
    const match = String(value ?? "").match(/(?:position\s*)?p?\s*(10|[1-9])/i);
    const number = match ? Number(match[1]) : Number(value);
    return Number.isInteger(number) && number >= 1 && number <= positions.length ? number : null;
  }

  function clearNarration() {
    narrationTimers.forEach(id => window.clearTimeout(id));
    narrationTimers = [];
  }

  function revealViewer() {
    const guideTab = document.querySelector('.tab[data-view="guide"]');
    if (guideTab && !guideTab.classList.contains("active")) guideTab.click();
    window.requestAnimationFrame(() => root.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  function showPosition(value, options = {}) {
    const number = normalizePosition(value);
    if (!number) return { success: false, message: "Position must be P1 through P10." };
    stop();
    render(number - 1);
    if (options.reveal !== false) revealViewer();
    const detail = {
      success: true,
      position: number,
      label: `P${number}`,
      title: positions[number - 1].title,
      description: positions[number - 1].description,
      thought: positions[number - 1].thought,
      checks: [...positions[number - 1].checks],
      view,
      source: options.source || "app"
    };
    root.dispatchEvent(new CustomEvent("sherpa:swing-position-changed", { detail }));
    return detail;
  }

  function narrationPositions(text) {
    const source = String(text || "");
    const matches = [...source.matchAll(/\b(?:P|position)\s*(10|[1-9])\b/gi)];
    const seen = new Set();
    return matches.reduce((items, match) => {
      const position = Number(match[1]);
      if (seen.has(position)) return items;
      seen.add(position);
      const wordsBefore = source.slice(0, match.index).trim().split(/\s+/).filter(Boolean).length;
      items.push({ position, wordsBefore });
      return items;
    }, []);
  }

  function narrate(text, options = {}) {
    clearNarration();
    const sequence = narrationPositions(text);
    if (!sequence.length) return { success: false, positions: [] };
    const startDelay = Math.max(0, Number(options.startDelayMs) || 0);
    const wordsPerSecond = Math.max(1.8, Number(options.wordsPerSecond) || 2.45);
    sequence.forEach((item, index) => {
      const estimatedSpeechOffset = Math.round((item.wordsBefore / wordsPerSecond) * 1000);
      const delay = startDelay + (index === 0 ? 0 : Math.max(1800, estimatedSpeechOffset));
      narrationTimers.push(window.setTimeout(() => {
        showPosition(item.position, {
          reveal: options.reveal !== false,
          source: options.source || "sage-narration"
        });
      }, delay));
    });
    return { success: true, positions: sequence.map(item => item.position) };
  }

  function queueNarration(text, options = {}) {
    queuedNarration = { text: String(text || ""), options };
    return { success: narrationPositions(text).length > 0 };
  }

  function startQueuedNarration(options = {}) {
    if (!queuedNarration) return { success: false, positions: [] };
    const queued = queuedNarration;
    queuedNarration = null;
    return narrate(queued.text, { ...queued.options, ...options });
  }

  function step(amount, stopFirst = true) {
    if (stopFirst) stop();
    render(current + amount);
  }

  function play(newDirection) {
    stop();
    direction = newDirection;
    if ((direction === 1 && current === positions.length - 1) || (direction === -1 && current === 0)) {
      render(direction === 1 ? 0 : positions.length - 1);
    }
    announcePlayback();
    timer = window.setInterval(() => {
      const next = current + direction;
      if (next < 0 || next >= positions.length) {
        stop();
        return;
      }
      render(next);
    }, 900);
    announcePlayback();
  }

  root.querySelectorAll("[data-sc-swing-view]").forEach(button => {
    button.addEventListener("click", () => {
      clearNarration();
      stop();
      view = button.dataset.scSwingView;
      root.querySelectorAll("[data-sc-swing-view]").forEach(other => {
        const active = other === button;
        other.classList.toggle("active", active);
        other.setAttribute("aria-pressed", String(active));
      });
      render(current);
    });
  });

  positionButtons.addEventListener("click", event => {
    const button = event.target.closest("[data-sc-position]");
    if (!button) return;
    clearNarration();
    stop();
    render(Number(button.dataset.scPosition));
  });
  range.addEventListener("input", () => { clearNarration(); stop(); render(Number(range.value) - 1); });
  playButton.addEventListener("click", () => { clearNarration(); timer && direction === 1 ? stop() : play(1); });
  reverseButton.addEventListener("click", () => { clearNarration(); timer && direction === -1 ? stop() : play(-1); });
  root.querySelector("#scStop").addEventListener("click", () => { clearNarration(); queuedNarration = null; stop(); });
  root.querySelector("#scPrevious").addEventListener("click", () => { clearNarration(); step(-1); });
  root.querySelector("#scNext").addEventListener("click", () => { clearNarration(); step(1); });

  root.addEventListener("keydown", event => {
    if (event.target.matches("button,input")) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); clearNarration(); step(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); clearNarration(); step(1); }
    if (event.key === " ") { event.preventDefault(); clearNarration(); timer ? stop() : play(1); }
  });

  window.SherpaSwingBridge = {
    showPosition,
    narrate,
    queueNarration,
    startQueuedNarration,
    cancelNarration() { clearNarration(); queuedNarration = null; },
    getCurrentPosition() {
      return { position: current + 1, label: `P${current + 1}`, title: positions[current].title, view };
    },
    listPositions() {
      return positions.map((position, index) => ({ position: index + 1, label: `P${index + 1}`, title: position.title }));
    }
  };
  document.dispatchEvent(new CustomEvent("sherpa:swing-bridge-ready", { detail: window.SherpaSwingBridge }));

  document.addEventListener("visibilitychange", () => { if (document.hidden) { clearNarration(); stop(); } });
  render(0);
})();
