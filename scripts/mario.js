import {Nes} from "./nes/nes.js";
import {DotNes} from "./nes/dot-nes.js";
import {Av} from "./nes/av.js";
import {Button} from "./nes/button.js";

onload = event => {
  main();
};

async function main() {
  const nes = new Nes();

  bindHtmlButtons(nes);
  bindKeys(nes);

  const rom = (new DotNes(await readFile("/mario.nes"))).toRom();

  nes.setRom(rom);
  nes.power();

  const ready = document.getElementById("ready");
  const audioContext = new AudioContext();
  const videoContext = document.querySelector("canvas").getContext("2d");
  const av = new Av({audioContext, nes, videoContext});

  ready.onclick = event => {
    av.play();
    ready.style.display = "none";
  };
}

function bindHtmlButtons(nes) {
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

  const activePointers = {};

  onpointerdown = event => {
    activePointers[event.pointerId] = {origin: event.target};
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
  };

  onpointerup = event => {
    const pointerId = event.pointerId;
    const elementId = activePointers[pointerId].origin.id;

    if (elementId in binds) {
      const htmlButton = document.getElementById(elementId);
      htmlButton.pointerdownCount = Math.max(0, htmlButton.pointerdownCount - 1);
      
      if (Object.keys(activePointers).length === 0) {
        document.body.style.userSelect = "auto";
        document.body.style.webkitUserSelect = "auto";
      }

      updateHtmlButton(htmlButton);
    }

    delete activePointers[pointerId];
  };

  onpointercancel = event => {
    onpointerup(event);
  };

  for (const elementId in binds) {
    const htmlButton = document.getElementById(elementId);

    htmlButton.pointerdownCount = 0;
    htmlButton.pointerenterCount = 0;

    htmlButton.onclick = event => {
      if (event.detail === 0) {
        // keyboard
        simulateClick(htmlButton);
      }
    };

    const nesButton = binds[elementId];

    htmlButton.onpointerdown = event => {
      htmlButton.pointerdownCount++;
      nes.holdButton(nesButton);
      updateHtmlButton(htmlButton);
    };

    htmlButton.onpointerenter = event => {
      htmlButton.pointerenterCount++;

      if (activePointers[event.pointerId]) {
        nes.holdButton(nesButton);
      }

      updateHtmlButton(htmlButton);
    };

    htmlButton.onpointerleave = event => {
      htmlButton.pointerenterCount = Math.max(0, htmlButton.pointerenterCount - 1);

      if (activePointers[event.pointerId]?.origin !== htmlButton) {
        nes.releaseButton(nesButton);
      }

      updateHtmlButton(htmlButton);
    };

    htmlButton.onpointerup = event => {
      const origin = activePointers[event.pointerId].origin;

      if (origin.pointerdownCount === 1) {
        nes.releaseButton(binds[origin.id]);
      }

      const end = event.target;

      if (end.pointerdownCount === 0) {
        nes.releaseButton(binds[end.id]);
      }

      htmlButton.pointerdownCount = Math.max(0, htmlButton.pointerdownCount - 1);
      updateHtmlButton(htmlButton);
    };

    htmlButton.onpointercancel = event => {
      htmlButton.onpointerup(event);
    };
  }
}

function updateHtmlButton(button) {
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

function simulateClick(target) {
  const pointerdown = new Event("pointerdown", {bubbles: true});

  pointerdown.pointerId = Math.floor(777 * Math.random());
  target.dispatchEvent(pointerdown);

  const pointerup = new Event("pointerup", {bubbles: true});

  pointerup.pointerId = pointerdown.pointerId;
  setTimeout(() => target.dispatchEvent(pointerup), 100);
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

  onkeydown = event => {
    nes.holdButton(binds[event.code]);
  };

  onkeyup = event => {
    nes.releaseButton(binds[event.code]);
  };
}

async function readFile(file) {
  return new Uint8Array(await (await fetch(file)).arrayBuffer());
}