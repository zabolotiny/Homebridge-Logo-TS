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

  blindSetPos: string;
  blindGetPos: string;
  blindGetState: string;
  blindDigital: number;
  blindSetUp: string;
  blindSetDown: string;
  blindGetUpDown: string;
  blindValue: number;
  blindPushButton: number;

  garagedoorOpen: string;
  garagedoorClose: string;
  garagedoorState: string;
  garagedoorValue: number;
  garagedoorPushButton: number;

  // Runtime state.
  logo: any;
  lastBlindTargetPos: number;
  lastBlindTargetPosTime: number;
  lastBlindTargetPosTimerSet: boolean;
  lastGaragedoorTargetState: number;
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

    if (this.interface == modbusInterface) {
      this.logo = new ModBusLogo(this.ip, this.port);
    } else {
      this.logo = new Snap7Logo(this.logoType, this.ip, this.localTSAP, this.remoteTSAP);
    }

    this.lastBlindTargetPos                    = -1;
    this.lastBlindTargetPosTime                = -1;
    this.lastBlindTargetPosTimerSet            = false;
    this.lastGaragedoorTargetState             = -1;
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

    this.switchGet        = config["switchGet"]        || "Q1";
    this.switchSetOn      = config["switchSetOn"]      || "V2.0";
    this.switchSetOff     = config["switchSetOff"]     || "V3.0";
    this.switchValue      = config["switchValue"]      || 1;
    this.switchPushButton = config["switchPushButton"] || 1;

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

    this.blindSetPos     = config["blindSetPos"]     || "VW50";
    this.blindGetPos     = config["blindGetPos"]     || "VW52";
    this.blindGetState   = config["blindGetState"]   || "VW54";
    this.blindDigital    = config["blindDigital"]    || 0;
    this.blindSetUp      = config["blindSetUp"]      || "V5.0";
    this.blindSetDown    = config["blindSetDown"]    || "V5.1";
    this.blindGetUpDown  = config["blindGetUpDown"]  || "V5.2";
    this.blindValue      = config["blindValue"]      || 1;
    this.blindPushButton = config["blindPushButton"] || 1;

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

    this.garagedoorOpen       = config["garagedoorOpen"]       || "V6.0";
    this.garagedoorClose      = config["garagedoorClose"]      || "V6.1";
    this.garagedoorState      = config["garagedoorState"]      || "V6.2";
    this.garagedoorValue      = config["garagedoorValue"]      || 1;
    this.garagedoorPushButton = config["garagedoorPushButton"] || 1;

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

    if (!this.blindDigital) {

      this.logo.ReadLogo(this.blindGetPos, async (value: number) => {

        const pos = 100 - value;
        this.log("BlindCurrentPosition ?", pos);
  
        await wait(1);
        
        this.blindService.updateCharacteristic(
          Characteristic.CurrentPosition,
          pos
        );
  
      });
      
    } else {

      this.logo.ReadLogo(this.blindGetUpDown, async (value: number) => {

        const pos = value == 1 ? 100 : 0;
        this.log("BlindCurrentPosition ?", pos);
  
        await wait(1);
        
        this.blindService.updateCharacteristic(
          Characteristic.CurrentPosition,
          pos
        );
  
      });
      
    }

  };

  getBlindTargetPosition = async () => {

    this.log("BlindTargetPosition ?", this.lastBlindTargetPos);
    if (this.lastBlindTargetPos != -1) {
      return this.lastBlindTargetPos;
    } else {
      return 100;
    }

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
    // 0 - DECREASING; 1 - INCREASING; 2 - STOPPED

    if (!this.blindDigital) {

      this.logo.ReadLogo(this.blindGetState, async (value: number) => {

        const state = this.blindLogoStateToHomebridgeState(value);
        this.log("BlindPositionState ?", state);
  
        await wait(1);
        
        this.blindService.updateCharacteristic(
          Characteristic.PositionState,
          state
        );
  
      });
      
    } else {

      this.log("BlindPositionState ? 2");
      return 2;
      
    }

  };

  //
  // LOGO GarageDoor Service
  //

  getGarageDoorCurrentDoorState = async () => {
    // 0 - OPEN; 1 - CLOSED; 2 - OPENING; 3 - CLOSING; 4 - STOPPED

    this.logo.ReadLogo(this.garagedoorState, async (value: number) => {
      // Logo return 1 for OPEN!

      const state = value == 1 ? 0 : 1;
      this.log("GarageDoorCurrentDoorState ?", state);

      await wait(1);
      
      this.garagedoorService.updateCharacteristic(
        Characteristic.CurrentDoorState,
        state
      );

    });
  };

  getGarageDoorTargetDoorState = async () => {
    // 0 - OPEN; 1 - CLOSED

    this.log("GarageDoorTargetDoorState ?", this.lastGaragedoorTargetState);
    if (this.lastGaragedoorTargetState != -1) {
      return this.lastGaragedoorTargetState;
    } else {
      return 1;
    }
  
  };

  setGarageDoorTargetDoorState = async (state: number) => {
    // 0 - OPEN; 1 - CLOSED

    this.log("Set GarageDoorTargetDoorState to", state);
    this.lastGaragedoorTargetState = state;

    if (state == 0) {
      this.logo.WriteLogo(this.garagedoorOpen, this.garagedoorValue, this.garagedoorPushButton);
    } else {
      this.logo.WriteLogo(this.garagedoorClose, this.garagedoorValue, this.garagedoorPushButton);
    }

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
    // true or false

    this.log("GarageDoorObstructionDetected ?", false);
    return false;
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

          if (!this.blindDigital) {
            
            this.logo.WriteLogo(this.blindSetPos, (100 - this.lastBlindTargetPos), 0);

          } else {

            if (this.lastBlindTargetPos >= 50) {
              this.logo.WriteLogo(this.blindSetUp, this.blindValue, this.blindPushButton);
            } else {
              this.logo.WriteLogo(this.blindSetDown, this.blindValue, this.blindPushButton);
            }
            
          }

        } else {

          this.lastBlindTargetPosTimerSet = true;
          this.blindTargetPositionTimeout();
        }

    }, 100);
  }

  blindLogoStateToHomebridgeState(value: number): number {
    if (value == 0) {        // Logo Stop
      return 2;              // Homebridge STOPPED
    } else if (value == 1) { // Logo Up
      return 0;              // Homebridge DECREASING
    } else if (value == 2) { // Logo Down
      return 1;              // Homebridge INCREASING
    } else {
      return 2;              // Homebridge STOPPED
    }
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
