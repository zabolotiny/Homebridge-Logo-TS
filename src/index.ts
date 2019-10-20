import { wait } from "./util/wait";
import callbackify from "./util/callbackify";

import { ModBusLogo } from "./util/modbus-logo";
import { Snap7Logo } from "./util/snap7-logo";


import { SwitchAccessory } from "./util/accessories/SwitchAccessory"


import { LightSensor } from "./util/accessories/LightSensor"
import { MotionSensor } from "./util/accessories/MotionSensor"
import { ContactSensor } from "./util/accessories/ContactSensor"
import { TemperatureSensor } from "./util/accessories/TemperatureSensor"
import { HumiditySensor } from "./util/accessories/HumiditySensor"
import { CarbonDioxideSensor } from "./util/accessories/CarbonDioxideSensor"
import { AirQualitySensor } from "./util/accessories/AirQualitySensor";

const pjson   = require('../package.json');

let Service: any, Characteristic: any;

const modbusInterface: string = "modbus";
const snap7Interface: string  = "snap7";

const logoType0BA7: string = "0BA7"
const logoType0BA8: string = "0BA8"
const logoType8SF4: string = "8.SF4"

const blindType: string               = "blind";
const garagedoorType: string          = "garagedoor";
const lightbulbType: string           = "lightbulb";


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
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  type: string;

  blindSetPos: string;
  blindGetPos: string;
  blindGetState: string;
  blindDigital: number;
  blindSetUp: string;
  blindSetDown: string;
  blindGetUpDown: string;

  garagedoorOpen: string;
  garagedoorClose: string;
  garagedoorState: string;

  lightbulbSetOn: string;
  lightbulbSetOff: string;
  lightbulbSetBrightness: string;
  lightbulbGetBrightness: string;
  

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
  
  updateTimer: any;

  // Services exposed.
  
  blindService: any;
  garagedoorService: any;
  lightbulbService: any;


  switchService:              any;

  lightSensorService:         any;
  motionSensorService:        any;
  contactSensorService:       any;
  temperatureSensorService:   any;
  humiditySensorService:      any;
  carbonDioxideSensorService: any;
  airQualitySensorService:    any;

  switchAccessory:     SwitchAccessory     | undefined;
  
  lightSensor:         LightSensor         | undefined;
  motionSensor:        MotionSensor        | undefined;
  contactSensor:       ContactSensor       | undefined;
  temperatureSensor:   TemperatureSensor   | undefined;
  humiditySensor:      HumiditySensor      | undefined;
  carbonDioxideSensor: CarbonDioxideSensor | undefined;
  airQualitySensor:    AirQualitySensor    | undefined;

  constructor(log: any, config: any) {
    this.log            = log;
    this.name           =           config["name"];
    this.interface      =           config["interface"]       || modbusInterface;
    this.ip             =           config["ip"];
    this.port           =           config["port"]            || 505;
    this.logoType       =           config["logoType"]        || logoType8SF4;
    this.localTSAP      = parseInt( config["localTSAP"], 16)  || 0x1200;
    this.remoteTSAP     = parseInt( config["remoteTSAP"], 16) || 0x2200;
    this.updateInterval =           config["updateInterval"]  || 0;
    this.buttonValue    =           config["buttonValue"]     || 1;
    this.pushButton     =           config["pushButton"]      || 1;
    this.debugMsgLog    =           config["debugMsgLog"]     || 0;
    this.type           =           config["type"]            || SwitchAccessory.switchType;

    if (this.interface == modbusInterface) {
      this.logo = new ModBusLogo(this.ip, this.port, this.debugMsgLog, this.log);
    } else {
      this.logo = new Snap7Logo(this.logoType, this.ip, this.localTSAP, this.remoteTSAP, this.debugMsgLog, this.log);
    }

    if (this.updateInterval > 0) {
      if (this.type == blindType) {
        this.blindAutoUpdate();
      }
      if (this.type == garagedoorType) {
        this.garagedoorAutoUpdate();
      }
      if (this.type == lightbulbType) {
        this.lightbulbAutoUpdate();
      }
   
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
    // LOGO! Switch Service
    //

    if (this.type == SwitchAccessory.switchType) {

      this.switchAccessory = new SwitchAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const switchService = new Service.Switch(
        this.name,
        SwitchAccessory.switchType,
      );

      switchService
        .getCharacteristic(Characteristic.On)
        .on("get", callbackify(this.switchAccessory.getSwitchOn))
        .on("set", callbackify(this.switchAccessory.setSwitchOn));

      this.switchService = switchService;

      this.switchAccessory.switchService = this.switchService;
      this.switchAccessory.switchGet     = config["switchGet"]    || "Q1";
      this.switchAccessory.switchSetOn   = config["switchSetOn"]  || "V2.0";
      this.switchAccessory.switchSetOff  = config["switchSetOff"] || "V3.0";

    }

    //
    // LOGO! Blind Service
    //

    this.blindSetPos     = config["blindSetPos"]    || "VW50";
    this.blindGetPos     = config["blindGetPos"]    || "VW52";
    this.blindGetState   = config["blindGetState"]  || "VW54";
    this.blindDigital    = config["blindDigital"]   || 0;
    this.blindSetUp      = config["blindSetUp"]     || "V5.0";
    this.blindSetDown    = config["blindSetDown"]   || "V5.1";
    this.blindGetUpDown  = config["blindGetUpDown"] || "V5.2";

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
    // LOGO! GarageDoor Service
    //

    this.garagedoorOpen       = config["garagedoorOpen"]  || "V6.0";
    this.garagedoorClose      = config["garagedoorClose"] || "V6.1";
    this.garagedoorState      = config["garagedoorState"] || "V6.2";

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
    // LOGO! LightBulb Service
    //

    this.lightbulbSetOn         = config["lightbulbSetOn"]         || "V7.0";
    this.lightbulbSetOff        = config["lightbulbSetOff"]        || "V7.1";
    this.lightbulbSetBrightness = config["lightbulbSetBrightness"] || "VW70";
    this.lightbulbGetBrightness = config["lightbulbGetBrightness"] || "VW72";

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

    //
    // LOGO! Light Sensor Service
    //

    if (this.type == LightSensor.lightSensorType) {

      this.lightSensor = new LightSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const lightSensorService = new Service.LightSensor(
        this.name,
        LightSensor.lightSensorType,
      );

      lightSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.lightSensor.getStatusActive));

      lightSensorService
        .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .on("get", callbackify(this.lightSensor.getCurrentAmbientLightLevel));

      this.lightSensorService = lightSensorService;

      this.lightSensor.lightSensorService = this.lightSensorService;
      this.lightSensor.lightLevel         = config["lightLevel"] || "AM3";

    }

    //
    // LOGO! Motion Sensor Service
    //

    if (this.type == MotionSensor.motionSensorType) {

      this.motionSensor = new MotionSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const motionSensorService = new Service.MotionSensor(
        this.name,
        MotionSensor.motionSensorType,
      );

      motionSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.motionSensor.getStatusActive));

      motionSensorService
        .getCharacteristic(Characteristic.MotionDetected)
        .on("get", callbackify(this.motionSensor.getMotionDetected));

      this.motionSensorService = motionSensorService;

      this.motionSensor.motionSensorService = this.motionSensorService;
      this.motionSensor.motionDetected      = config["motionDetected"] || "M9";

    }

    //
    // LOGO! Contact Sensor Service
    //

    if (this.type == ContactSensor.contactSensorType) {

      this.contactSensor = new ContactSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const contactSensorService = new Service.ContactSensor(
        this.name,
        ContactSensor.contactSensorType,
      );

      contactSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.contactSensor.getStatusActive));

      contactSensorService
        .getCharacteristic(Characteristic.ContactSensorState)
        .on("get", callbackify(this.contactSensor.getContactSensorState));

      this.contactSensorService = contactSensorService;

      this.contactSensor.contactSensorService = this.contactSensorService;
      this.contactSensor.contactDetected      = config["contactDetected"] || "M15";

    }

    //
    // LOGO! Temperature Sensor Service
    //

    if (this.type == TemperatureSensor.temperatureSensorType) {

      this.temperatureSensor = new TemperatureSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const temperatureSensorService = new Service.TemperatureSensor(
        this.name,
        TemperatureSensor.temperatureSensorType,
      );

      temperatureSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.temperatureSensor.getStatusActive));

      temperatureSensorService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on("get", callbackify(this.temperatureSensor.getCurrentTemperature));

      this.temperatureSensorService = temperatureSensorService;

      this.temperatureSensor.temperatureSensorService = this.temperatureSensorService;
      this.temperatureSensor.temperature              = config["temperature"] || "AM2";

    }

    //
    // LOGO! Humidity Sensor Service
    //

    if (this.type == HumiditySensor.humiditySensorType) {

      this.humiditySensor = new HumiditySensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const humiditySensorService = new Service.HumiditySensor(
        this.name,
        HumiditySensor.humiditySensorType,
      );

      humiditySensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.humiditySensor.getStatusActive));

      humiditySensorService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on("get", callbackify(this.humiditySensor.getCurrentRelativeHumidity));

      this.humiditySensorService = humiditySensorService;

      this.humiditySensor.humiditySensorService = this.humiditySensorService;
      this.humiditySensor.humidity              = config["humidity"] || "AM1";

    }

    //
    // LOGO! Carbon Dioxide Sensor Service
    //
    // 1000ppm CO2 (CO2 in Air 0.04% = ~400ppm)

    if (this.type == CarbonDioxideSensor.carbonDioxideSensorType) {

      this.carbonDioxideSensor = new CarbonDioxideSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const carbonDioxideSensorService = new Service.CarbonDioxideSensor(
        this.name,
        CarbonDioxideSensor.carbonDioxideSensorType,
      );

      carbonDioxideSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.carbonDioxideSensor.getStatusActive));

      carbonDioxideSensorService
        .getCharacteristic(Characteristic.CarbonDioxideDetected)
        .on("get", callbackify(this.carbonDioxideSensor.getCarbonDioxideDetected));

      carbonDioxideSensorService
        .getCharacteristic(Characteristic.CarbonDioxideLevel)
        .on("get", callbackify(this.carbonDioxideSensor.getCarbonDioxideLevel));

      carbonDioxideSensorService
        .getCharacteristic(Characteristic.CarbonDioxidePeakLevel)
        .on("get", callbackify(this.carbonDioxideSensor.getCarbonDioxidePeakLevel));

      this.carbonDioxideSensorService = carbonDioxideSensorService;

      this.carbonDioxideSensor.carbonDioxideSensorService = this.carbonDioxideSensorService;
      this.carbonDioxideSensor.carbonDioxideLevel         = config["carbonDioxideLevel"] || "AM3";
      this.carbonDioxideSensor.carbonDioxideLimit         = config["carbonDioxideLimit"] || 1000;

    }

    //
    // LOGO! Air Quality Sensor Service
    //

    if (this.type == AirQualitySensor.airQualitySensorType) {

      this.airQualitySensor = new AirQualitySensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const airQualitySensorService = new Service.AirQualitySensor(
        this.name,
        AirQualitySensor.airQualitySensorType,
      );

      airQualitySensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.airQualitySensor.getStatusActive));

      airQualitySensorService
        .getCharacteristic(Characteristic.AirQuality)
        .on("get", callbackify(this.airQualitySensor.getAirQuality));

      airQualitySensorService
        .getCharacteristic(Characteristic.CarbonDioxideLevel)
        .on("get", callbackify(this.airQualitySensor.getCarbonDioxideLevel));

      this.airQualitySensorService = airQualitySensorService;

      this.airQualitySensor.airQualitySensorService = this.airQualitySensorService;
      this.airQualitySensor.carbonDioxideLevel      = config["carbonDioxideLevel"] || "AM3";

    }
  
  }

  getServices() {
    if (this.type == blindType) {
      return [ this.blindService ];

    } else if (this.type == garagedoorType) {
      return [ this.garagedoorService ];

    } else if (this.type == lightbulbType) {
      return [ this.lightbulbService ];

    } else if (this.type == LightSensor.lightSensorType) {
      return [ this.lightSensorService ];

    } else if (this.type == MotionSensor.motionSensorType) {
      return [ this.motionSensorService ];

    } else if (this.type == ContactSensor.contactSensorType) {
      return [ this.contactSensorService ];

    } else if (this.type == TemperatureSensor.temperatureSensorType) {
      return [ this.temperatureSensorService ];

    } else if (this.type == HumiditySensor.humiditySensorType) {
      return [ this.humiditySensorService ];

    } else if (this.type == CarbonDioxideSensor.carbonDioxideSensorType) {
      return [ this.carbonDioxideSensorService ];

    } else if (this.type == AirQualitySensor.airQualitySensorType) {
      return [ this.airQualitySensorService ];

    } else {
      return [ this.switchService ];
    }
  }

  //
  // LOGO! Blind Service
  //

  getBlindCurrentPosition = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    if (!this.blindDigital) {

      this.logo.ReadLogo(this.blindGetPos, async (value: number) => {

        if (value != -1) {

          let pos = 100 - value;
          pos = this.blindCurrentPositionIsNearTargetPosition(pos, this.lastBlindTargetPos);
          this.debugLogNum("BlindCurrentPosition ?", pos);

          await wait(1);

          this.blindService.updateCharacteristic(
            Characteristic.CurrentPosition,
            pos
          );

          await wait(1);

          this.blindService.updateCharacteristic(
            Characteristic.PositionState,
            2
          );

          if (pos != this.lastBlindTargetPos) {
            this.lastBlindTargetPos = pos;

            await wait(1);

            this.blindService.updateCharacteristic(
              Characteristic.TargetPosition,
              pos
            );
          }

        }

        if (this.updateInterval > 0) {
          this.blindAutoUpdate();
        }

      });

    } else {

      this.logo.ReadLogo(this.blindGetUpDown, async (value: number) => {

        if (value != -1) {

          const pos = value == 1 ? 100 : 0;
          this.debugLogNum("BlindCurrentPosition ?", pos);

          await wait(1);

          this.blindService.updateCharacteristic(
            Characteristic.CurrentPosition,
            pos
          );

          await wait(1);

          this.blindService.updateCharacteristic(
            Characteristic.PositionState,
            2
          );

        }

        if (this.updateInterval > 0) {
          this.blindAutoUpdate();
        }

      });

    }

  };

  getBlindTargetPosition = async () => {

    this.debugLogNum("BlindTargetPosition ?", this.lastBlindTargetPos);
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

        if (value != -1) {

          const state = this.blindLogoStateToHomebridgeState(value);
          this.debugLogNum("BlindPositionState ?", state);

          await wait(1);

          this.blindService.updateCharacteristic(
            Characteristic.PositionState,
            state
          );

        }

      });

    } else {

      this.debugLogNum("BlindPositionState ?", 2);
      return 2;

    }

  };

  //
  // LOGO! GarageDoor Service
  //

  getGarageDoorCurrentDoorState = async () => {
    // 0 - OPEN; 1 - CLOSED; 2 - OPENING; 3 - CLOSING; 4 - STOPPED

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.garagedoorState, async (value: number) => {
      // Logo return 1 for OPEN!

      if (value != -1) {

        const state = value == 1 ? 0 : 1;
        this.debugLogNum("GarageDoorCurrentDoorState ?", state);

        await wait(1);

        this.garagedoorService.updateCharacteristic(
          Characteristic.CurrentDoorState,
          state
        );

        if (state != this.lastGaragedoorTargetState) {
          this.lastGaragedoorTargetState = state;
          await wait(1);

          this.garagedoorService.updateCharacteristic(
            Characteristic.TargetDoorState,
            state
          );
        }

      }

      if (this.updateInterval > 0) {
        this.garagedoorAutoUpdate();
      }

    });

  };

  getGarageDoorTargetDoorState = async () => {
    // 0 - OPEN; 1 - CLOSED

    this.debugLogNum("GarageDoorTargetDoorState ?", this.lastGaragedoorTargetState);
    if (this.lastGaragedoorTargetState != -1) {
      return this.lastGaragedoorTargetState;
    } else {
      return 1;
    }

  };

  setGarageDoorTargetDoorState = async (state: number) => {
    // 0 - OPEN; 1 - CLOSED

    this.debugLogNum("Set GarageDoorTargetDoorState to", state);
    this.lastGaragedoorTargetState = state;

    if (state == 0) {
      this.logo.WriteLogo(this.garagedoorOpen, this.buttonValue, this.pushButton);
    } else {
      this.logo.WriteLogo(this.garagedoorClose, this.buttonValue, this.pushButton);
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

    this.debugLogBool("GarageDoorObstructionDetected ?", false);
    return false;
  };

  //
  // LOGO! LightBulb Service
  //

  getLightbulbOn = async () => {

    const on = this.lastLightbulbOn == 1 ? true : false;
    this.debugLogBool("Lightbulb ?", on);
    return on;

  };

  setLightbulbOn = async (on: boolean) => {

    let new_on: number = on ? 1 : 0;

    if ((this.lastLightbulbOn == -1) || (this.lastLightbulbOn != new_on)) {

      this.debugLogBool("Set Lightbulb to", on);
      this.lastLightbulbOn = new_on;

      if (on) {
        this.logo.WriteLogo(this.lightbulbSetOn, this.buttonValue, this.pushButton);
      } else {
        this.logo.WriteLogo(this.lightbulbSetOff, this.buttonValue, this.pushButton);
      }

    }

  };

  getLightbulbBrightness = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.lightbulbGetBrightness, async (value: number) => {

      if (value != -1) {

        this.debugLogNum("LightbulbBrightness ?", value);
        this.lastLightbulbOn = value > 0 ? 1 : 0;

        await wait(1);

        this.lightbulbService.updateCharacteristic(
          Characteristic.On,
          (value > 0 ? true : false)
        );

        await wait(1);

        this.lightbulbService.updateCharacteristic(
          Characteristic.Brightness,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.lightbulbAutoUpdate();
      }

    });

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

  debugLogNum(msg: string, num: number) {
    if (this.debugMsgLog == 1) {
      this.log(msg, num);
    }
  }
  debugLogBool(msg: string, bool: boolean) {
    if (this.debugMsgLog == 1) {
      this.log(msg, bool);
    }
  }

  blindTargetPositionTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastBlindTargetPosTime + accessoryAnalogTimeOut)) || (this.lastBlindTargetPos == 0) || (this.lastBlindTargetPos == 100)) {

          this.debugLogNum("Set BlindTargetPosition to", this.lastBlindTargetPos);
          this.lastBlindTargetPosTimerSet = false;

          if (!this.blindDigital) {

            this.logo.WriteLogo(this.blindSetPos, (100 - this.lastBlindTargetPos), 0);

          } else {

            if (this.lastBlindTargetPos >= 50) {
              this.logo.WriteLogo(this.blindSetUp, this.buttonValue, this.pushButton);
            } else {
              this.logo.WriteLogo(this.blindSetDown, this.buttonValue, this.pushButton);
            }

          }

        } else {

          this.lastBlindTargetPosTimerSet = true;
          this.blindTargetPositionTimeout();
        }

    }, 100);
  }

  blindLogoStateToHomebridgeState(value: number): number {
    if (value == 0) {        // LOGO! Stop
      return 2;              // Homebridge STOPPED
    } else if (value == 1) { // LOGO! Up
      return 0;              // Homebridge DECREASING
    } else if (value == 2) { // LOGO! Down
      return 1;              // Homebridge INCREASING
    } else {
      return 2;              // Homebridge STOPPED
    }
  }

  blindCurrentPositionIsNearTargetPosition(current: number, target: number) {
    if (target != -1) {
      const near = target - current;
      if ( (near >= -5) && (near <= 5) ) {
        return target;
      } else {
        return current;
      }
    } else {
      return current;
    }
  }

  lightbulbTargetBrightnessTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastLightbulbTargetBrightnessTime + accessoryAnalogTimeOut)) || (this.lastLightbulbTargetBrightness == 0) || (this.lastLightbulbTargetBrightness == 100)) {

          this.debugLogNum("Set LightbulbTargetBrightness to", this.lastLightbulbTargetBrightness);
          this.lastLightbulbTargetBrightnessTimerSet = false;

          this.logo.WriteLogo(this.lightbulbSetBrightness, this.lastLightbulbTargetBrightness, 0);

        } else {

          this.lastLightbulbTargetBrightnessTimerSet = true;
          this.lightbulbTargetBrightnessTimeout();
        }

    }, 100);
  }

  blindAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getBlindCurrentPosition();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  garagedoorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getGarageDoorCurrentDoorState();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  lightbulbAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getLightbulbBrightness();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}