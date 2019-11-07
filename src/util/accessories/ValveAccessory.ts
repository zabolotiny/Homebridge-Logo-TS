import { wait } from "../wait";

let Characteristic: any;

export class ValveAccessory {

  static valveType: string = "valve";

  public valveService: any;

  public valveGetActive: string    = "V400.0";
  public valveSetActiveOn: string  = "V400.1";
  public valveSetActiveOff: string = "V400.2";
  public valveGetInUse: string     = "V400.3";
  public valveType: number         = 0;
  public valveSetDuration: string  = "0";
  public valveGetDuration: string  = "0";

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  lastSetDuration: number;
  updateATimer: any;
  updateIUTimer: any;
  updateRDTimer: any;

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
      this.valveAAutoUpdate();
      this.valveIUAutoUpdate();
      this.valveRDAutoUpdate();
    }

    this.lastSetDuration = -1;

  }

  //
  // LOGO! Valve Service
  //

  getActive = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateATimer);
      this.updateATimer = 0;
    }

    this.logo.ReadLogo(this.valveGetActive, async (state: number) => {

      if (state != -1) {

        this.debugLogNum("Active ?", state);

        await wait(1);

        this.valveService.updateCharacteristic(
          Characteristic.Active,
          state
        );

      }

      if (this.updateInterval > 0) {
        this.valveAAutoUpdate();
      }

    });

  };

  setActive = async (state: number) => {

    this.debugLogNum("Set Active to", state);

    if (state == 1) {

      this.logo.WriteLogo(this.valveSetActiveOn, this.buttonValue, this.pushButton);

    } else {

      this.logo.WriteLogo(this.valveSetActiveOff, this.buttonValue, this.pushButton);

    }

  };

  getInUse = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateIUTimer);
      this.updateIUTimer = 0;
    }

    this.logo.ReadLogo(this.valveGetInUse, async (value: number) => {

      if (value != -1) {

        this.debugLogNum("InUse ?", value);

        await wait(1);

        this.valveService.updateCharacteristic(
          Characteristic.InUse,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.valveIUAutoUpdate();
      }

    });

  };

  getValveType = async () => {
    // GENERIC_VALVE = 0; IRRIGATION = 1; SHOWER_HEAD = 2; WATER_FAUCET = 3;

    return this.valveType;

  };

  getSetDuration = async () => {

    this.debugLogNum("SetDuration ?", this.lastSetDuration);

    if (this.lastSetDuration != -1) {
      return this.lastSetDuration;
    } else {
      return 0;
    }

  };

  setSetDuration = async (value: number) => {

    this.debugLogNum("Set SetDuration to", value);

    if (this.logo.isValidLogoAddress(this.valveSetDuration)) {

      this.lastSetDuration = value;
      this.logo.WriteLogo(this.valveSetDuration, value, 0);

    }

  };

  getRemainingDuration = async () => {
    // true or false

    if (this.logo.isValidLogoAddress(this.valveGetDuration)) {

      // Cancel timer if the call came from the Home-App and not from the update interval.
      // To avoid duplicate queries at the same time.
      if (this.updateInterval > 0) {
        clearTimeout(this.updateRDTimer);
        this.updateRDTimer = 0;
      }

      this.logo.ReadLogo(this.valveGetDuration, async (value: number) => {

        if (value != -1) {

          this.debugLogNum("RemainingDuration ?", value);

          await wait(1);

          this.valveService.updateCharacteristic(
            Characteristic.RemainingDuration,
            value
          );

        }

        if (this.updateInterval > 0) {
          this.valveRDAutoUpdate();
        }

      });

      
    } else {

      this.debugLogStr("RemainingDuration ?", this.valveGetDuration);
      return this.defaultFromString(this.valveGetDuration);
      
    }

  };

  //
  // Helper Functions
  //

  debugLogStr(msg: string, str: string) {
    if (this.debugMsgLog == 1) {
      this.log(msg, str);
    }
  }
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
  defaultFromString(str: string): any {
    if (str == "false") {
      return false;
    }
    if (str == "true") {
      return true;
    }
    if (str == "1") {
      return 1;
    }
    if (str == "0") {
      return 0;
    }
    return -1;
  }

  valveAAutoUpdate() {

    this.updateATimer = setTimeout(() => {

      this.getActive();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  valveIUAutoUpdate() {

    this.updateIUTimer = setTimeout(() => {

      this.getInUse();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  valveRDAutoUpdate() {

    if (this.logo.isValidLogoAddress(this.valveGetDuration)) {
      
      this.updateRDTimer = setTimeout(() => {

        this.getRemainingDuration();
  
      }, this.updateInterval + Math.floor(Math.random() * 10000));

    }

  }

}