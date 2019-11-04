import { wait } from "./util/wait";
import callbackify from "./util/callbackify";

import { ModBusLogo } from "./util/modbus-logo";
import { Snap7Logo } from "./util/snap7-logo";

import { SwitchAccessory } from "./util/accessories/SwitchAccessory"
import { BlindAccessory } from "./util/accessories/BlindAccessory"
import { WindowAccessory } from "./util/accessories/WindowAccessory"
import { GaragedoorAccessory } from "./util/accessories/GaragedoorAccessory"
import { LightbulbAccessory } from "./util/accessories/LightbulbAccessory"
import { ThermostatAccessory } from "./util/accessories/ThermostatAccessory"
import { IrrigationSystemAccessory } from "./util/accessories/IrrigationSystemAccessory"
import { LightSensor } from "./util/accessories/LightSensor"
import { MotionSensor } from "./util/accessories/MotionSensor"
import { ContactSensor } from "./util/accessories/ContactSensor"
import { SmokeSensor } from "./util/accessories/SmokeSensor"
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

  // Runtime state.
  logo: any;

  // Services exposed.
  serviceToExpose:            any;

  switchAccessory:            SwitchAccessory            | undefined;
  blindAccessory:             BlindAccessory             | undefined;
  windowAccessory:            WindowAccessory            | undefined;
  garagedoorAccessory:        GaragedoorAccessory        | undefined;
  lightbulbAccessory:         LightbulbAccessory         | undefined;
  thermostatAccessory:        ThermostatAccessory        | undefined;
  irrigationSystemAccessory:  IrrigationSystemAccessory  | undefined;
  lightSensor:                LightSensor                | undefined;
  motionSensor:               MotionSensor               | undefined;
  contactSensor:              ContactSensor              | undefined;
  smokeSensor:                SmokeSensor                | undefined;
  temperatureSensor:          TemperatureSensor          | undefined;
  humiditySensor:             HumiditySensor             | undefined;
  carbonDioxideSensor:        CarbonDioxideSensor        | undefined;
  airQualitySensor:           AirQualitySensor           | undefined;

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

    // Characteristic "Manufacturer"      --> pjson.author.name
    // Characteristic "Model"             --> this.type
    // Characteristic "Firmware Revision" --> pjson.version
    // Characteristic "Hardware Revision" --> this.logoType
    // Characteristic "Serial Number"     --> "0xDEADBEEF"
    // Characteristic "Version"

    /************************
     * LOGO! Switch Service *
     ************************/

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

        this.serviceToExpose = switchService;

      this.switchAccessory.switchService = this.serviceToExpose;
      this.switchAccessory.switchGet     = config["switchGet"]    || "Q1";
      this.switchAccessory.switchSetOn   = config["switchSetOn"]  || "V2.0";
      this.switchAccessory.switchSetOff  = config["switchSetOff"] || "V3.0";

    }

    /***********************
     * LOGO! Blind Service *
     ***********************/

    if (this.type == BlindAccessory.blindType) {

      this.blindAccessory = new BlindAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const blindService = new Service.WindowCovering(
        this.name,
        BlindAccessory.blindType,
      );

      blindService
        .getCharacteristic(Characteristic.CurrentPosition)
        .on("get", callbackify(this.blindAccessory.getBlindCurrentPosition));

      blindService
        .getCharacteristic(Characteristic.TargetPosition)
        .on("get", callbackify(this.blindAccessory.getBlindTargetPosition))
        .on("set", callbackify(this.blindAccessory.setBlindTargetPosition));

      blindService
        .getCharacteristic(Characteristic.PositionState)
        .on("get", callbackify(this.blindAccessory.getBlindPositionState));

      this.serviceToExpose = blindService;

      this.blindAccessory.blindService    = this.serviceToExpose;
      this.blindAccessory.blindSetPos     = config["blindSetPos"]    || "VW50";
      this.blindAccessory.blindGetPos     = config["blindGetPos"]    || "VW52";
      this.blindAccessory.blindGetState   = config["blindGetState"]  || "VW54";
      this.blindAccessory.blindDigital    = config["blindDigital"]   || 0;
      this.blindAccessory.blindSetUp      = config["blindSetUp"]     || "V5.0";
      this.blindAccessory.blindSetDown    = config["blindSetDown"]   || "V5.1";
      this.blindAccessory.blindGetUpDown  = config["blindGetUpDown"] || "V5.2";

    }

    /************************
     * LOGO! Window Service *
     ************************/

    if (this.type == WindowAccessory.windowType) {

      this.windowAccessory = new WindowAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const windowService = new Service.Window(
        this.name,
        WindowAccessory.windowType,
      );

      windowService
        .getCharacteristic(Characteristic.CurrentPosition)
        .on("get", callbackify(this.windowAccessory.getWindowCurrentPosition));

      windowService
        .getCharacteristic(Characteristic.TargetPosition)
        .on("get", callbackify(this.windowAccessory.getWindowTargetPosition))
        .on("set", callbackify(this.windowAccessory.setWindowTargetPosition));

      windowService
        .getCharacteristic(Characteristic.PositionState)
        .on("get", callbackify(this.windowAccessory.getWindowPositionState));

      this.serviceToExpose = windowService;

      this.windowAccessory.windowService    = this.serviceToExpose;
      this.windowAccessory.windowSetPos     = config["windowSetPos"]    || "VW50";
      this.windowAccessory.windowGetPos     = config["windowGetPos"]    || "VW52";
      this.windowAccessory.windowGetState   = config["windowGetState"]  || "VW54";
      this.windowAccessory.windowDigital    = config["windowDigital"]   || 0;
      this.windowAccessory.windowSetUp      = config["windowSetUp"]     || "V5.0";
      this.windowAccessory.windowSetDown    = config["windowSetDown"]   || "V5.1";
      this.windowAccessory.windowGetUpDown  = config["windowGetUpDown"] || "V5.2";

    }

    /****************************
     * LOGO! GarageDoor Service *
     ****************************/

    if (this.type == GaragedoorAccessory.garagedoorType) {

      this.garagedoorAccessory = new GaragedoorAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const garagedoorService = new Service.GarageDoorOpener(
        this.name,
        GaragedoorAccessory.garagedoorType,
      );

      garagedoorService
        .getCharacteristic(Characteristic.CurrentDoorState)
        .on("get", callbackify(this.garagedoorAccessory.getGarageDoorCurrentDoorState));

      garagedoorService
        .getCharacteristic(Characteristic.TargetDoorState)
        .on("get", callbackify(this.garagedoorAccessory.getGarageDoorTargetDoorState))
        .on("set", callbackify(this.garagedoorAccessory.setGarageDoorTargetDoorState));

      garagedoorService
        .getCharacteristic(Characteristic.ObstructionDetected)
        .on("get", callbackify(this.garagedoorAccessory.getGarageDoorObstructionDetected));

      this.serviceToExpose = garagedoorService;

      this.garagedoorAccessory.garagedoorService = this.serviceToExpose;
      this.garagedoorAccessory.garagedoorOpen    = config["garagedoorOpen"]  || "V6.0";
      this.garagedoorAccessory.garagedoorClose   = config["garagedoorClose"] || "V6.1";
      this.garagedoorAccessory.garagedoorState   = config["garagedoorState"] || "V6.2";

    }

    /***************************
     * LOGO! LightBulb Service *
     ***************************/

    if (this.type == LightbulbAccessory.lightbulbType) {

      this.lightbulbAccessory = new LightbulbAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const lightbulbService = new Service.Lightbulb(
        this.name,
        LightbulbAccessory.lightbulbType,
      );

      lightbulbService
        .getCharacteristic(Characteristic.On)
        .on("get", callbackify(this.lightbulbAccessory.getLightbulbOn))
        .on("set", callbackify(this.lightbulbAccessory.setLightbulbOn));

      lightbulbService
        .getCharacteristic(Characteristic.Brightness)
        .on("get", callbackify(this.lightbulbAccessory.getLightbulbBrightness))
        .on("set", callbackify(this.lightbulbAccessory.setLightbulbBrightness));

      this.serviceToExpose = lightbulbService;

      this.lightbulbAccessory.lightbulbService       = this.serviceToExpose;
      this.lightbulbAccessory.lightbulbSetOn         = config["lightbulbSetOn"]         || "V7.0";
      this.lightbulbAccessory.lightbulbSetOff        = config["lightbulbSetOff"]        || "V7.1";
      this.lightbulbAccessory.lightbulbSetBrightness = config["lightbulbSetBrightness"] || "VW70";
      this.lightbulbAccessory.lightbulbGetBrightness = config["lightbulbGetBrightness"] || "VW72";

    }

    /****************************
     * LOGO! Thermostat Service *
     ****************************/

    if (this.type == ThermostatAccessory.thermostatType) {

      this.thermostatAccessory = new ThermostatAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const thermostatService = new Service.Thermostat(
        this.name,
        ThermostatAccessory.thermostatType,
      );

      thermostatService
        .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
        .on("get", callbackify(this.thermostatAccessory.getCurrentHeatingCoolingState));

      thermostatService
        .getCharacteristic(Characteristic.TargetHeatingCoolingState)
        .on("get", callbackify(this.thermostatAccessory.getTargetHeatingCoolingState))
        .on("set", callbackify(this.thermostatAccessory.setTargetHeatingCoolingState));

      thermostatService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on("get", callbackify(this.thermostatAccessory.getCurrentTemperature));

      thermostatService
        .getCharacteristic(Characteristic.TargetTemperature)
        .on("get", callbackify(this.thermostatAccessory.getTargetTemperature))
        .on("set", callbackify(this.thermostatAccessory.setTargetTemperature));

      thermostatService
        .getCharacteristic(Characteristic.TemperatureDisplayUnits)
        .on("get", callbackify(this.thermostatAccessory.getTemperatureDisplayUnits));

      this.serviceToExpose = thermostatService;

      this.thermostatAccessory.thermostatService          = this.serviceToExpose;
      this.thermostatAccessory.thermostatGetHCState       = config["thermostatGetHCState"]       || "VW211";
      this.thermostatAccessory.thermostatSetHCState       = config["thermostatSetHCState"]       || "VW201";
      this.thermostatAccessory.thermostatGetTemp          = config["thermostatGetTemp"]          || "VW213";
      this.thermostatAccessory.thermostatGetTargetTemp    = config["thermostatGetTargetTemp"]    || "VW215";
      this.thermostatAccessory.thermostatSetTargetTemp    = config["thermostatSetTargetTemp"]    || "VW203";
      this.thermostatAccessory.thermostatTempDisplayUnits = config["thermostatTempDisplayUnits"] || 0;

    }

    /**********************************
     * LOGO! IrrigationSystem Service *
     **********************************/

    if (this.type == IrrigationSystemAccessory.irrigationSystemType) {

      this.irrigationSystemAccessory = new IrrigationSystemAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const irrigationSystemService = new Service.IrrigationSystem(
        this.name,
        IrrigationSystemAccessory.irrigationSystemType,
      );

      irrigationSystemService
        .getCharacteristic(Characteristic.Active)
        .on("get", callbackify(this.irrigationSystemAccessory.getActive))
        .on("set", callbackify(this.irrigationSystemAccessory.setActive));

      irrigationSystemService
        .getCharacteristic(Characteristic.ProgramMode)
        .on("get", callbackify(this.irrigationSystemAccessory.getProgramMode));

      irrigationSystemService
        .getCharacteristic(Characteristic.InUse)
        .on("get", callbackify(this.irrigationSystemAccessory.getInUse));

      this.serviceToExpose = irrigationSystemService;

      this.irrigationSystemAccessory.irrigationSystemService        = this.serviceToExpose;
      this.irrigationSystemAccessory.irrigationSystemGetActive      = config["irrigationSystemGetActive"]      || "V400.0";
      this.irrigationSystemAccessory.irrigationSystemSetActiveOn    = config["irrigationSystemSetActiveOn"]    || "V400.1";
      this.irrigationSystemAccessory.irrigationSystemSetActiveOff   = config["irrigationSystemSetActiveOff"]   || "V400.2";
      this.irrigationSystemAccessory.irrigationSystemGetProgramMode = config["irrigationSystemGetProgramMode"] || "VW402";
      this.irrigationSystemAccessory.irrigationSystemGetInUse       = config["irrigationSystemGetInUse"]       || "V400.3";

    }

    /******************************
     * LOGO! Light Sensor Service *
     ******************************/

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

      this.serviceToExpose = lightSensorService;

      this.lightSensor.lightSensorService = this.serviceToExpose;
      this.lightSensor.lightLevel         = config["lightLevel"] || "AM3";

      this.lightSensor.lightLDRLevelParts = config["lightLDRLevelParts"] || 3;
      this.lightSensor.lightLDRLevelMin   = config["lightLDRLevelMin"]   || 0;
      this.lightSensor.lightLDRLevelMax   = config["lightLDRLevelMax"]   || 1000;
      this.lightSensor.lightLDRLevelP1Min = config["lightLDRLevelP1Min"] || 423;
      this.lightSensor.lightLDRLevelP2Min = config["lightLDRLevelP2Min"] || 696;

      this.lightSensor.lightLDRLevelP0S   = config["lightLDRLevelP0S"]   || 1.92170242765178;
      this.lightSensor.lightLDRLevelP0Y   = config["lightLDRLevelP0Y"]   || -2.27030759992747;
      this.lightSensor.lightLDRLevelP1S   = config["lightLDRLevelP1S"]   || 3.85547119519305;
      this.lightSensor.lightLDRLevelP1Y   = config["lightLDRLevelP1Y"]   || -7.34902696724256;
      this.lightSensor.lightLDRLevelP2S   = config["lightLDRLevelP2S"]   || 16.3271951868277;
      this.lightSensor.lightLDRLevelP2Y   = config["lightLDRLevelP2Y"]   || -42.8043502895429;

    }

    /*******************************
     * LOGO! Motion Sensor Service *
     *******************************/

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

      this.serviceToExpose = motionSensorService;

      this.motionSensor.motionSensorService = this.serviceToExpose;
      this.motionSensor.motionDetected      = config["motionDetected"] || "M9";

    }

    /********************************
     * LOGO! Contact Sensor Service *
     ********************************/

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

      this.serviceToExpose = contactSensorService;

      this.contactSensor.contactSensorService = this.serviceToExpose;
      this.contactSensor.contactDetected      = config["contactDetected"] || "M15";

    }

    /******************************
     * LOGO! Smoke Sensor Service *
     ******************************/

    if (this.type == SmokeSensor.smokeSensorType) {

      this.smokeSensor = new SmokeSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const smokeSensorService = new Service.SmokeSensor(
        this.name,
        SmokeSensor.smokeSensorType,
      );

      smokeSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.smokeSensor.getStatusActive));

        smokeSensorService
        .getCharacteristic(Characteristic.SmokeDetected)
        .on("get", callbackify(this.smokeSensor.getSmokeDetected));

      this.serviceToExpose = smokeSensorService;

      this.smokeSensor.smokeSensorService = this.serviceToExpose;
      this.smokeSensor.smokeDetected      = config["smokeDetected"] || "M12";

    }

    /************************************
     * LOGO! Temperature Sensor Service *
     ************************************/

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

      this.serviceToExpose = temperatureSensorService;

      this.temperatureSensor.temperatureSensorService = this.serviceToExpose;
      this.temperatureSensor.temperature              = config["temperature"] || "AM2";

    }

    /*********************************
     * LOGO! Humidity Sensor Service *
     *********************************/

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

      this.serviceToExpose = humiditySensorService;

      this.humiditySensor.humiditySensorService = this.serviceToExpose;
      this.humiditySensor.humidity              = config["humidity"] || "AM1";

    }

    /********************************************
     * LOGO! Carbon Dioxide Sensor Service      *
     * 1000ppm CO2 (CO2 in Air 0.04% = ~400ppm) *
     ********************************************/

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

      this.serviceToExpose = carbonDioxideSensorService;

      this.carbonDioxideSensor.carbonDioxideSensorService = this.serviceToExpose;
      this.carbonDioxideSensor.carbonDioxideLevel         = config["carbonDioxideLevel"] || "AM3";
      this.carbonDioxideSensor.carbonDioxideLimit         = config["carbonDioxideLimit"] || 1000;

    }

    /************************************
     * LOGO! Air Quality Sensor Service *
     ************************************/

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

      this.serviceToExpose = airQualitySensorService;

      this.airQualitySensor.airQualitySensorService = this.serviceToExpose;
      this.airQualitySensor.carbonDioxideLevel      = config["carbonDioxideLevel"] || "AM3";

    }

  }

  getServices() {
    return [ this.serviceToExpose ];
  }

  /********************
   * Helper Functions *
   ********************/

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

}
