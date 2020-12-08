/**
 * Device: SMSL Q5 Pro
 * Command sender: iTach IP2IR
 *
 * Trying to make a dumb amplifier smart using an itach to send infrared commands and keeping track of the probable state
 * there is of course a chance that it can get out of sync which is why there are commands to reset volume
 * Also using safe delays between commands sent to the amplifier help with this.
 *  - There seems to be no delay required for changing volume
 *  - Tone change seems to need a small delay to not miss inputs (and get out of sync).
 *  - Source change is slow and needs a lot of delay.
 *
 * @author tillbaks
 */

import itach from "itach";

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export default async ({ setState, getState }) => {
  const device = "SMSL Q5 PRO";
  const config = {
    itach: {
      host: "192.168.1.25",
      reconnect: true,
      sendTimeout: 1000, // sendTimeout 500ms is too low and causes issues, trying out 1000ms
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
      failDelay: 4000, // Time to wait until amplifier automatically switches back to volume mode (use this to wait after itach errors in tone change)
    },
    source: {
      possible: ["usb", "opt", "coax", "aux"],
      initial: "usb",
      delay: 1500, // Delay between button presses (required to avoid unsync during presses and actual state)
    },
  };

  const buttons = {
    power: "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,65,22,65,22,65,22,65,22,65,22,65,22,65,22,1657",
    up: "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,65,22,65,22,65,22,65,22,1657",
    down: "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,22,22,65,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,22,22,65,22,65,22,65,22,65,22,65,22,1657",
    mute: "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,65,22,22,22,65,22,65,22,65,22,65,22,65,22,1657",
    tone: "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,65,22,22,22,65,22,65,22,65,22,65,22,65,22,1657",
    source: "sendir,1:1,1,38400,1,1,347,173,22,22,22,65,22,22,22,22,22,65,22,22,22,22,22,22,22,22,22,22,22,65,22,22,22,65,22,65,22,22,22,22,22,65,22,65,22,65,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,65,22,65,22,65,22,65,22,65,22,1657",
  };

  async function updateState({ key, value, min, max }) {
    if (min !== undefined && value < min) {
      setState({ device, key, value: min });
    } else if (max !== undefined && value > max) {
      setState({ device, key, value: max });
    } else {
      setState({ device, key, value });
    }
  }

  itach.connect(config.itach);

  itach.on("connect", async () => {
    console.log("itach connected");
    //await resetAll();

    //await setVolume(3)
    //await itach.send(buttons.down)
    //await resetBass()
    //await resetTreble()
    //await setBass(1)
    //await setTreble(6)
  });

  async function setSource(source) {
    const wanted = config.source.possible.indexOf(source) + 1;
    if (wanted === 0) return { error: "Invalid source provided." };
    let currentSource = (await getState({ device, key: "source" }))?.source || config.source.initial;

    const current = config.source.possible.indexOf(currentSource) + 1;

    let times = 0;
    if (wanted < current) {
      times = config.source.possible.length - current + wanted;
    } else if (wanted > current) {
      times = wanted - current;
    }
    // @TODO: Try catch to figure out what source we're at when sending failed?
    while (times > 0) {
      await itach.send(buttons.source);
      await sleep(config.source.delay);
      times--;
    }
    updateState({ key: "source", value: source });
  }

  async function volumeUp(steps = 1) {
    if (steps < 1 || steps > config.volume.max) return;

    let current = (await getState({ device, key: "volume" }))?.volume || config.volume.initial;

    try {
      for (let i = 0; i < parseInt(steps); i++) {
        await itach.send(buttons.up);
        current++;
      }
    } finally {
      updateState({ key: "volume", value: current, min: config.volume.min, max: config.volume.max });
    }
  }

  async function volumeDown(steps = 1) {
    if (steps < 1 || steps > config.volume.max) return;

    let current = (await getState({ device, key: "volume" }))?.volume || config.volume.initial;

    try {
      for (let i = 0; i < parseInt(steps); i++) {
        await itach.send(buttons.down);
        current--;
      }
    } finally {
      updateState({ key: "volume", value: current, min: config.volume.min, max: config.volume.max });
    }
  }

  async function setVolume(newLevel) {
    const level = parseInt(newLevel);
    if (level < config.volume.min || level > config.volume.max) return { error: "Volume level out of range" };
    let current = (await getState({ device, key: "volume" }))?.volume || config.volume.initial;
    if (level === current) return { error: "Volume is already " + level };
    const increaseVolume = level > current;

    if (increaseVolume) {
      await volumeUp(level - current);
    } else {
      await volumeDown(current - level);
    }
  }

  async function resetVolume() {
    await volumeDown(config.volume.max);
    await setVolume(config.volume.initial);
  }

  async function bassUp(steps = 1) {
    if (steps < 1 || steps > Math.abs(config.tone.min) + config.tone.max) return;

    let current = (await getState({ device, key: "bass" }))?.bass || config.tone.initial;

    try {
      await itach.send(buttons.tone);
      await sleep(config.tone.delay);

      for (let i = 0; i < parseInt(steps); i++) {
        await itach.send(buttons.up);
        await sleep(config.tone.delay);
        current++;
      }

      await itach.send(buttons.tone);
      await sleep(config.tone.delay);
      await itach.send(buttons.tone);
      await sleep(config.tone.delay);

      updateState({ key: "bass", value: current, min: config.tone.min, max: config.tone.max });
    } catch (error) {
      await sleep(config.tone.failDelay);
      await resetBass();
    }
  }

  async function bassDown(steps = 1) {
    if (steps < 1 || steps > Math.abs(config.tone.min) + config.tone.max) return;

    let current = (await getState({ device, key: "bass" }))?.bass || config.tone.initial;

    try {
      await itach.send(buttons.tone);
      await sleep(config.tone.delay);

      for (let i = 0; i < parseInt(steps); i++) {
        await itach.send(buttons.down);
        await sleep(config.tone.delay);
        current--;
      }

      await itach.send(buttons.tone);
      await sleep(config.tone.delay);
      await itach.send(buttons.tone);
      await sleep(config.tone.delay);

      updateState({ key: "bass", value: current, min: config.tone.min, max: config.tone.max });
    } catch (error) {
      await sleep(config.tone.failDelay);
      await resetBass();
    }
  }

  async function setBass(newLevel) {
    const level = parseInt(newLevel);
    if (level < config.tone.min || level > config.tone.max) return { error: "Bass level out of range" };
    let current = (await getState({ device, key: "bass" }))?.bass || config.tone.initial;
    if (level === current) return { error: "Bass is already " + level };

    const increaseBass = level > current;

    if (increaseBass) {
      await bassUp(level - current);
    } else {
      await bassDown(current - level);
    }
  }

  async function resetBass() {
    await bassDown(Math.abs(config.tone.min) + config.tone.max);
    await setBass(config.tone.initial);
  }

  async function trebleUp(steps = 1) {
    if (steps < 1 || steps > Math.abs(config.tone.min) + config.tone.max) return;

    let current = (await getState({ device, key: "treble" }))?.treble || config.tone.initial;
    try {
      await itach.send(buttons.tone);
      await sleep(config.tone.delay);

      for (let i = 0; i < parseInt(steps); i++) {
        await itach.send(buttons.up);
        await sleep(config.tone.delay);
        current++;
      }

      await itach.send(buttons.tone);
      await sleep(config.tone.delay);
      await itach.send(buttons.tone);
      await sleep(config.tone.delay);

      updateState({ key: "treble", value: current, min: config.tone.min, max: config.tone.max });
    } catch (error) {
      await sleep(config.tone.failDelay);
      await resetTreble();
    }
  }

  async function trebleDown(steps = 1) {
    if (steps < 1 || steps > Math.abs(config.tone.min) + config.tone.max) return;

    let current = (await getState({ device, key: "treble" }))?.treble || config.tone.initial;
    try {
      await itach.send(buttons.tone);
      await sleep(config.tone.delay);
      await itach.send(buttons.tone);
      await sleep(config.tone.delay);

      for (let i = 0; i < parseInt(steps); i++) {
        await itach.send(buttons.down);
        await sleep(config.tone.delay);
        current--;
      }

      await itach.send(buttons.tone);
      await sleep(config.tone.delay);

      updateState({ key: "treble", value: current, min: config.tone.min, max: config.tone.max });
    } catch (error) {
      await sleep(config.tone.failDelay);
      await resetTreble();
    }
  }

  async function setTreble(newLevel) {
    const level = parseInt(newLevel);
    if (level < config.tone.min || level > config.tone.max) return { error: "Treble level out of range" };
    let current = (await getState({ device, key: "treble" }))?.treble || config.tone.initial;
    if (level === current) return { error: "Treble is already " + level };

    const increaseTreble = level > current;

    if (increaseTreble) {
      await trebleUp(level - current);
    } else {
      await trebleDown(current - level);
    }
  }

  async function resetTreble() {
    await trebleDown(Math.abs(config.tone.min) + config.tone.max);
    await setTreble(config.tone.initial);
  }

  async function resetAll() {
    await resetVolume();
    await resetBass();
    await resetTreble();
  }

  return {
    DEVICE_ID: device,
    commands: {
      // powerToggle: () => itach.send(buttons.power), // Don't use this. No way to reset the state. Better use a smart plug to cut power to amplifier
      nextSource: () => itach.send(buttons.source),
      setSource, // This has the possibility to get out of sync, also no way to reset, can use nextSource above to resync since it does not change the state

      volumeUp,
      volumeDown,
      setVolume,
      resetVolume,

      bassUp,
      bassDown,
      setBass,
      resetBass,

      trebleUp,
      trebleDown,
      setTreble,
      resetTreble,

      resetAll,
      getState: () => getState({ device }),
    },
  };
};
