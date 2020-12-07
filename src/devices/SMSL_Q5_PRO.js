import itach from "itach";
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export default async ({ setState, getState }) => {
  const device = "SMSL Q5 PRO";
  const config = {
    itach: {
      host: "192.168.1.25",
      reconnect: true,
      sendTimeout: 1000, // sendTimeout 500 is too low and causes issues
    },
    volume: {
      min: 1, // Minimum possible volume state
      minBoot: 5, // Mininum possible volume state after power off
      max: 60, // Maximum possible volume state
      maxBoot: 20, // Maximum possible volume state after power off
      initial: 2, // Prefered volume after reset / power off
    },
    tone: {
      min: -9, // Minimum possible bass/treble volume state
      max: 9, // Maximum possible bass/treble volume state
      initial: 0, // Prefered bass/treble volume after reset
      delay: 200, // Delay between button presses (required to avoid unsync during presses and actual state)
    },
    input: {
      possible: ["usb", "opt", "coax", "aux"],
      initial: "usb",
      delay: 1500, // Delay between button presses (required to avoid unsync during presses and actual state)
    },
  };

  const buttons = {
    power:
      "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,65,22,65,22,65,22,65,22,65,22,65,22,65,22,1657",
    up:
      "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,65,22,65,22,65,22,65,22,1657",
    down:
      "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,22,22,65,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,22,22,65,22,65,22,65,22,65,22,65,22,1657",
    mute:
      "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,65,22,22,22,65,22,65,22,65,22,65,22,65,22,1657",
    tone:
      "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,65,22,22,22,65,22,65,22,65,22,65,22,65,22,1657",
    input:
      "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,65,22,65,22,65,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,65,22,65,22,65,22,65,22,65,22,1657",
  };

  async function updateState(key, value) {
    setState({ device, key, value });
  }

  itach.connect(config.itach);

  itach.on("connect", async () => {
    console.log("itach connected");
    // await resetAll();
    //await setVolume(3)
    //await itach.send(buttons.down)
    //await resetBass()
    //await resetTreble()

    //await setBass(1)
    //await setTreble(6)
  });

  async function setInput(input) {
    const wanted = config.input.possible.indexOf(input) + 1;
    if (wanted === 0) return { error: "Invalid input provided." };
    let currentInput =
      (await getState({ device, key: "input" }))?.input || config.input.initial;

    const current = config.input.possible.indexOf(currentInput) + 1;

    console.log("CURRENT", { current, currentInput });

    let times = 0;
    if (wanted < current) {
      times = config.input.possible.length - current + wanted;
    } else if (wanted > current) {
      times = wanted - current;
    }
    while (times > 0) {
      await itach.send(buttons.input);
      await sleep(config.input.delay);
      times--;
    }
    updateState("input", input);
  }

  async function setVolume(level) {
    if (level < config.volume.min || level > config.volume.max)
      return { error: "Volume level out of range" };
    let current =
      (await getState({ device, key: "volume" }))?.volume ||
      config.volume.initial;
    if (level === current) return { error: "Volume is already " + level };
    const shouldIncrease = level > current;
    const button = shouldIncrease ? buttons.up : buttons.down;

    while (level !== current) {
      await itach.send(button);
      if (shouldIncrease) current++;
      else current--;
    }

    updateState("volume", current);
  }

  async function resetVolume() {
    const times = config.volume.max;
    for (let i = 0; i < times; i++) {
      await itach.send(buttons.down);
    }

    updateState("volume", config.volume.min);
    await setVolume(config.volume.initial);
  }

  async function setBass(level) {
    if (level < config.tone.min || level > config.tone.max)
      return { error: "Bass level out of range" };
    let current =
      (await getState({ device, key: "bass" }))?.bass || config.tone.initial;
    if (level === current) return { error: "Bass is already " + level };

    const shouldIncrease = level > current;
    const button = shouldIncrease ? buttons.up : buttons.down;

    await itach.send(buttons.tone);
    await sleep(config.tone.delay);
    while (level !== current) {
      await itach.send(button);
      await sleep(config.tone.delay);
      if (shouldIncrease) current++;
      else current--;
    }
    await itach.send(buttons.tone);
    await sleep(config.tone.delay);
    await itach.send(buttons.tone);
    await sleep(config.tone.delay);

    updateState("bass", current);
  }

  async function resetBass() {
    const times = Math.abs(config.tone.min) + config.tone.max;

    await itach.send(buttons.tone);
    await sleep(config.tone.delay);
    for (let i = 0; i < times; i++) {
      await itach.send(buttons.down);
      await sleep(config.tone.delay);
    }
    await sleep(config.tone.delay);
    await itach.send(buttons.tone);
    await sleep(config.tone.delay);
    await itach.send(buttons.tone);
    await sleep(config.tone.delay);

    updateState("bass", config.tone.min);
    await setBass(config.tone.initial);
  }

  async function setTreble(level) {
    if (level < config.tone.min || level > config.tone.max)
      return { error: "Treble level out of range" };
    let current =
      (await getState({ device, key: "treble" }))?.treble ||
      config.tone.initial;
    if (level === current) return { error: "Treble is already " + level };

    const shouldIncrease = level > current;
    const button = shouldIncrease ? buttons.up : buttons.down;

    await itach.send(buttons.tone);
    await sleep(config.tone.delay);
    await itach.send(buttons.tone);
    await sleep(config.tone.delay);
    while (level !== current) {
      await itach.send(button);
      await sleep(config.tone.delay);
      if (shouldIncrease) current++;
      else current--;
    }
    await sleep(config.tone.delay);
    await itach.send(buttons.tone);
    await sleep(config.tone.delay);

    updateState("treble", current);
  }

  async function resetTreble() {
    const times = Math.abs(config.tone.min) + config.tone.max;

    await itach.send(buttons.tone);
    await sleep(config.tone.delay);
    await itach.send(buttons.tone);
    await sleep(config.tone.delay);
    for (let i = 0; i < times; i++) {
      await itach.send(buttons.down);
      await sleep(config.tone.delay);
    }
    await sleep(config.tone.delay);
    await itach.send(buttons.tone);
    await sleep(config.tone.delay);

    updateState("treble", config.tone.min);
    await setTreble(config.tone.initial);
  }

  async function resetAll() {
    await resetVolume();
    await resetBass();
    await resetTreble();
  }

  return {
    device,
    commands: {
      powerToggle: () => itach.send(buttons.power),
      nextInput: () => itach.send(buttons.input),
      setBass,
      setTreble,
      setInput,
      resetVolume,
      resetBass,
      resetTreble,
      resetAll,
    },
  };
};
