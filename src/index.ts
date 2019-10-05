require("@babel/polyfill");
import { wait } from "./util/wait";
import callbackify from "./util/callbackify";

let Service: any, Characteristic: any;

const switchType: string     = "switch";
const blindType: string      = "blind";
const garagedoorType: string = "garagedoor";
const lightbulbType: string  = "lightbulb";

export default function(homebridge: any) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-logo-ts", "Logo-TS", LogoAccessory);
}

class LogoAccessory {
  // From config.
  log: Function;
  name: string;
  interface: string;
  ip: string;
  port: string;
  localTSAP: number;
  remoteTSAP: number;
  type: string;

  // Services exposed.
  switchService: any;
  blindService: any;
  garagedoorService: any;
  lightbulbService: any;

  constructor(log, config) {
    this.log        = log;
    this.name       = config["name"];
    this.interface  = config["interface"]  || "modbus";
    this.ip         = config["ip"];
    this.port       = config["port"]       || 505;
    this.localTSAP  = config["localTSAP"]  || 0x1200;
    this.remoteTSAP = config["remoteTSAP"] || 0x2200;
    this.type       = config["type"]       || switchType;

    //
    // LOGO Switch Service
    //

    if (this.type == switchType) {
      
      const switchService = new Service.Switch(
        this.name,
        "switch",
      );

      switchService
        .getCharacteristic(Characteristic.On)
        .on("get", callbackify(this.getSwitchOn))
        .on("set", callbackify(this.setSwitchOn));

      this.switchService = switchService;

    }

    //
    // LOGO Blind Service
    //

    if (this.type == blindType) {
      
      const blindService = new Service.WindowCovering(
        this.name,
        "blind",
      );

      blindService
        .getCharacteristic(Characteristic.CurrentPosition)
        .on("get", callbackify(this.getBlindCurrentPosition));

      blindService
        .getCharacteristic(Characteristic.TargetPosition)
        .on("get", callbackify(this.getBlindTargetPosition))
        .on("set", callbackify(this.setBlindTargetPosition));

      blindService
        .getCharacteristic(Characteristic.PositionState)
        .on("get", callbackify(this.getBlindPositionState));

      this.blindService = blindService;

    }

    //
    // LOGO GarageDoor Service
    //

    if (this.type == garagedoorType) {
      
      const garagedoorService = new Service.GarageDoorOpener(
        this.name,
        "garagedoor",
      );

      garagedoorService
        .getCharacteristic(Characteristic.CurrentDoorState)
        .on("get", callbackify(this.getGarageDoorCurrentDoorState));

      garagedoorService
        .getCharacteristic(Characteristic.TargetDoorState)
        .on("get", callbackify(this.getGarageDoorTargetDoorState))
        .on("set", callbackify(this.setGarageDoorTargetDoorState));

      garagedoorService
        .getCharacteristic(Characteristic.ObstructionDetected)
        .on("get", callbackify(this.getGarageDoorObstructionDetected));

      this.garagedoorService = garagedoorService;

    }

    //
    // LOGO LightBulb Service
    //

    if (this.type == lightbulbType) {
      
      const lightbulbService = new Service.Switch(
        this.name,
        "lightbulb",
      );

      lightbulbService
        .getCharacteristic(Characteristic.On)
        .on("get", callbackify(this.getLightbulbOn))
        .on("set", callbackify(this.setLightbulbOn));

      lightbulbService
        .getCharacteristic(Characteristic.Brightness)
        .on("get", callbackify(this.getLightbulbBrightness))
        .on("set", callbackify(this.setLightbulbBrightness));

      this.lightbulbService = lightbulbService;

    }

  }

  getServices() {
    if (this.type == blindType) {
      return [ this.blindService ];
    } else if (this.type == garagedoorType) {
      return [ this.garagedoorService ];
    } else if (this.type == lightbulbType) {
      return [ this.lightbulbService ];
    } else {
      return [ this.switchService ];
    }
  }

  //
  // LOGO Switch Service
  //

  getSwitchOn = async () => {
    // const return = await logoFunctionToGetOnOrOff();

    const on = true;

    this.log("Switch ?", on);
    return on;
  };

  setSwitchOn = async (on: boolean) => {
    this.log("Set switch to", on);

    if (on) {
      // await logoFunctionToSetOn();
    } else {
      // await logoFunctionToSetOff();
    }
  };

  //
  // LOGO Blind Service
  //

  getBlindCurrentPosition = async () => {
    // const return = await logoFunctionToGetOnOrOff();

    const pos = 100;

    this.log("BlindCurrentPosition ?", pos);
    return pos;
  };

  getBlindTargetPosition = async () => {
    // const return = await logoFunctionToGetOnOrOff();

    const pos = 100;

    this.log("BlindTargetPosition ?", pos);
    return pos;
  };

  setBlindTargetPosition = async (pos: number) => {
    this.log("Set BlindTargetPosition to", pos);

    // await logoFunctionToSetOff();

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    this.blindService.setCharacteristic(
      Characteristic.CurrentPosition,
      pos
    );

  };

  getBlindPositionState = async () => {
    // 0 - decreasing; 1 - increasing; 2 - stopped

    // const return = await logoFunctionToGetOnOrOff();

    const state = 0;

    this.log("BlindPositionState ?", state);
    return state;
  };

  //
  // LOGO GarageDoor Service
  //

  getGarageDoorCurrentDoorState = async () => {
    // 0 - open; 1 - closed; 2 - opening; 3 - closing; 4 - stopped

    // const return = await logoFunctionToGetOnOrOff();

    const state = 1;

    this.log("GarageDoorCurrentDoorState ?", state);
    return state;
  };

  getGarageDoorTargetDoorState = async () => {
    // 0 - open; 1 - closed

    // const return = await logoFunctionToGetOnOrOff();

    const state = 1;

    this.log("GarageDoorTargetDoorState ?", state);
    return state;
  };

  setGarageDoorTargetDoorState = async (state: number) => {
    this.log("Set GarageDoorTargetDoorState to", state);

    // await logoFunctionToSetOff();

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    this.garagedoorService.setCharacteristic(
      Characteristic.CurrentDoorState,
      state
    );
  };

  getGarageDoorObstructionDetected = async () => {
    // const return = await logoFunctionToGetOnOrOff();

    const state = false;

    this.log("GarageDoorObstructionDetected ?", state);
    return state;
  };

  //
  // LOGO LightBulb Service
  //

  getLightbulbOn = async () => {
    // const return = await logoFunctionToGetOnOrOff();

    const on = true;

    this.log("Lightbulb ?", on);
    return on;
  };

  setLightbulbOn = async (on: boolean) => {
    this.log("Set Lightbulb to", on);

    if (on) {
      // await logoFunctionToSetOn();
    } else {
      // await logoFunctionToSetOff();
    }
  };

  getLightbulbBrightness = async () => {
    // const return = await logoFunctionToGetOnOrOff();

    const pos = 100;

    this.log("BlindTargetPosition ?", pos);
    return pos;
  };

  setLightbulbBrightness = async (pos: number) => {
    this.log("Set BlindTargetPosition to", pos);

    // await logoFunctionToSetOff();
  };

}
