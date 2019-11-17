import { wait } from "../wait";

let Characteristic: any;

export class ThermostatAccessory {

  static thermostatType: string = "thermostat";
  static infoModel: string = "Thermostat";

  public thermostatService: any;

  public thermostatGetHCState: string       = "VW210";
  public thermostatSetHCState: string       = "VW200";
  public thermostatGetTemp: string          = "VW212";
  public thermostatGetTargetTemp: string    = "VW214";
  public thermostatSetTargetTemp: string    = "VW202";
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
  lastTargetHeatingCoolingStateTime: number;
  lastTargetHeatingCoolingStateTimerSet: boolean;
  lastTargetTemperatureTime: number;
  lastTargetTemperatureTimerSet: boolean;
  updateHCSTimer: any;
  updateTempTimer: any;
  updateTargetTempTimer: any;

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
      this.thermostatHCSAutoUpdate();
      this.thermostatTempAutoUpdate();
      this.thermostatTargetTempAutoUpdate();
    }

    this.lastTargetHeatingCoolingState = -1;
    this.lastTargetTemperature         = -1;
    this.lastTargetHeatingCoolingStateTime     = -1;
    this.lastTargetHeatingCoolingStateTimerSet = false;
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
      clearTimeout(this.updateHCSTimer);
      this.updateHCSTimer = 0;
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
        this.thermostatHCSAutoUpdate();
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

    this.debugLogNum("Set TargetHeatingCoolingState to", state);
    this.lastTargetHeatingCoolingState = state;
    this.logo.WriteLogo(this.thermostatSetHCState, state, 0);

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    this.thermostatService.setCharacteristic(
      Characteristic.CurrentHeatingCoolingState,
      state
    );

  };

  getCurrentTemperature = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTempTimer);
      this.updateTempTimer = 0;
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
        this.thermostatTempAutoUpdate();
      }

    });

  };

  getTargetTemperature = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTargetTempTimer);
      this.updateTargetTempTimer = 0;
    }

    this.logo.ReadLogo(this.thermostatGetTargetTemp, async (value: number) => {

      if (value != -1) {

        let temp = value / 10;
        this.lastTargetTemperature = temp;
        this.debugLogNum("TargetTemperature ?", temp);

        await wait(1);

        this.thermostatService.updateCharacteristic(
          Characteristic.TargetTemperature,
          temp
        );

      }

      if (this.updateInterval > 0) {
        this.thermostatTargetTempAutoUpdate();
      }

    });

  };

  setTargetTemperature = async (temp: number) => {

    this.lastTargetTemperature = temp;
    this.lastTargetTemperatureTime = + new Date();
    if (!this.lastTargetTemperatureTimerSet) {
      this.targetTemperatureTimeout();
    }

  };

  getTemperatureDisplayUnits = async () => {

    this.debugLogNum("TemperatureDisplayUnits ?", this.thermostatTempDisplayUnits);
    return this.thermostatTempDisplayUnits;

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

            this.logo.WriteLogo(this.thermostatSetTargetTemp, (this.lastTargetTemperature * 10), 0);

        } else {

          this.lastTargetTemperatureTimerSet = true;
          this.targetTemperatureTimeout();
        }

    }, 100);
  }

  thermostatHCSAutoUpdate() {

    this.updateHCSTimer = setTimeout(() => {

      this.getCurrentHeatingCoolingState();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  thermostatTempAutoUpdate() {

    this.updateTempTimer = setTimeout(() => {

      this.getCurrentTemperature();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  thermostatTargetTempAutoUpdate() {

    this.updateTargetTempTimer = setTimeout(() => {

      this.getTargetTemperature();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}