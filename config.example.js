// Example configuration for the IR bridge

export default {
  // Import all devices that provide actual functionality
  devices: [
    import("./src/devices/SMSL_Q5_PRO.js")
  ],

  // Configure the MQTT broker we should connect to
  mqtt: {
    host: "mqtt://192.168.1.6",
    options: {
      port: 1883,
      username: "",
      password: "",
    },
  },
};
