import { connect } from 'mqtt/dist/mqtt'; // import connect from mqtt


const sendMqttMessageToDevice = (message: string, topic: string) => {
  const client = connect('mqtt://broker.hivemq.com:8000/mqtt', {
    port: 8000,
    protocol: 'mqtt',
    will: {
      qos: 2,
      topic: topic,
      payload: "IDLE",
      retain: true
    },
  });

  client.on('connect', () => {
    console.log('Connected to MQTT Broker');
    client.subscribe(topic, {qos: 2}, (err) => {
      if (!err) {
        client.publish(topic, message, {qos: 2, retain: true});
      }
    });
  });


  // eslint-disable-next-line no-console
  console.log('Connecting to MQTT broker');
};

export default sendMqttMessageToDevice;
