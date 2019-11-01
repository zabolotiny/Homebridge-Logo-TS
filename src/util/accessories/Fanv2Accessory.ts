import { wait } from "../wait";

let Characteristic: any;

export class Fanv2Accessory {

  static fanv2Type: string = "fanv2";

  public fanv2Service: any;
  public fanv2GetActive: string         = "V130.0";
  public fanv2SetActiveOn: string       = "V130.1";
  public fanv2SetActiveOff: string      = "V130.2";
  public fanv2CurrentFanState: string   = "VW131";
  public fanv2TargetFanState: string    = "V130.3";
  public fanv2GetRotationSpeed: string  = "VW133";
  public fanv2SetRotationSpeed: string  = "VW135";

  accessoryAnalogTimeOut = 500;

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  lastTargetFanState: number;
  lastRotationSpeed: number;
  lastRotationSpeedTime: number;
  lastRotationSpeedTimerSet: boolean;
  updateATimer: any;
  updateCFSTimer: any;
  updateRSTimer: any;

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
      this.fanv2AAutoUpdate();
      this.fanv2CFSAutoUpdate();
      this.fanv2RSAutoUpdate();
    }

    this.lastTargetFanState        = -1;
    this.lastRotationSpeed         = -1;
    this.lastRotationSpeedTime     = -1;
    this.lastRotationSpeedTimerSet = false;

  }

  //
  // LOGO! Fan v2 Service
  //

  getActive = async () => {
    // INACTIVE = 0; ACTIVE = 1;

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateATimer);
      this.updateATimer = 0;
    }

    this.logo.ReadLogo(this.fanv2GetActive, async (value: number) => {
      // LOGO! return 1 for active

      if (value != -1) {

        this.debugLogNum("Active ?", value);

        await wait(1);

        this.fanv2Service.updateCharacteristic(
          Characteristic.Active,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.fanv2AAutoUpdate();
      }

    });

  };

  setActive = async (value: number) => {

    this.debugLogNum("Set Active to", value);

    if (value == 1) {
      this.logo.WriteLogo(this.fanv2SetActiveOn, this.buttonValue, this.pushButton);
    } else {
      this.logo.WriteLogo(this.fanv2SetActiveOff, this.buttonValue, this.pushButton);
    }
  };

  getCurrentFanState = async () => {
    // INACTIVE = 0; IDLE = 1; BLOWING_AIR = 2;

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateCFSTimer);
      this.updateCFSTimer = 0;
    }

    this.logo.ReadLogo(this.fanv2CurrentFanState, async (state: number) => {

      if (state != -1) {

        this.debugLogNum("CurrentFanState ?", state);

        await wait(1);

        this.fanv2Service.updateCharacteristic(
          Characteristic.CurrentFanState,
          state
        );

      }

      if (this.updateInterval > 0) {
        this.fanv2CFSAutoUpdate();
      }

    });

  };

  getTargetFanState = async () => {
    // MANUAL = 0; AUTO = 1;

    this.debugLogNum("TargetFanState ?", this.lastTargetFanState);
    if (this.lastTargetFanState != -1) {
      return this.lastTargetFanState;
    } else {
      return 0;
    }

  };

  setTargetFanState = async (state: number) => {

    this.debugLogNum("Set TargetFanState to", state);
    this.lastTargetFanState = state;

    this.logo.WriteLogo(this.fanv2TargetFanState, state, 0);
  
  };

  getRotationSpeed = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateRSTimer);
      this.updateRSTimer = 0;
    }

    this.logo.ReadLogo(this.fanv2GetRotationSpeed, async (value: number) => {

      if (value != -1) {

        this.debugLogNum("RotationSpeed ?", value);

        await wait(1);

        this.fanv2Service.updateCharacteristic(
          Characteristic.RotationSpeed,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.fanv2RSAutoUpdate();
      }

    });

  };

  setRotationSpeed = async (value: number) => {

    this.lastRotationSpeed = value;
    this.lastRotationSpeedTime = + new Date();
    if (!this.lastRotationSpeedTimerSet) {
      this.fanv2RotationSpeedTimeout();
    }

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    this.fanv2Service.setCharacteristic(
      Characteristic.RotationSpeed,
      value
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

  fanv2RotationSpeedTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastRotationSpeedTime + this.accessoryAnalogTimeOut)) || (this.lastRotationSpeed == 0) || (this.lastRotationSpeed == 100)) {

          this.debugLogNum("Set RotationSpeed to", this.lastRotationSpeed);
          this.lastRotationSpeedTimerSet = false;

          this.logo.WriteLogo(this.setRotationSpeed, this.lastRotationSpeed, 0);

        } else {

          this.lastRotationSpeedTimerSet = true;
          this.fanv2RotationSpeedTimeout();
        }

    }, 100);
  }

  fanv2AAutoUpdate() {

    this.updateATimer = setTimeout(() => {

      this.getActive();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  fanv2CFSAutoUpdate() {

    this.updateCFSTimer = setTimeout(() => {

      this.getCurrentFanState;

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  fanv2RSAutoUpdate() {

    this.updateRSTimer = setTimeout(() => {

      this.getRotationSpeed;

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}


    /************************
     * LOGO! Fan v2 Service *
     ************************/

    /*

    if (this.type == Fanv2Accessory.fanv2Type) {

      this.fanv2Accessory = new Fanv2Accessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const fanv2Service = new Service.Fanv2(
        this.name,
        Fanv2Accessory.fanv2Type,
      );

      fanv2Service
        .getCharacteristic(Characteristic.Active)
        .on("get", callbackify(this.fanv2Accessory.getActive))
        .on("set", callbackify(this.fanv2Accessory.setActive));

      fanv2Service
        .getCharacteristic(Characteristic.CurrentFanState)
        .on("get", callbackify(this.fanv2Accessory.getCurrentFanState));

      fanv2Service
        .getCharacteristic(Characteristic.TargetFanState)
        .on("get", callbackify(this.fanv2Accessory.getTargetFanState))
        .on("set", callbackify(this.fanv2Accessory.setTargetFanState));

      fanv2Service
        .getCharacteristic(Characteristic.RotationSpeed)
        .on("get", callbackify(this.fanv2Accessory.getRotationSpeed))
        .on("set", callbackify(this.fanv2Accessory.setRotationSpeed));

      this.fanv2Service = fanv2Service;

      this.fanv2Accessory.fanv2Service = this.fanv2Service;
      this.fanv2Accessory.fanv2GetActive        = config["fanv2GetActive"]        || "V130.0";
      this.fanv2Accessory.fanv2SetActiveOn      = config["fanv2SetActiveOn"]      || "V130.1";
      this.fanv2Accessory.fanv2SetActiveOff     = config["fanv2SetActiveOff"]     || "V130.2";
      this.fanv2Accessory.fanv2CurrentFanState  = config["fanv2CurrentFanState"]  || "VW131";
      this.fanv2Accessory.fanv2TargetFanState   = config["fanv2TargetFanState"]   || "V130.3";
      this.fanv2Accessory.fanv2GetRotationSpeed = config["fanv2GetRotationSpeed"] || "VW133";
      this.fanv2Accessory.fanv2SetRotationSpeed = config["fanv2SetRotationSpeed"] || "VW135";

    }

*/