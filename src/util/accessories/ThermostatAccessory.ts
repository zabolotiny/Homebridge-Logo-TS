import { wait } from "../wait";

let Characteristic: any;

export class ThermostatAccessory {

  static thermostatType: string = "thermostat";

  public thermostatService: any;

  public thermostatGetHCState: string       = "VW211";
  public thermostatSetHCState: string       = "VW201";
  public thermostatGetTemp: string          = "VW213";
  public thermostatSetTemp: string          = "VW203";
  public thermostatTempDisplayUnits: number = 0;

  accessoryAnalogTimeOut = 500;

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  lastTargetHeatingCoolingState: number;
  lastTargetTemperature: number;
  lastTargetTemperatureTime: number;
  lastTargetTemperatureTimerSet: boolean;
  updateTimer: any;

  constructor(log: Function, 
              logo: any,
              updateInterval: number,
              buttonValue: number,
              pushButton: number,
              debugMsgLog: number,
              characteristic: any
              ) {

    this.log            = log;
    this.logo           = logo;
    this.updateInterval = updateInterval,
    this.buttonValue    = buttonValue,
    this.pushButton     = pushButton,
    this.debugMsgLog    = debugMsgLog,
    Characteristic      = characteristic;

    if (this.updateInterval > 0) {
      this.thermostatAutoUpdate();
    }

    this.lastTargetHeatingCoolingState = -1;
    this.lastTargetTemperature         = -1;
    this.lastTargetTemperatureTime     = -1;
    this.lastTargetTemperatureTimerSet = false;

  }

  //
  // LOGO! Thermostat Service
  //

  getCurrentHeatingCoolingState = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.thermostatGetHCState, async (state: number) => {

      if (state != -1) {

        this.debugLogNum("CurrentHeatingCoolingState ?", state);

        await wait(1);

        this.thermostatService.updateCharacteristic(
          Characteristic.CurrentHeatingCoolingState,
          state
        );

      }

      if (this.updateInterval > 0) {
        this.thermostatAutoUpdate();
      }

    });

  };

  getTargetHeatingCoolingState = async () => {

    this.debugLogNum("TargetHeatingCoolingState ?", this.lastTargetHeatingCoolingState);
    if (this.lastTargetHeatingCoolingState != -1) {
      return this.lastTargetHeatingCoolingState;
    } else {
      return 0;
    }

  };

  setTargetHeatingCoolingState = async (state: number) => {

    this.lastTargetHeatingCoolingState = state;
    this.logo.WriteLogo(this.thermostatSetHCState, state, 0);

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    this.thermostatService.setCharacteristic(
      Characteristic.TargetHeatingCoolingState,
      state
    );

  };

  getCurrentTemperature = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.thermostatGetTemp, async (value: number) => {

      if (value != -1) {

        let temp = value / 10;
        this.debugLogNum("CurrentTemperature ?", temp);

        await wait(1);

        this.thermostatService.updateCharacteristic(
          Characteristic.CurrentTemperature,
          temp
        );

      }

      if (this.updateInterval > 0) {
        this.thermostatAutoUpdate();
      }

    });

  };

  getTargetTemperature = async () => {

    this.debugLogNum("TargetTemperature ?", this.lastTargetTemperature);
    if (this.lastTargetTemperature != -1) {
      return this.lastTargetTemperature;
    } else {
      return 0;
    }

  };

  setTargetTemperature = async (temp: number) => {

    this.lastTargetTemperature = temp;
    this.lastTargetTemperatureTime = + new Date();
    if (!this.lastTargetTemperatureTimerSet) {
      this.targetTemperatureTimeout();
    }

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    this.thermostatService.setCharacteristic(
      Characteristic.TargetTemperature,
      temp
    );

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

  targetTemperatureTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ( now >= (this.lastTargetTemperatureTime + this.accessoryAnalogTimeOut) ) {

          this.debugLogNum("Set TargetTemperature to", this.lastTargetTemperature);
          this.lastTargetTemperatureTimerSet = false;

            this.logo.WriteLogo(this.thermostatSetTemp, (this.lastTargetTemperature * 10), 0);

        } else {

          this.lastTargetTemperatureTimerSet = true;
          this.targetTemperatureTimeout();
        }

    }, 100);
  }

  thermostatAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getCurrentHeatingCoolingState();
      this.getCurrentTemperature();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}