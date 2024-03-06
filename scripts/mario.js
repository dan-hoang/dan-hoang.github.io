let activePointerCount = 0;

const activePointers = {
  // activePointers is added to on a pointerdown.
};

async function main() {
  const nes = new Nes();
  const rom = parseRom(await readFile("/mario.nes"));
  nes.setRom(rom);
  nes.power();

  const audioContext = new AudioContext();
  const canvas = document.querySelector("canvas");
  const videoContext = canvas.getContext("2d");
  const av = new Av(audioContext, nes, videoContext);

  bindKeys(nes);
  bindPointers(nes);

  document.getElementById("ready").onclick = () => {
    document.getElementById("ready").style.display = "none";
    av.play();
  };
}

async function readFile(file) {
  return new Uint8Array(await (await fetch(file)).arrayBuffer());
}

function bindKeys(nes) {
  const binds = {
    "KeyQ": Button.LEFT_1,
    "KeyW": Button.A_1,
    "KeyE": Button.RIGHT_1,
    "KeyB": Button.LEFT_2,
    "KeyN": Button.A_2,
    "KeyM": Button.RIGHT_2
  };

  document.onkeydown = e => nes.holdButton(binds[e.code]);
  document.onkeyup = e => nes.releaseButton(binds[e.code]);
}

function bindPointers(nes) {
  const binds = {
    "left-1": Button.LEFT_1,
    "up-1": Button.A_1,
    "right-1": Button.RIGHT_1,
    "left-2": Button.LEFT_2,
    "up-2": Button.A_2,
    "right-2": Button.RIGHT_2,
    "mode": Button.SELECT_1,
    "play": Button.START_1
  };

  for (const id in binds) {
    const button = document.getElementById(id);

    button.addEventListener("click", e => {
      if (e.detail === 0) {
        // keyboard
        const pointerdown = new Event("pointerdown", {bubbles: true});
        const pointerup = new Event("pointerup", {bubbles: true});
        pointerdown.pointerId = Math.floor(777 * Math.random());
        pointerdown.target = button;
        pointerup.pointerId = pointerdown.pointerId;
        pointerup.target = button;
        button.dispatchEvent(pointerdown);
        setTimeout(() => button.dispatchEvent(pointerup), 100);
      }
    });

    button.addEventListener("pointerdown", e => {
      nes.holdButton(binds[button.id]);
    });

    button.addEventListener("pointerenter", e => {
      if (activePointers[e.pointerId]) {
        nes.holdButton(binds[button.id]);
      }
    });

    button.addEventListener("pointerleave", e => {
      if (activePointers[e.pointerId] && button !== activePointers[e.pointerId].origin) {
        nes.releaseButton(binds[button.id]);
      }
    });

    function pointerupEventListener(e) {
      if (activePointers[e.pointerId]) {
        const origin = activePointers[e.pointerId].origin;

        if (origin.pointerdownCount === 0) {
          nes.releaseButton(binds[origin.id]);
        }

        const end = e.target;

        if (end.pointerdownCount === 0) {
          nes.releaseButton(binds[end.id]);
        }

        activePointerCount = Math.max(0, activePointerCount - 1);
        delete activePointers[e.pointerId];
      }

      if (activePointerCount === 0) {
        document.body.style.userSelect = "auto";
        document.body.style.webkitUserSelect = "auto";
      }
    };

    document.addEventListener("pointerup", pointerupEventListener);
    document.addEventListener("pointercancel", pointerupEventListener);
    
  }
}

function initializeButtonStyle() {
  const buttons = document.querySelectorAll("button");

  for (const button of buttons) {
    button.pointerdownCount = 0;
    button.pointerenterCount = 0;

    button.addEventListener("pointerdown", e => {
      activePointerCount++;
      activePointers[e.pointerId] = {origin: button};
      button.pointerdownCount++;
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
      updateButtonStyle(button);
    });

    button.addEventListener("pointerenter", e => {
      button.pointerenterCount++;
      updateButtonStyle(button);
    });
  
    button.addEventListener("pointerleave", e => {
      button.pointerenterCount = Math.max(0, button.pointerenterCount - 1);
      updateButtonStyle(button);
    });
  }

  function pointerupEventListener(e) {
    if (activePointers[e.pointerId]) {
      const button = activePointers[e.pointerId].origin;
      button.pointerdownCount = Math.max(0, button.pointerdownCount - 1);
      updateButtonStyle(button);
    }
  }

  document.addEventListener("pointerup", pointerupEventListener);
  document.addEventListener("pointercancel", pointerupEventListener);
}

function updateButtonStyle(button) {
  if (button.pointerdownCount > 0) {
    // active
    button.style.filter = "brightness(133%)";
    return;
  }

  if (button.pointerenterCount > 0) {
    // hover
    button.style.filter = "brightness(116%)";
    return;
  }

  button.style.filter = "none";
}

document.body.onload = () => {
  initializeButtonStyle();
  main();
}