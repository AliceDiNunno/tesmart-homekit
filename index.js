const hap = require("hap-nodejs");

const Accessory = hap.Accessory;
const Characteristic = hap.Characteristic;
const CharacteristicEventTypes = hap.CharacteristicEventTypes;
const Service = hap.Service;

const switchIp = "10.10.10.2"
const switchPort = "5000"

const televisionAccessory = new Accessory('Television', hap.uuid.generate('Television'));
televisionAccessory.category = hap.Categories.TELEVISION;
const televisionService = new Service.Television('television');

const televisionOnCharacteristic = new Characteristic.On('On');

televisionOnCharacteristic.setProps({
    format: Characteristic.Formats.BOOL,
    perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
});

televisionOnCharacteristic.on(CharacteristicEventTypes.GET, (callback) => {
    console.log('GET On');
    callback(undefined, televisionOnCharacteristic.value);
})

televisionOnCharacteristic.on(CharacteristicEventTypes.SET, (value, callback) => {
    console.log('SET On to', value);
    televisionOnCharacteristic.value = value;
    callback();
})

televisionService.addCharacteristic(televisionOnCharacteristic);

televisionAccessory.addService(televisionService)
var net = require('net');

televisionService.getCharacteristic(Characteristic.ActiveIdentifier).on(CharacteristicEventTypes.SET, (value, callback) => {
    console.log('SET RemoteKey to', value);

    var trame = [0xAA, 0xBB, 0x03, 0x01, value + 1, 0xEE]

    var client = new net.Socket();
    client.connect(switchPort, switchIp, function () {
        hexVal = new Uint8Array(trame);
        client.write(hexVal);
        client.end();
    });
    
    callback();
})

//add 8 hdmi inputs

for (let i = 0; i < 8; i++) {
    const inputHDMI1 = televisionAccessory.addService(Service.InputSource, "hdmi" + i, "HDMI " + i);

    inputHDMI1
        .setCharacteristic(Characteristic.Identifier, i)
        .setCharacteristic(Characteristic.ConfiguredName, "HDMI" + i)
        .setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED)
        .setCharacteristic(Characteristic.InputSourceType, Characteristic.InputSourceType.HDMI);

    inputHDMI1.on(CharacteristicEventTypes.GET, (callback) => {
        console.log('GET InputSource');
        callback(undefined, inputHDMI1.value);
    })

    inputHDMI1.on(CharacteristicEventTypes.SET, (value, callback) => {
        console.log('SET InputSource to', value);
        inputHDMI1.value = value;
        callback();
    })

    televisionService.addLinkedService(inputHDMI1);
}


televisionAccessory.publish({
    username: "DA:33:3D:E3:CE:00", port: 51826, pincode: "000-00-001", category: hap.Categories.TELEVISION /* BRIDGE */
}).then(r => {
    console.log("Published:", r);
}).catch(e => {
    console.log("Error:", e);
});