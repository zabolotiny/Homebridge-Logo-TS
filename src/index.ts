import { wait } from "./util/wait";
import callbackify from "./util/callbackify";

import { ModBusLogo } from "./util/modbus-logo";
import { Snap7Logo } from "./util/snap7-logo";

const pjson   = require('../package.json');

let Service: any, Characteristic: any;

const modbusInterface: string = "modbus";
const snap7Interface: string  = "snap7";

const logoType0BA7: string = "0BA7"
const logoType0BA8: string = "0BA8"
const logoType8SF4: string = "8.SF4"

const switchType: string     = "switch";
const blindType: string      = "blind";
const garagedoorType: string = "garagedoor";
const lightbulbType: string  = "lightbulb";

const accessoryAnalogTimeOut = 500;

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
  port: number;
  logoType: string;
  localTSAP: number;
  remoteTSAP: number;
  type: string;

  switchGet: string;
  switchSetOn: string;
  switchSetOff: string;
  switchValue: number;
  switchPushButton: number;

  // Runtime state.
  logo: any;
  lastBlindTargetPos: number;
  lastBlindTargetPosTime: number;
  lastBlindTargetPosTimerSet: boolean;
  lastLightbulbOn: number;
  lastLightbulbTargetBrightness: number;
  lastLightbulbTargetBrightnessTime: number;
  lastLightbulbTargetBrightnessTimerSet: boolean;

  // Services exposed.
  switchService: any;
  blindService: any;
  garagedoorService: any;
  lightbulbService: any;

  constructor(log: any, config: any) {
    this.log        = log;
    this.name       =           config["name"];
    this.interface  =           config["interface"]       || modbusInterface;
    this.ip         =           config["ip"];
    this.port       =           config["port"]            || 505;
    this.logoType   =           config["logoType"]        || logoType8SF4;
    this.localTSAP  = parseInt( config["localTSAP"], 16)  || 0x1200;
    this.remoteTSAP = parseInt( config["remoteTSAP"], 16) || 0x2200;
    this.type       =           config["type"]            || switchType;

    this.switchGet        = config["switchGet"]        || "Q1";
    this.switchSetOn      = config["switchSetOn"]      || "V2.0";
    this.switchSetOff     = config["switchSetOff"]     || "V3.0";
    this.switchValue      = config["switchValue"]      || 1;
    this.switchPushButton = config["switchPushButton"] || 1;

    if (this.interface == modbusInterface) {
      this.logo = new ModBusLogo(this.ip, this.port);
    } else {
      this.logo = new Snap7Logo(this.logoType, this.ip, this.localTSAP, this.remoteTSAP);
    }

    this.lastBlindTargetPos                    = -1;
    this.lastBlindTargetPosTime                = -1;
    this.lastBlindTargetPosTimerSet            = false;
    this.lastLightbulbOn                       = -1;
    this.lastLightbulbTargetBrightness         = -1;
    this.lastLightbulbTargetBrightnessTime     = -1;
    this.lastLightbulbTargetBrightnessTimerSet = false;

    // Characteristic "Manufacturer"      --> pjson.author.name 
    // Characteristic "Model"             --> this.type
    // Characteristic "Firmware Revision" --> pjson.version
    // Characteristic "Hardware Revision" --> this.logoType
    // Characteristic "Serial Number"     --> "0xDEADBEEF"
    // Characteristic "Version"

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
      
      const lightbulbService = new Service.Lightbulb(
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

    this.logo.ReadLogo(this.switchGet, async (value: number) => {

      const on = value == 1 ? true : false;
      this.log("Switch ?", on);

      await wait(1);
      
      this.switchService.updateCharacteristic(
        Characteristic.On,
        on
      );

    });

  };

  setSwitchOn = async (on: boolean) => {
    this.log("Set switch to", on);

    if (on) {
      this.logo.WriteLogo(this.switchSetOn, this.switchValue, this.switchPushButton);
    } else {
      this.logo.WriteLogo(this.switchSetOff, this.switchValue, this.switchPushButton);
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

    this.lastBlindTargetPos = pos;
    this.lastBlindTargetPosTime = + new Date();
    if (!this.lastBlindTargetPosTimerSet) {
      this.blindTargetPositionTimeout();
    }

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

    let new_on: number = on ? 1 : 0;

    if ((this.lastLightbulbOn == -1) || (this.lastLightbulbOn != new_on)) {
      
      this.log("Set Lightbulb to", on);
      this.lastLightbulbOn = new_on;

      if (on) {
        // await logoFunctionToSetOn();
      } else {
        // await logoFunctionToSetOff();
      }

    }

  };

  getLightbulbBrightness = async () => {
    // const return = await logoFunctionToGetOnOrOff();

    const bright = 100;

    this.log("LightbulbBrightness ?", bright);
    return bright;
  };

  setLightbulbBrightness = async (bright: number) => {

    this.lastLightbulbTargetBrightness = bright;
    this.lastLightbulbTargetBrightnessTime = + new Date();
    if (!this.lastLightbulbTargetBrightnessTimerSet) {
      this.lightbulbTargetBrightnessTimeout();
    }

  };

  //
  // Helper Functions
  //

  blindTargetPositionTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastBlindTargetPosTime + accessoryAnalogTimeOut)) || (this.lastBlindTargetPos == 0) || (this.lastBlindTargetPos == 100)) {

          this.log("Set BlindTargetPosition to", this.lastBlindTargetPos);
          this.lastBlindTargetPosTimerSet = false;

          // await logoFunctionToSetOff();

        } else {

          this.lastBlindTargetPosTimerSet = true;
          this.blindTargetPositionTimeout();
        }

    }, 100);
  }

  lightbulbTargetBrightnessTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastLightbulbTargetBrightnessTime + accessoryAnalogTimeOut)) || (this.lastLightbulbTargetBrightness == 0) || (this.lastLightbulbTargetBrightness == 100)) {

          this.log("Set LightbulbTargetBrightness to", this.lastLightbulbTargetBrightness);
          this.lastLightbulbTargetBrightnessTimerSet = false;

          // await logoFunctionToSetOff();

        } else {

          this.lastLightbulbTargetBrightnessTimerSet = true;
          this.lightbulbTargetBrightnessTimeout();
        }
        
    }, 100);
  }

}
