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
      title: "Follow-through",
      description: "Allow the club to rise and move around you as the torso completes its turn. Most pressure is now on the lead side.",
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

  positionButtons.innerHTML = positions.map((position, index) =>
    `<button type="button" data-sc-position="${index}" aria-label="P${index + 1}: ${position.title}">P${index + 1}</button>`
  ).join("");

  ["front", "three-quarter"].forEach(camera => {
    for (let index = 1; index <= 10; index += 1) {
      const preload = new Image();
      preload.src = `assets/swing-positions/${camera}/p${index}.webp?v=0149`;
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

    image.src = `assets/swing-positions/${view}/p${current + 1}.webp?v=0149`;
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
    stop();
    render(Number(button.dataset.scPosition));
  });
  range.addEventListener("input", () => { stop(); render(Number(range.value) - 1); });
  playButton.addEventListener("click", () => timer && direction === 1 ? stop() : play(1));
  reverseButton.addEventListener("click", () => timer && direction === -1 ? stop() : play(-1));
  root.querySelector("#scStop").addEventListener("click", stop);
  root.querySelector("#scPrevious").addEventListener("click", () => step(-1));
  root.querySelector("#scNext").addEventListener("click", () => step(1));

  root.addEventListener("keydown", event => {
    if (event.target.matches("button,input")) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
    if (event.key === " ") { event.preventDefault(); timer ? stop() : play(1); }
  });

  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  render(0);
})();
