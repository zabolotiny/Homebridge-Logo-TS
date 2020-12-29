import { wait } from "./util/wait";
import { md5 } from "./util/md5";
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
import { ValveAccessory } from "./util/accessories/ValveAccessory"
import { FanAccessory } from "./util/accessories/FanAccessory"
import { Fanv2Accessory } from "./util/accessories/Fanv2Accessory"
import { FilterMaintenanceAccessory } from "./util/accessories/FilterMaintenanceAccessory"
import { VentilationAccessory } from "./util/accessories/VentilationAccessory"
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
  manufacturer: string;
  model: string;
  serialNumber: string
  firmwareRevision: string;
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
  typeName: string;

  // Runtime state.
  logo: any;

  // Services exposed.
  serviceToExpose:            any;
  infoService:                any;

  switchAccessory:            SwitchAccessory            | undefined;
  blindAccessory:             BlindAccessory             | undefined;
  windowAccessory:            WindowAccessory            | undefined;
  garagedoorAccessory:        GaragedoorAccessory        | undefined;
  lightbulbAccessory:         LightbulbAccessory         | undefined;
  thermostatAccessory:        ThermostatAccessory        | undefined;
  irrigationSystemAccessory:  IrrigationSystemAccessory  | undefined;
  valveAccessory:             ValveAccessory             | undefined;
  fanAccessory:               FanAccessory               | undefined;
  fanv2Accessory:             Fanv2Accessory             | undefined;
  filterMaintenanceAccessory: FilterMaintenanceAccessory | undefined;
  ventilationAccessory:       VentilationAccessory       | undefined;
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
    this.interface      =           config["interface"]        || modbusInterface;
    this.ip             =           config["ip"];
    this.port           =           config["port"]             || 505;
    this.logoType       =           config["logoType"]         || logoType8SF4;
    this.localTSAP      = parseInt( config["localTSAP"], 16)   || 0x1200;
    this.remoteTSAP     = parseInt( config["remoteTSAP"], 16)  || 0x2200;
    this.updateInterval =           config["updateInterval"]   || 0;
    this.buttonValue    =           config["buttonValue"]      || 1;
    this.pushButton     =           config["pushButton"]       || 1;
    this.debugMsgLog    =           config["debugMsgLog"]      || 0;
    this.type           =           config["type"]             || SwitchAccessory.switchType;
    this.typeName       =                                         SwitchAccessory.infoModel;

    if (this.interface == modbusInterface) {
      this.logo = new ModBusLogo(this.ip, this.port, this.debugMsgLog, this.log);
    } else {
      this.logo = new Snap7Logo(this.logoType, this.ip, this.localTSAP, this.remoteTSAP, this.debugMsgLog, this.log);
    }

    /************************
     * LOGO! Switch Service *
     ************************/

    if (this.type == SwitchAccessory.switchType) {
      this.typeName = SwitchAccessory.infoModel;

      this.switchAccessory = new SwitchAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const switchService = new Service.Switch(
        null,
        SwitchAccessory.switchType,
      );

      this.switchAccessory.switchGet    = config["switchGet"]    || "Q1";
      this.switchAccessory.switchSetOn  = config["switchSetOn"]  || "V2.0";
      this.switchAccessory.switchSetOff = config["switchSetOff"] || "V3.0";

      switchService
        .getCharacteristic(Characteristic.On)
        .on("get", callbackify(this.switchAccessory.getSwitchOn))
        .on("set", callbackify(this.switchAccessory.setSwitchOn));

      this.serviceToExpose = switchService;

      this.switchAccessory.switchService = this.serviceToExpose;

    }

    /***********************
     * LOGO! Blind Service *
     ***********************/

    if (this.type == BlindAccessory.blindType) {
      this.typeName = BlindAccessory.infoModel;

      this.blindAccessory = new BlindAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const blindService = new Service.WindowCovering(
        null, 
        BlindAccessory.blindType,
      );

      this.blindAccessory.blindSetPos    = config["blindSetPos"]    || "VW50";
      this.blindAccessory.blindGetPos    = config["blindGetPos"]    || "VW52";
      this.blindAccessory.blindGetState  = config["blindGetState"]  || "VW54";
      this.blindAccessory.blindDigital   = config["blindDigital"]   || 0;
      this.blindAccessory.blindSetUp     = config["blindSetUp"]     || "V5.0";
      this.blindAccessory.blindSetDown   = config["blindSetDown"]   || "V5.1";
      this.blindAccessory.blindGetUpDown = config["blindGetUpDown"] || "V5.2";

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

      this.blindAccessory.blindService = this.serviceToExpose;

    }

    /************************
     * LOGO! Window Service *
     ************************/

    if (this.type == WindowAccessory.windowType) {
      this.typeName = WindowAccessory.infoModel;

      this.windowAccessory = new WindowAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const windowService = new Service.Window(
        null, 
        WindowAccessory.windowType,
      );

      this.windowAccessory.windowSetPos     = config["windowSetPos"]    || "VW50";
      this.windowAccessory.windowGetPos     = config["windowGetPos"]    || "VW52";
      this.windowAccessory.windowGetState   = config["windowGetState"]  || "VW54";
      this.windowAccessory.windowDigital    = config["windowDigital"]   || 0;
      this.windowAccessory.windowSetUp      = config["windowSetUp"]     || "V5.0";
      this.windowAccessory.windowSetDown    = config["windowSetDown"]   || "V5.1";
      this.windowAccessory.windowGetUpDown  = config["windowGetUpDown"] || "V5.2";

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

      this.windowAccessory.windowService = this.serviceToExpose;

    }

    /****************************
     * LOGO! GarageDoor Service *
     ****************************/

    if (this.type == GaragedoorAccessory.garagedoorType) {
      this.typeName = GaragedoorAccessory.infoModel;

      this.garagedoorAccessory = new GaragedoorAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const garagedoorService = new Service.GarageDoorOpener(
        null, 
        GaragedoorAccessory.garagedoorType,
      );

      this.garagedoorAccessory.garagedoorOpen        = config["garagedoorOpen"]        || "V401.0";
      this.garagedoorAccessory.garagedoorClose       = config["garagedoorClose"]       || "V401.1";
      this.garagedoorAccessory.garagedoorState       = config["garagedoorState"]       || "V401.2";
      this.garagedoorAccessory.garagedoorObstruction = config["garagedoorObstruction"] || "false";

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

    }

    /***************************
     * LOGO! LightBulb Service *
     ***************************/

    if (this.type == LightbulbAccessory.lightbulbType) {
      this.typeName = LightbulbAccessory.infoModel;

      this.lightbulbAccessory = new LightbulbAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const lightbulbService = new Service.Lightbulb(
        null, 
        LightbulbAccessory.lightbulbType,
      );

      this.lightbulbAccessory.lightbulbSetOn         = config["lightbulbSetOn"]         || "V7.0";
      this.lightbulbAccessory.lightbulbSetOff        = config["lightbulbSetOff"]        || "V7.1";
      this.lightbulbAccessory.lightbulbSetBrightness = config["lightbulbSetBrightness"] || "VW70";
      this.lightbulbAccessory.lightbulbGetBrightness = config["lightbulbGetBrightness"] || "VW72";

      lightbulbService
        .getCharacteristic(Characteristic.On)
        .on("get", callbackify(this.lightbulbAccessory.getLightbulbOn))
        .on("set", callbackify(this.lightbulbAccessory.setLightbulbOn));

      lightbulbService
        .getCharacteristic(Characteristic.Brightness)
        .on("get", callbackify(this.lightbulbAccessory.getLightbulbBrightness))
        .on("set", callbackify(this.lightbulbAccessory.setLightbulbBrightness));

      this.serviceToExpose = lightbulbService;

      this.lightbulbAccessory.lightbulbService = this.serviceToExpose;

    }

    /****************************
     * LOGO! Thermostat Service *
     ****************************/

    if (this.type == ThermostatAccessory.thermostatType) {
      this.typeName = ThermostatAccessory.infoModel;

      this.thermostatAccessory = new ThermostatAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const thermostatService = new Service.Thermostat(
        null, 
        ThermostatAccessory.thermostatType,
      );

      this.thermostatAccessory.thermostatGetHCState       = config["thermostatGetHCState"]       || "VW210";
      this.thermostatAccessory.thermostatSetHCState       = config["thermostatSetHCState"]       || "VW200";
      this.thermostatAccessory.thermostatGetTemp          = config["thermostatGetTemp"]          || "VW212";
      this.thermostatAccessory.thermostatGetTargetTemp    = config["thermostatGetTargetTemp"]    || "VW214";
      this.thermostatAccessory.thermostatSetTargetTemp    = config["thermostatSetTargetTemp"]    || "VW202";
      this.thermostatAccessory.thermostatTempDisplayUnits = config["thermostatTempDisplayUnits"] || 0;

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

      this.thermostatAccessory.thermostatService = this.serviceToExpose;

    }

    /**********************************
     * LOGO! IrrigationSystem Service *
     **********************************/

    if (this.type == IrrigationSystemAccessory.irrigationSystemType) {
      this.typeName = IrrigationSystemAccessory.infoModel;

      this.irrigationSystemAccessory = new IrrigationSystemAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const irrigationSystemService = new Service.IrrigationSystem(
        null, 
        IrrigationSystemAccessory.irrigationSystemType,
      );

      
      this.irrigationSystemAccessory.irrigationSystemGetActive      = config["irrigationSystemGetActive"]      || "V400.0";
      this.irrigationSystemAccessory.irrigationSystemSetActiveOn    = config["irrigationSystemSetActiveOn"]    || "V400.1";
      this.irrigationSystemAccessory.irrigationSystemSetActiveOff   = config["irrigationSystemSetActiveOff"]   || "V400.2";
      this.irrigationSystemAccessory.irrigationSystemGetProgramMode = config["irrigationSystemGetProgramMode"] || "VW402";
      this.irrigationSystemAccessory.irrigationSystemGetInUse       = config["irrigationSystemGetInUse"]       || "V400.3";

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

      this.irrigationSystemAccessory.irrigationSystemService = this.serviceToExpose;

    }

    /***********************
     * LOGO! Valve Service *
     ***********************/

    if (this.type == ValveAccessory.valveType) {
      this.typeName = ValveAccessory.infoModel;

      this.valveAccessory = new ValveAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const valveService = new Service.Valve(
        null, 
        ValveAccessory.valveType,
      );

      this.valveAccessory.valveGetActive    = config["valveGetActive"]    || "V400.0";
      this.valveAccessory.valveSetActiveOn  = config["valveSetActiveOn"]  || "V400.1";
      this.valveAccessory.valveSetActiveOff = config["valveSetActiveOff"] || "V400.2";
      this.valveAccessory.valveGetInUse     = config["valveGetInUse"]     || "V400.3";
      this.valveAccessory.valveType         = config["valveType"]         || 0;
      this.valveAccessory.valveSetDuration  = config["valveSetDuration"]  || "0";
      this.valveAccessory.valveGetDuration  = config["valveGetDuration"]  || "0";

      valveService
        .getCharacteristic(Characteristic.Active)
        .on("get", callbackify(this.valveAccessory.getActive))
        .on("set", callbackify(this.valveAccessory.setActive));

      valveService
        .getCharacteristic(Characteristic.InUse)
        .on("get", callbackify(this.valveAccessory.getInUse));

      valveService
        .getCharacteristic(Characteristic.ValveType)
        .on("get", callbackify(this.valveAccessory.getValveType));

      if (this.logo.isValidLogoAddress(this.valveAccessory.valveSetDuration)) {

        valveService
          .getCharacteristic(Characteristic.SetDuration)
          .on("get", callbackify(this.valveAccessory.getSetDuration))
          .on("set", callbackify(this.valveAccessory.setSetDuration));

      }

      if (this.logo.isValidLogoAddress(this.valveAccessory.valveGetDuration)) {

        valveService
          .getCharacteristic(Characteristic.RemainingDuration)
          .on("get", callbackify(this.valveAccessory.getRemainingDuration));

      }

      this.serviceToExpose = valveService;

      this.valveAccessory.valveService = this.serviceToExpose;

    }

    /*********************
     * LOGO! Fan Service *
     *********************/

    if (this.type == FanAccessory.fanType) {
      this.typeName = FanAccessory.infoModel;

      this.fanAccessory = new FanAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const fanService = new Service.Fan(
        null, 
        FanAccessory.fanType,
      );

      this.fanAccessory.fanGetOn                   = config["fanGetOn"]                   || "V130.0";
      this.fanAccessory.fanSetOn                   = config["fanSetOn"]                   || "V130.1";
      this.fanAccessory.fanSetOff                  = config["fanSetOff"]                  || "V130.2";
      this.fanAccessory.fanGetRotationDirection    = config["fanGetRotationDirection"]    || "0";
      this.fanAccessory.fanSetRotationDirectionCW  = config["fanSetRotationDirectionCW"]  || "0";
      this.fanAccessory.fanSetRotationDirectionCCW = config["fanSetRotationDirectionCCW"] || "0";
      this.fanAccessory.fanGetRotationSpeed        = config["fanGetRotationSpeed"]        || "0";
      this.fanAccessory.fanSetRotationSpeed        = config["fanSetRotationSpeed"]        || "0";

      fanService
        .getCharacteristic(Characteristic.On)
        .on("get", callbackify(this.fanAccessory.getOn))
        .on("set", callbackify(this.fanAccessory.setOn));

      if (this.logo.isValidLogoAddress(this.fanAccessory.fanGetRotationDirection) 
            && this.logo.isValidLogoAddress(this.fanAccessory.fanSetRotationDirectionCW)
                && this.logo.isValidLogoAddress(this.fanAccessory.fanSetRotationDirectionCCW)) {
      
        fanService
          .getCharacteristic(Characteristic.RotationDirection)
          .on("get", callbackify(this.fanAccessory.getRotationDirection))
          .on("set", callbackify(this.fanAccessory.setRotationDirection));

      }

      if (this.logo.isValidLogoAddress(this.fanAccessory.fanGetRotationSpeed) && this.logo.isValidLogoAddress(this.fanAccessory.fanSetRotationSpeed)) {
        
        fanService
          .getCharacteristic(Characteristic.RotationSpeed)
          .on("get", callbackify(this.fanAccessory.getRotationSpeed))
          .on("set", callbackify(this.fanAccessory.setRotationSpeed));

      }

      this.serviceToExpose = fanService;

      this.fanAccessory.fanService = this.serviceToExpose;

    }

    /************************
     * LOGO! Fan v2 Service *
     ************************/

    if (this.type == Fanv2Accessory.fanv2Type) {
      this.typeName = Fanv2Accessory.infoModel;

      this.fanv2Accessory = new Fanv2Accessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const fanv2Service = new Service.Fanv2(
        null, 
        Fanv2Accessory.fanv2Type,
      );

      this.fanv2Accessory.fanv2GetActive               = config["fanv2GetActive"]               || "V130.0";
      this.fanv2Accessory.fanv2SetActiveOn             = config["fanv2SetActiveOn"]             || "V130.1";
      this.fanv2Accessory.fanv2SetActiveOff            = config["fanv2SetActiveOff"]            || "V130.2";
      this.fanv2Accessory.fanv2GetCurrentFanState      = config["fanv2GetCurrentFanState"]      || "0";
      this.fanv2Accessory.fanv2SetTargetFanStateAuto   = config["fanv2SetTargetFanStateAuto"]   || "0";
      this.fanv2Accessory.fanv2SetTargetFanStateManual = config["fanv2SetTargetFanStateManual"] || "0";
      this.fanv2Accessory.fanv2GetRotationDirection    = config["fanv2GetRotationDirection"]    || "0";
      this.fanv2Accessory.fanv2SetRotationDirectionCW  = config["fanv2SetRotationDirectionCW"]  || "0";
      this.fanv2Accessory.fanv2SetRotationDirectionCCW = config["fanv2SetRotationDirectionCCW"] || "0";
      this.fanv2Accessory.fanv2GetRotationSpeed        = config["fanv2GetRotationSpeed"]        || "0";
      this.fanv2Accessory.fanv2SetRotationSpeed        = config["fanv2SetRotationSpeed"]        || "0";

      fanv2Service
        .getCharacteristic(Characteristic.Active)
        .on("get", callbackify(this.fanv2Accessory.getActive))
        .on("set", callbackify(this.fanv2Accessory.setActive));

      if (this.logo.isValidLogoAddress(this.fanv2Accessory.fanv2GetCurrentFanState)) {
      
        fanv2Service
          .getCharacteristic(Characteristic.CurrentFanState)
          .on("get", callbackify(this.fanv2Accessory.getCurrentFanState));

      }

      if (this.logo.isValidLogoAddress(this.fanv2Accessory.fanv2SetTargetFanStateAuto) && this.logo.isValidLogoAddress(this.fanv2Accessory.fanv2SetTargetFanStateManual)) {
      
        fanv2Service
          .getCharacteristic(Characteristic.TargetFanState)
          .on("get", callbackify(this.fanv2Accessory.getTargetFanState))
          .on("set", callbackify(this.fanv2Accessory.setTargetFanState));

      }

      if (this.logo.isValidLogoAddress(this.fanv2Accessory.fanv2GetRotationDirection) 
            && this.logo.isValidLogoAddress(this.fanv2Accessory.fanv2SetRotationDirectionCW)
                && this.logo.isValidLogoAddress(this.fanv2Accessory.fanv2SetRotationDirectionCCW)) {
      
        fanv2Service
          .getCharacteristic(Characteristic.RotationDirection)
          .on("get", callbackify(this.fanv2Accessory.getRotationDirection))
          .on("set", callbackify(this.fanv2Accessory.setRotationDirection));

      }

      if (this.logo.isValidLogoAddress(this.fanv2Accessory.fanv2GetRotationSpeed) && this.logo.isValidLogoAddress(this.fanv2Accessory.fanv2SetRotationSpeed)) {
        
        fanv2Service
          .getCharacteristic(Characteristic.RotationSpeed)
          .on("get", callbackify(this.fanv2Accessory.getRotationSpeed))
          .on("set", callbackify(this.fanv2Accessory.setRotationSpeed));

      }

      this.serviceToExpose = fanv2Service;

      this.fanv2Accessory.fanv2Service = this.serviceToExpose;

    }

    /************************************
     * LOGO! Filter Maintenance Service *
     ************************************/

    if (this.type == FilterMaintenanceAccessory.filterMaintenanceType) {
      this.typeName = FilterMaintenanceAccessory.infoModel;

      this.filterMaintenanceAccessory = new FilterMaintenanceAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const filterMaintenanceService = new Service.FilterMaintenance(
        null, 
        FilterMaintenanceAccessory.filterMaintenanceType,
      );

      this.filterMaintenanceAccessory.filterChangeIndication      = config["filterChangeIndication"]      || "V120.0";
      this.filterMaintenanceAccessory.filterLifeLevel             = config["filterLifeLevel"]             || "0";
      this.filterMaintenanceAccessory.filterResetFilterIndication = config["filterResetFilterIndication"] || "0";

      filterMaintenanceService
        .getCharacteristic(Characteristic.FilterChangeIndication)
        .on("get", callbackify(this.filterMaintenanceAccessory.getFilterChangeIndication));

      if (this.logo.isValidLogoAddress(this.filterMaintenanceAccessory.filterLifeLevel)) {

        filterMaintenanceService
          .getCharacteristic(Characteristic.FilterLifeLevel)
          .on("get", callbackify(this.filterMaintenanceAccessory.getFilterLifeLevel));
        
      }

      if (this.logo.isValidLogoAddress(this.filterMaintenanceAccessory.filterResetFilterIndication)) {

        filterMaintenanceService
          .getCharacteristic(Characteristic.ResetFilterIndication)
          .on("set", callbackify(this.filterMaintenanceAccessory.setResetFilterIndication));
        
      }

      this.serviceToExpose = filterMaintenanceService;

      this.filterMaintenanceAccessory.filterMaintenanceService = this.serviceToExpose;

    }

    /****************************************************************
     * LOGO! Ventilation Service (Fan + Filter Maintenance Service) *
     ****************************************************************/

    if (this.type == VentilationAccessory.ventilationType) {
      this.typeName = VentilationAccessory.infoModel;

      this.ventilationAccessory = new VentilationAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const ventilationService = new Service.Fan(
        null, 
        VentilationAccessory.ventilationType,
      );

      /* Fan Accessory */

      this.ventilationAccessory.ventilationGetOn                   = config["ventilationGetOn"]                   || "V130.0";
      this.ventilationAccessory.ventilationSetOn                   = config["ventilationSetOn"]                   || "V130.1";
      this.ventilationAccessory.ventilationSetOff                  = config["ventilationSetOff"]                  || "V130.2";
      this.ventilationAccessory.ventilationGetRotationDirection    = config["ventilationGetRotationDirection"]    || "0";
      this.ventilationAccessory.ventilationSetRotationDirectionCW  = config["ventilationSetRotationDirectionCW"]  || "0";
      this.ventilationAccessory.ventilationSetRotationDirectionCCW = config["ventilationSetRotationDirectionCCW"] || "0";
      this.ventilationAccessory.ventilationGetRotationSpeed        = config["ventilationGetRotationSpeed"]        || "0";
      this.ventilationAccessory.ventilationSetRotationSpeed        = config["ventilationSetRotationSpeed"]        || "0";

      ventilationService
        .getCharacteristic(Characteristic.On)
        .on("get", callbackify(this.ventilationAccessory.getOn))
        .on("set", callbackify(this.ventilationAccessory.setOn));

      if (this.logo.isValidLogoAddress(this.ventilationAccessory.ventilationGetRotationDirection) 
            && this.logo.isValidLogoAddress(this.ventilationAccessory.ventilationSetRotationDirectionCW)
                && this.logo.isValidLogoAddress(this.ventilationAccessory.ventilationSetRotationDirectionCCW)) {
      
        ventilationService
          .getCharacteristic(Characteristic.RotationDirection)
          .on("get", callbackify(this.ventilationAccessory.getRotationDirection))
          .on("set", callbackify(this.ventilationAccessory.setRotationDirection));

      }

      if (this.logo.isValidLogoAddress(this.ventilationAccessory.ventilationGetRotationSpeed) && this.logo.isValidLogoAddress(this.ventilationAccessory.ventilationSetRotationSpeed)) {
        
        ventilationService
          .getCharacteristic(Characteristic.RotationSpeed)
          .on("get", callbackify(this.ventilationAccessory.getRotationSpeed))
          .on("set", callbackify(this.ventilationAccessory.setRotationSpeed));

      }

      /* Filter Maintenance Accessory */

      this.ventilationAccessory.ventilationGetFilterChangeIndication = config["ventilationGetFilterChangeIndication"] || "V120.0";
      this.ventilationAccessory.ventilationGetFilterLifeLevel        = config["ventilationGetFilterLifeLevel"]        || "0";
      this.ventilationAccessory.ventilationSetResetFilterIndication  = config["ventilationSetResetFilterIndication"]  || "0";

      ventilationService
        .getCharacteristic(Characteristic.FilterChangeIndication)
        .on("get", callbackify(this.ventilationAccessory.getFilterChangeIndication));

      if (this.logo.isValidLogoAddress(this.ventilationAccessory.ventilationGetFilterLifeLevel)) {

        ventilationService
          .getCharacteristic(Characteristic.FilterLifeLevel)
          .on("get", callbackify(this.ventilationAccessory.getFilterLifeLevel));
        
      }

      if (this.logo.isValidLogoAddress(this.ventilationAccessory.ventilationSetResetFilterIndication)) {

        ventilationService
          .getCharacteristic(Characteristic.ResetFilterIndication)
          .on("set", callbackify(this.ventilationAccessory.setResetFilterIndication));
        
      }

      this.serviceToExpose = ventilationService;

      this.ventilationAccessory.ventilationService = this.serviceToExpose;

    }

    /******************************
     * LOGO! Light Sensor Service *
     ******************************/

    if (this.type == LightSensor.lightSensorType) {
      this.typeName = LightSensor.infoModel;

      this.lightSensor = new LightSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const lightSensorService = new Service.LightSensor(
        null, 
        LightSensor.lightSensorType,
      );

      this.lightSensor.lightLevel         = config["lightLevel"]         || "AM3";

      this.lightSensor.lightAsLux         = config["lightAsLux"]         || 0;
      this.lightSensor.lightLDRLevel      = config["lightLDRLevel"]      || 0;

      this.lightSensor.lightAsLuxInMin    = config["lightAsLuxInMin"]    || 0;
      this.lightSensor.lightAsLuxInMax    = config["lightAsLuxInMax"]    || 1000;
      this.lightSensor.lightAsLuxOutMin   = config["lightAsLuxOutMin"]   || 0;
      this.lightSensor.lightAsLuxOutMax   = config["lightAsLuxOutMax"]   || 65535;

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

      lightSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.lightSensor.getStatusActive));

      lightSensorService
        .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
        .on("get", callbackify(this.lightSensor.getCurrentAmbientLightLevel));

      this.serviceToExpose = lightSensorService;

      this.lightSensor.lightSensorService = this.serviceToExpose;

    }

    /*******************************
     * LOGO! Motion Sensor Service *
     *******************************/

    if (this.type == MotionSensor.motionSensorType) {
      this.typeName = MotionSensor.infoModel;

      this.motionSensor = new MotionSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const motionSensorService = new Service.MotionSensor(
        null, 
        MotionSensor.motionSensorType,
      );

      this.motionSensor.motionDetected = config["motionDetected"] || "M9";

      motionSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.motionSensor.getStatusActive));

      motionSensorService
        .getCharacteristic(Characteristic.MotionDetected)
        .on("get", callbackify(this.motionSensor.getMotionDetected));

      this.serviceToExpose = motionSensorService;

      this.motionSensor.motionSensorService = this.serviceToExpose;

    }

    /********************************
     * LOGO! Contact Sensor Service *
     ********************************/

    if (this.type == ContactSensor.contactSensorType) {
      this.typeName = ContactSensor.infoModel;

      this.contactSensor = new ContactSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const contactSensorService = new Service.ContactSensor(
        null, 
        ContactSensor.contactSensorType,
      );

      this.contactSensor.contactDetected = config["contactDetected"] || "M15";

      contactSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.contactSensor.getStatusActive));

      contactSensorService
        .getCharacteristic(Characteristic.ContactSensorState)
        .on("get", callbackify(this.contactSensor.getContactSensorState));

      this.serviceToExpose = contactSensorService;

      this.contactSensor.contactSensorService = this.serviceToExpose;

    }

    /******************************
     * LOGO! Smoke Sensor Service *
     ******************************/

    if (this.type == SmokeSensor.smokeSensorType) {
      this.typeName = SmokeSensor.infoModel;

      this.smokeSensor = new SmokeSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const smokeSensorService = new Service.SmokeSensor(
        null, 
        SmokeSensor.smokeSensorType,
      );

      this.smokeSensor.smokeDetected = config["smokeDetected"] || "M12";

      smokeSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.smokeSensor.getStatusActive));

        smokeSensorService
        .getCharacteristic(Characteristic.SmokeDetected)
        .on("get", callbackify(this.smokeSensor.getSmokeDetected));

      this.serviceToExpose = smokeSensorService;

      this.smokeSensor.smokeSensorService = this.serviceToExpose;

    }

    /************************************
     * LOGO! Temperature Sensor Service *
     ************************************/

    if (this.type == TemperatureSensor.temperatureSensorType) {
      this.typeName = TemperatureSensor.infoModel;

      this.temperatureSensor = new TemperatureSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const temperatureSensorService = new Service.TemperatureSensor(
        null, 
        TemperatureSensor.temperatureSensorType,
      );

      this.temperatureSensor.temperature = config["temperature"] || "AM2";

      temperatureSensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.temperatureSensor.getStatusActive));

      temperatureSensorService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on("get", callbackify(this.temperatureSensor.getCurrentTemperature));

      this.serviceToExpose = temperatureSensorService;

      this.temperatureSensor.temperatureSensorService = this.serviceToExpose;

    }

    /*********************************
     * LOGO! Humidity Sensor Service *
     *********************************/

    if (this.type == HumiditySensor.humiditySensorType) {
      this.typeName = HumiditySensor.infoModel;

      this.humiditySensor = new HumiditySensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const humiditySensorService = new Service.HumiditySensor(
        null, 
        HumiditySensor.humiditySensorType,
      );

      this.humiditySensor.humidity = config["humidity"] || "AM1";

      humiditySensorService
        .getCharacteristic(Characteristic.StatusActive)
        .on("get", callbackify(this.humiditySensor.getStatusActive));

      humiditySensorService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on("get", callbackify(this.humiditySensor.getCurrentRelativeHumidity));

      this.serviceToExpose = humiditySensorService;

      this.humiditySensor.humiditySensorService = this.serviceToExpose;

    }

    /********************************************
     * LOGO! Carbon Dioxide Sensor Service      *
     * 1000ppm CO2 (CO2 in Air 0.04% = ~400ppm) *
     ********************************************/

    if (this.type == CarbonDioxideSensor.carbonDioxideSensorType) {
      this.typeName = CarbonDioxideSensor.infoModel;

      this.carbonDioxideSensor = new CarbonDioxideSensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const carbonDioxideSensorService = new Service.CarbonDioxideSensor(
        null, 
        CarbonDioxideSensor.carbonDioxideSensorType,
      );

      this.carbonDioxideSensor.carbonDioxideLevel = config["carbonDioxideLevel"] || "AM3";
      this.carbonDioxideSensor.carbonDioxideLimit = config["carbonDioxideLimit"] || 1000;

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

    }

    /************************************
     * LOGO! Air Quality Sensor Service *
     ************************************/

    if (this.type == AirQualitySensor.airQualitySensorType) {
      this.typeName = AirQualitySensor.infoModel;

      this.airQualitySensor = new AirQualitySensor(this.log, this.logo, this.updateInterval, this.debugMsgLog, Characteristic);

      const airQualitySensorService = new Service.AirQualitySensor(
        null, 
        AirQualitySensor.airQualitySensorType,
      );

      this.airQualitySensor.carbonDioxideLevel = config["carbonDioxideLevel"] || "AM3";

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

    }

    /***************************************
     * LOGO! Accessory Information Service *
     ***************************************/

    this.manufacturer     =  config["manufacturer"]     || pjson.author.name;
    this.model            =  config["model"]            || this.typeName + " @ " + this.logoType;
    this.serialNumber     =  config["serialNumber"]     || md5(this.name + this.typeName);
    this.firmwareRevision =  config["firmwareRevision"] || pjson.version;
    
  }

  getServices() {

    var informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer,     this.manufacturer)
      .setCharacteristic(Characteristic.Model,            this.model)
      .setCharacteristic(Characteristic.Name,             this.name)
      .setCharacteristic(Characteristic.SerialNumber,     this.serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmwareRevision);

    return [ informationService, this.serviceToExpose ];
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
