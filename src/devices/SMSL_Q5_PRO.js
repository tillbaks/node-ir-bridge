/**
 * Device: SMSL Q5 Pro
 * Command sender: Broadlink RM4 Pro
 *
 * Trying to make a dumb amplifier smart using an broadlink rm4 pro to send infrared commands and keeping track of the probable state
 * there is of course a chance that it can get out of sync which is why there are commands to reset volume
 * Also using safe delays between commands sent to the amplifier help with this.
 *  - There seems to be no delay required for changing volume
 *  - Tone change seems to need a small delay to not miss inputs (and in turn get out of sync).
 *  - Source change is slow and needs a lot of delay.
 *
 * @TODO: Implement a way to check if broadlink device is actually online (ping? responses from device?)
 *
 * @author tillbaks
 */

import Broadlink from "kiwicam-broadlinkjs-rm";

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export default async ({ setState, getState, lock }) => {
  const device = "SMSL Q5 PRO";
  let isConnected = false;
  const config = {
    broadlink: {
      mac: "a043b0545c89",
    },
    volume: {
      min: 1, // Minimum possible volume state
      minBoot: 5, // Mininum possible volume state after power off
      max: 60, // Maximum possible volume state
      maxBoot: 20, // Maximum possible volume state after power off
      initial: 2, // Prefered volume after reset / power off
      delay: 500, // Delay between button presses (required to avoid unsync during presses and actual state)
    },
    tone: {
      min: -9, // Minimum possible bass/treble volume state
      max: 9, // Maximum possible bass/treble volume state
      initial: 0, // Prefered bass/treble volume after reset
      delay: 500, // Delay between button presses (required to avoid unsync during presses and actual state)
    },
    source: {
      possible: ["usb", "opt", "coax", "aux"],
      initial: "usb",
      delay: 2000, // Delay between button presses (required to avoid unsync during presses and actual state)
    },
    eq: {
      possibleDisplay: ["EQ0", "EQ1", "EQ2", "EQ3", "EQ4", "EQ5", "EQ6", "EQ7"], // This is shown on the display
      possible: [
        "Off",
        "Bass",
        "Super Bass",
        "Heavy Rock",
        "Lite Rock",
        "Jazz",
        "Country",
        "Rap",
      ],
      initial: "Off",
      delay: 2000,
    },
  };

  const buttons = {
    up: Buffer.from([
      38,
      0,
      84,
      0,
      6,
      0,
      12,
      224,
      0,
      1,
      37,
      148,
      20,
      18,
      19,
      53,
      20,
      18,
      21,
      16,
      20,
      53,
      21,
      18,
      18,
      18,
      20,
      17,
      20,
      18,
      20,
      15,
      21,
      53,
      21,
      16,
      20,
      54,
      20,
      54,
      21,
      17,
      20,
      16,
      21,
      16,
      21,
      53,
      21,
      17,
      21,
      15,
      21,
      17,
      20,
      16,
      21,
      16,
      21,
      17,
      21,
      53,
      21,
      15,
      20,
      54,
      21,
      53,
      21,
      53,
      19,
      54,
      20,
      54,
      20,
      53,
      22,
      0,
      5,
      141,
      0,
      1,
      41,
      73,
      19,
      0,
      13,
      5,
      0,
      0,
    ]),
    down: Buffer.from([
      38,
      0,
      72,
      0,
      0,
      1,
      34,
      150,
      20,
      17,
      19,
      54,
      20,
      17,
      20,
      17,
      19,
      55,
      20,
      17,
      20,
      17,
      19,
      19,
      20,
      22,
      13,
      18,
      20,
      54,
      20,
      17,
      20,
      54,
      18,
      56,
      20,
      17,
      20,
      17,
      20,
      17,
      20,
      54,
      20,
      54,
      20,
      17,
      20,
      17,
      18,
      19,
      20,
      17,
      19,
      18,
      20,
      54,
      20,
      17,
      20,
      17,
      20,
      54,
      20,
      54,
      20,
      53,
      20,
      54,
      20,
      54,
      21,
      0,
      13,
      5,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]),
    power: Buffer.from([
      38,
      0,
      216,
      1,
      0,
      1,
      32,
      149,
      19,
      19,
      17,
      57,
      17,
      19,
      21,
      16,
      19,
      55,
      19,
      19,
      17,
      19,
      18,
      20,
      17,
      19,
      18,
      19,
      19,
      55,
      19,
      19,
      17,
      57,
      17,
      56,
      19,
      19,
      17,
      19,
      19,
      55,
      18,
      18,
      19,
      19,
      18,
      19,
      19,
      19,
      17,
      19,
      19,
      19,
      17,
      19,
      18,
      20,
      17,
      56,
      20,
      53,
      20,
      54,
      18,
      57,
      18,
      56,
      17,
      57,
      17,
      55,
      21,
      0,
      5,
      142,
      0,
      1,
      39,
      74,
      18,
      0,
      12,
      89,
      0,
      1,
      39,
      75,
      17,
      0,
      12,
      89,
      0,
      1,
      38,
      75,
      17,
      0,
      12,
      88,
      0,
      1,
      39,
      74,
      20,
      0,
      12,
      89,
      0,
      1,
      37,
      73,
      19,
      0,
      12,
      92,
      0,
      1,
      36,
      73,
      17,
      0,
      12,
      89,
      0,
      1,
      38,
      74,
      20,
      0,
      12,
      89,
      0,
      1,
      37,
      75,
      19,
      0,
      12,
      87,
      0,
      1,
      38,
      75,
      18,
      0,
      12,
      88,
      0,
      1,
      38,
      75,
      19,
      0,
      12,
      88,
      0,
      1,
      38,
      75,
      18,
      0,
      12,
      88,
      0,
      1,
      38,
      75,
      17,
      0,
      12,
      89,
      0,
      1,
      39,
      74,
      19,
      0,
      12,
      88,
      0,
      1,
      38,
      75,
      17,
      0,
      12,
      94,
      0,
      1,
      33,
      75,
      20,
      0,
      12,
      90,
      0,
      1,
      36,
      73,
      20,
      0,
      12,
      87,
      0,
      1,
      38,
      74,
      19,
      0,
      12,
      87,
      0,
      1,
      39,
      74,
      18,
      0,
      12,
      89,
      0,
      1,
      39,
      73,
      19,
      0,
      12,
      89,
      0,
      1,
      37,
      75,
      20,
      0,
      12,
      87,
      0,
      1,
      38,
      74,
      18,
      0,
      12,
      89,
      0,
      1,
      38,
      74,
      19,
      0,
      12,
      89,
      0,
      1,
      37,
      75,
      19,
      0,
      12,
      93,
      0,
      1,
      33,
      74,
      18,
      0,
      12,
      92,
      0,
      1,
      36,
      74,
      18,
      0,
      12,
      89,
      0,
      1,
      37,
      74,
      19,
      0,
      12,
      87,
      0,
      1,
      41,
      73,
      18,
      0,
      12,
      88,
      0,
      1,
      39,
      74,
      19,
      0,
      12,
      91,
      0,
      1,
      36,
      73,
      19,
      0,
      12,
      88,
      0,
      1,
      39,
      74,
      19,
      0,
      12,
      90,
      0,
      1,
      36,
      74,
      19,
      0,
      12,
      89,
      0,
      1,
      37,
      76,
      16,
      0,
      12,
      93,
      0,
      1,
      35,
      74,
      18,
      0,
      12,
      94,
      0,
      1,
      33,
      75,
      19,
      0,
      12,
      88,
      0,
      1,
      39,
      73,
      19,
      0,
      12,
      88,
      0,
      1,
      39,
      74,
      19,
      0,
      12,
      88,
      0,
      1,
      38,
      75,
      18,
      0,
      12,
      90,
      0,
      1,
      37,
      75,
      19,
      0,
      12,
      88,
      0,
      1,
      39,
      74,
      19,
      0,
      12,
      88,
      0,
      1,
      39,
      73,
      19,
      0,
      12,
      89,
      0,
      1,
      38,
      74,
      18,
      0,
      12,
      90,
      0,
      1,
      38,
      74,
      18,
      0,
      12,
      92,
      0,
      1,
      35,
      75,
      18,
      0,
      12,
      92,
      0,
      1,
      36,
      73,
      19,
      0,
      12,
      88,
      0,
      1,
      39,
      74,
      19,
      0,
      12,
      88,
      0,
      1,
      39,
      74,
      17,
      0,
      12,
      89,
      0,
      1,
      40,
      73,
      18,
      0,
      12,
      89,
      0,
      1,
      39,
      74,
      19,
      0,
      12,
      88,
      0,
      1,
      38,
      74,
      19,
      0,
      12,
      88,
      0,
      1,
      40,
      73,
      19,
      0,
      13,
      5,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]),
    eq: Buffer.from([
      38,
      0,
      80,
      0,
      0,
      1,
      35,
      149,
      18,
      18,
      19,
      56,
      17,
      20,
      18,
      19,
      17,
      57,
      17,
      19,
      19,
      19,
      18,
      19,
      17,
      20,
      18,
      19,
      17,
      57,
      17,
      19,
      19,
      56,
      17,
      56,
      21,
      16,
      19,
      19,
      20,
      16,
      19,
      19,
      19,
      18,
      20,
      54,
      21,
      15,
      21,
      17,
      17,
      19,
      22,
      16,
      21,
      53,
      19,
      54,
      18,
      56,
      20,
      17,
      19,
      54,
      21,
      54,
      18,
      56,
      17,
      56,
      18,
      0,
      5,
      146,
      0,
      1,
      39,
      74,
      18,
      0,
      13,
      5,
      0,
      0,
      0,
      0,
      0,
      0,
    ]),
    tone: Buffer.from([
      38,
      0,
      80,
      0,
      0,
      1,
      34,
      149,
      18,
      19,
      18,
      55,
      19,
      19,
      19,
      18,
      19,
      54,
      19,
      18,
      19,
      18,
      19,
      18,
      19,
      19,
      19,
      18,
      18,
      55,
      19,
      18,
      19,
      55,
      18,
      56,
      19,
      18,
      18,
      19,
      18,
      19,
      18,
      19,
      18,
      56,
      18,
      19,
      18,
      19,
      18,
      19,
      18,
      19,
      21,
      16,
      18,
      56,
      19,
      56,
      17,
      19,
      19,
      54,
      19,
      55,
      18,
      56,
      18,
      56,
      19,
      55,
      18,
      0,
      5,
      145,
      0,
      1,
      38,
      75,
      21,
      0,
      13,
      5,
      0,
      0,
      0,
      0,
      0,
      0,
    ]),
    source: Buffer.from([
      38,
      0,
      80,
      0,
      0,
      1,
      32,
      150,
      21,
      17,
      18,
      55,
      20,
      17,
      20,
      17,
      20,
      54,
      19,
      19,
      20,
      16,
      20,
      17,
      20,
      17,
      21,
      17,
      19,
      54,
      20,
      17,
      20,
      54,
      20,
      54,
      18,
      19,
      20,
      17,
      20,
      54,
      20,
      54,
      18,
      55,
      21,
      17,
      20,
      17,
      20,
      17,
      20,
      17,
      18,
      19,
      20,
      17,
      20,
      17,
      20,
      17,
      20,
      54,
      18,
      55,
      21,
      54,
      21,
      53,
      17,
      56,
      21,
      0,
      5,
      142,
      0,
      1,
      39,
      75,
      18,
      0,
      13,
      5,
      0,
      0,
      0,
      0,
      0,
      0,
    ]),
    mute: Buffer.from([
      38,
      0,
      80,
      0,
      0,
      1,
      34,
      149,
      20,
      18,
      18,
      55,
      19,
      18,
      18,
      19,
      19,
      55,
      19,
      19,
      17,
      19,
      18,
      20,
      17,
      19,
      21,
      16,
      19,
      55,
      19,
      19,
      17,
      57,
      17,
      56,
      19,
      19,
      17,
      19,
      19,
      55,
      21,
      17,
      17,
      19,
      18,
      56,
      18,
      18,
      20,
      17,
      19,
      18,
      19,
      19,
      18,
      19,
      18,
      56,
      18,
      55,
      18,
      19,
      18,
      57,
      17,
      56,
      18,
      56,
      18,
      55,
      20,
      0,
      5,
      148,
      0,
      1,
      34,
      78,
      15,
      0,
      13,
      5,
      0,
      0,
      0,
      0,
      0,
      0,
    ]),
  };

  async function updateState({ key, value, min, max }) {
    if (min !== undefined && value < min) {
      await setState({ device, key, value: min });
    } else if (max !== undefined && value > max) {
      await setState({ device, key, value: max });
    } else {
      await setState({ device, key, value });
    }
  }

  const broadlink = new Broadlink();
  broadlink.log = console.debug;
  broadlink.debug = false;
  broadlink.discover();
  let broadlinkDevice;

  broadlink.on("deviceReady", async (device) => {
    if (device.mac.toString("hex") === config.broadlink.mac) {
      isConnected = true;
      broadlinkDevice = device;

      await lock.acquireAsync();
      setTimeout(async () => {
        try {
          await resetAll();
          await setBass(1);
          await setTreble(7);
        } catch (error) {
          console.debug(error);
        } finally {
          lock.release();
        }
      }, 5000);
    }
  });

  async function setSource(payload) {
    const source = payload.toString();
    if (!isConnected) return { error: "Not connected" };
    const wanted = config.source.possible.indexOf(source) + 1;
    if (wanted === 0) return { error: "Invalid source provided." };
    const currentSource =
      (await getState({ device, key: "source" }))?.source ||
      config.source.initial;

    const current = config.source.possible.indexOf(currentSource) + 1;

    let times = 0;
    if (wanted < current) {
      times = config.source.possible.length - current + wanted;
    } else if (wanted > current) {
      times = wanted - current;
    }

    while (times > 0) {
      broadlinkDevice.sendData(buttons.source);
      await sleep(config.source.delay);
      times--;
    }
    await updateState({ key: "source", value: source });
  }

  async function setEQ(payload) {
    const eq = payload.toString();
    if (!isConnected) return { error: "Not connected" };
    const wanted = config.eq.possible.indexOf(eq) + 1;
    if (wanted === 0) return { error: "Invalid eq provided." };
    const currentEQ =
      (await getState({ device, key: "eq" }))?.eq || config.eq.initial;

    const current = config.eq.possible.indexOf(currentEQ) + 1;

    let times = 0;
    if (wanted < current) {
      times = config.eq.possible.length - current + wanted;
    } else if (wanted > current) {
      times = wanted - current;
    }

    while (times > 0) {
      broadlinkDevice.sendData(buttons.eq);
      await sleep(config.eq.delay);
      times--;
    }
    await updateState({ key: "eq", value: eq });
  }

  async function volumeUp(steps = 1) {
    if (!isConnected) return { error: "Not connected" };
    if (steps < 1 || steps > config.volume.max) return;

    let current =
      (await getState({ device, key: "volume" }))?.volume ||
      config.volume.initial;

    try {
      for (let i = 0; i < parseInt(steps); i++) {
        broadlinkDevice.sendData(buttons.up);
        await sleep(config.volume.delay);
        current++;
      }
    } finally {
      await updateState({
        key: "volume",
        value: current,
        min: config.volume.min,
        max: config.volume.max,
      });
    }
  }

  async function volumeDown(steps = 1) {
    if (!isConnected) return { error: "Not connected" };
    if (steps < 1 || steps > config.volume.max) return;

    let current =
      (await getState({ device, key: "volume" }))?.volume ||
      config.volume.initial;

    try {
      for (let i = 0; i < parseInt(steps); i++) {
        broadlinkDevice.sendData(buttons.down);
        await sleep(config.volume.delay);
        current--;
      }
    } finally {
      await updateState({
        key: "volume",
        value: current,
        min: config.volume.min,
        max: config.volume.max,
      });
    }
  }

  async function setVolume(newLevel) {
    if (!isConnected) return { error: "Not connected" };
    const level = parseInt(newLevel);
    if (level < config.volume.min || level > config.volume.max)
      return { error: "Volume level out of range" };
    let current =
      (await getState({ device, key: "volume" }))?.volume ||
      config.volume.initial;
    if (level === current) return { error: "Volume is already " + level };
    const increaseVolume = level > current;

    if (increaseVolume) {
      await volumeUp(level - current);
    } else {
      await volumeDown(current - level);
    }
  }

  async function resetVolume() {
    if (!isConnected) return { error: "Not connected" };
    await volumeDown(config.volume.max);
    await setVolume(config.volume.initial);
  }

  async function bassUp(steps = 1) {
    if (!isConnected) return { error: "Not connected" };
    if (steps < 1 || steps > Math.abs(config.tone.min) + config.tone.max)
      return;

    let current =
      (await getState({ device, key: "bass" }))?.bass || config.tone.initial;

    broadlinkDevice.sendData(buttons.tone);
    await sleep(config.tone.delay);

    for (let i = 0; i < parseInt(steps); i++) {
      broadlinkDevice.sendData(buttons.up);
      await sleep(config.tone.delay);
      current++;
    }

    broadlinkDevice.sendData(buttons.tone);
    await sleep(config.tone.delay);
    broadlinkDevice.sendData(buttons.tone);
    await sleep(config.tone.delay);

    await updateState({
      key: "bass",
      value: current,
      min: config.tone.min,
      max: config.tone.max,
    });
  }

  async function bassDown(steps = 1) {
    if (!isConnected) return { error: "Not connected" };
    if (steps < 1 || steps > Math.abs(config.tone.min) + config.tone.max)
      return;

    let current =
      (await getState({ device, key: "bass" }))?.bass || config.tone.initial;

    try {
      broadlinkDevice.sendData(buttons.tone);
      await sleep(config.tone.delay);

      for (let i = 0; i < parseInt(steps); i++) {
        broadlinkDevice.sendData(buttons.down);
        await sleep(config.tone.delay);
        current--;
      }

      broadlinkDevice.sendData(buttons.tone);
      await sleep(config.tone.delay);
      broadlinkDevice.sendData(buttons.tone);
      await sleep(config.tone.delay);

      await updateState({
        key: "bass",
        value: current,
        min: config.tone.min,
        max: config.tone.max,
      });
    } catch (error) {
      await sleep(config.tone.failDelay);
      await resetBass();
    }
  }

  async function setBass(newLevel) {
    if (!isConnected) return { error: "Not connected" };
    const level = parseInt(newLevel);
    if (level < config.tone.min || level > config.tone.max)
      return { error: "Bass level out of range" };
    let current =
      (await getState({ device, key: "bass" }))?.bass || config.tone.initial;
    if (level === current) return { error: "Bass is already " + level };

    const increaseBass = level > current;

    if (increaseBass) {
      await bassUp(level - current);
    } else {
      await bassDown(current - level);
    }
  }

  async function resetBass() {
    if (!isConnected) return { error: "Not connected" };
    await bassDown(Math.abs(config.tone.min) + config.tone.max);
    await setBass(config.tone.initial);
  }

  async function trebleUp(steps = 1) {
    if (!isConnected) return { error: "Not connected" };
    if (steps < 1 || steps > Math.abs(config.tone.min) + config.tone.max)
      return;

    let current =
      (await getState({ device, key: "treble" }))?.treble ||
      config.tone.initial;
    try {
      broadlinkDevice.sendData(buttons.tone);
      await sleep(config.tone.delay);
      broadlinkDevice.sendData(buttons.tone);
      await sleep(config.tone.delay);

      for (let i = 0; i < parseInt(steps); i++) {
        broadlinkDevice.sendData(buttons.up);
        await sleep(config.tone.delay);
        current++;
      }

      broadlinkDevice.sendData(buttons.tone);
      await sleep(config.tone.delay);

      await updateState({
        key: "treble",
        value: current,
        min: config.tone.min,
        max: config.tone.max,
      });
    } catch (error) {
      await sleep(config.tone.failDelay);
      await resetTreble();
    }
  }

  async function trebleDown(steps = 1) {
    if (!isConnected) return { error: "Not connected" };
    if (steps < 1 || steps > Math.abs(config.tone.min) + config.tone.max)
      return;

    let current =
      (await getState({ device, key: "treble" }))?.treble ||
      config.tone.initial;
    try {
      broadlinkDevice.sendData(buttons.tone);
      await sleep(config.tone.delay);
      broadlinkDevice.sendData(buttons.tone);
      await sleep(config.tone.delay);

      for (let i = 0; i < parseInt(steps); i++) {
        broadlinkDevice.sendData(buttons.down);
        await sleep(config.tone.delay);
        current--;
      }

      broadlinkDevice.sendData(buttons.tone);
      await sleep(config.tone.delay);

      await updateState({
        key: "treble",
        value: current,
        min: config.tone.min,
        max: config.tone.max,
      });
    } catch (error) {
      await sleep(config.tone.failDelay);
      await resetTreble();
    }
  }

  async function setTreble(newLevel) {
    if (!isConnected) return { error: "Not connected" };
    const level = parseInt(newLevel);
    if (level < config.tone.min || level > config.tone.max)
      return { error: "Treble level out of range" };
    let current =
      (await getState({ device, key: "treble" }))?.treble ||
      config.tone.initial;
    if (level === current) return { error: "Treble is already " + level };

    const increaseTreble = level > current;

    if (increaseTreble) {
      await trebleUp(level - current);
    } else {
      await trebleDown(current - level);
    }
  }

  async function resetTreble() {
    if (!isConnected) return { error: "Not connected" };
    await trebleDown(Math.abs(config.tone.min) + config.tone.max);
    await setTreble(config.tone.initial);
  }

  async function resetAll() {
    if (!isConnected) return { error: "Not connected" };
    await resetVolume();
    await resetBass();
    await resetTreble();
  }

  return {
    DEVICE_ID: device,
    commands: {
      // powerToggle: () => broadlinkDevice.sendData(buttons.power), // Don't use this. No way to reset the state. Better use a smart plug to cut power to amplifier
      nextSource: async () => broadlinkDevice.sendData(buttons.source),
      setSource, // This has the possibility to get out of sync, also no way to reset, can use nextSource above to resync since it does not change the state

      nextEQ: async () => {
        broadlinkDevice.sendData(buttons.eq);
        await sleep(config.eq.delay);
        broadlinkDevice.sendData(buttons.eq);
        await sleep(config.eq.delay);
      },
      setEQ, // This has the possibility to get out of sync, also no way to reset, can use nextEQ above to resync since it does not change the state

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
