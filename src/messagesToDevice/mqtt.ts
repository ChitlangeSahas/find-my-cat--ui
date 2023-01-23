import { connect } from 'mqtt/dist/mqtt'; // import connect from mqtt


const sendMqttMessageToDevice = (message: string, topic: string) => {
  const client = connect('wss://e35446e97a1043d7a302d4c8affe9014.s2.eu.hivemq.cloud', {
    port: 8884,
    protocol: 'mqtts',
    username: 'chitlangesahas',
    password: 'bdh8QGKZ3H#aZ2g',
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
