import smslq5pro from "./devices/SMSL_Q5_PRO.js";
import config from "../config.js";
import NeDB from "nedb";
import mqtt from "mqtt";
const state = new NeDB({ filename: "state.nedb", autoload: true });

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
        console.log({docs})
    });
  });
}

function setState({ device, key, value }) {
  state.update(
    { device, key },
    { $set: { value } },
    {
      upsert: true,
    },
    (err, numAffected, affectedDocuments, upsert) => {
      console.log("setState result:", {
        device,
        key,
        value,
        err,
        numAffected,
        affectedDocuments,
        upsert,
      });
    }
  );
}

const device_SMSL_Q5_PRO = await smslq5pro({ setState, getState });
  
const client = mqtt.connect(config.mqtt.host, config.mqtt.options);

client.on("connect", async function () {
  console.log("MQTT Connected");
  const state = await getState({ device: device_SMSL_Q5_PRO.device });
  console.log({ state });
  client.publish("irbridge/smslq5pro/state", JSON.stringify(state), {
    retain: true,
  });
});
