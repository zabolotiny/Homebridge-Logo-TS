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

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  updateATimer: any;
  updateIUTimer: any;

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
    }

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

}