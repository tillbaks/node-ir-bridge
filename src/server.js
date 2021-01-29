import AwaitLock from "await-lock";
import config from "../config.js";
import NeDB from "nedb";
import mqtt from "mqtt";

const lock = new AwaitLock.default();
const state = new NeDB({ filename: "state.nedb", autoload: true });
const APP_ID = "irbridge";

function getState({ device, key }) {
  return new Promise((resolve, reject) => {
    const query = key ? { device, key } : { device };
    state.find(query, (err, docs) => {
      if (err) reject(err);
      else
        resolve(
          docs.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
          }, {})
        );
    });
  });
}

function setState({ device, key, value }) {
  return new Promise((resolve) => {
    state.update(
      { device, key },
      { $set: { value } },
      { upsert: true },
      (err, numAffected, affectedDocuments, upsert) => {
        if (err) {
          console.error("Error (setState):", {
            err,
            device,
            key,
            value,
            numAffected,
            affectedDocuments,
            upsert,
          });
        }
        resolve();
      }
    );
  });
}

const deviceList = await Promise.all(
  config.devices.map(async (device) =>
    (await device).default({ setState, getState, lock })
  )
);
const devices = {};
deviceList.forEach((device) => {
  devices[device.DEVICE_ID] = device;
});

const client = mqtt.connect(config.mqtt.host, config.mqtt.options);

client.on("connect", async function () {
  console.log("MQTT Connected");

  client.on("message", async (topic, payload) => {
    await lock.acquireAsync();
    try {
      const [appId, deviceId, command] = topic.split("/");
      const result = await devices[deviceId].commands[command](JSON.parse(payload.toString()));
      console.debug(new Date(), "Executing:", {
        appId,
        deviceId,
        command,
        payload: payload.toString(),
        result,
      });

      const state = await getState({ device: deviceId });

      client.publish(`${APP_ID}/${deviceId}/state`, JSON.stringify(state), {
        retain: true,
      });
    } finally {
      lock.release();
    }
  });

  deviceList.forEach(async (device) => {
    client.subscribe(
      Object.keys(device.commands).map(
        (command) => `${APP_ID}/${device.DEVICE_ID}/${command}`
      ),
      {},
      console.log
    );
  });
});
