import { wait } from "../wait";

let Characteristic: any;

export class IrrigationSystemAccessory {

  static irrigationSystemType: string = "irrigationSystem";
  static infoModel: string = "Irrigation System";

  public irrigationSystemService: any;

  public irrigationSystemGetActive: string      = "V400.0";
  public irrigationSystemSetActiveOn: string    = "V400.1";
  public irrigationSystemSetActiveOff: string   = "V400.2";
  public irrigationSystemGetProgramMode: string = "VW402";
  public irrigationSystemGetInUse: string       = "V400.3";

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  updateATimer: any;
  updatePMTimer: any;
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
      this.irrigationSystemAAutoUpdate();
      this.irrigationSystemPMAutoUpdate();
      this.irrigationSystemIUAutoUpdate();
    }

  }

  //
  // LOGO! IrrigationSystem Service
  //

  getActive = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateATimer);
      this.updateATimer = 0;
    }

    this.logo.ReadLogo(this.irrigationSystemGetActive, async (state: number) => {

      if (state != -1) {

        this.debugLogNum("Active ?", state);

        await wait(1);

        this.irrigationSystemService.updateCharacteristic(
          Characteristic.Active,
          state
        );

      }

      if (this.updateInterval > 0) {
        this.irrigationSystemAAutoUpdate();
      }

    });

  };

  setActive = async (state: number) => {

    this.debugLogNum("Set Active to", state);

    if (state == 1) {

      this.logo.WriteLogo(this.irrigationSystemSetActiveOn, this.buttonValue, this.pushButton);

    } else {

      this.logo.WriteLogo(this.irrigationSystemSetActiveOff, this.buttonValue, this.pushButton);

    }

  };

  getProgramMode = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updatePMTimer);
      this.updatePMTimer = 0;
    }

    this.logo.ReadLogo(this.irrigationSystemGetProgramMode, async (value: number) => {

      if (value != -1) {

        this.debugLogNum("ProgramMode ?", value);

        await wait(1);

        this.irrigationSystemService.updateCharacteristic(
          Characteristic.ProgramMode,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.irrigationSystemPMAutoUpdate();
      }

    });

  };

  getInUse = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateIUTimer);
      this.updateIUTimer = 0;
    }

    this.logo.ReadLogo(this.irrigationSystemGetInUse, async (value: number) => {

      if (value != -1) {

        this.debugLogNum("InUse ?", value);

        await wait(1);

        this.irrigationSystemService.updateCharacteristic(
          Characteristic.InUse,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.irrigationSystemIUAutoUpdate();
      }

    });

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

  irrigationSystemAAutoUpdate() {

    this.updateATimer = setTimeout(() => {

      this.getActive();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  irrigationSystemPMAutoUpdate() {

    this.updatePMTimer = setTimeout(() => {

      this.getProgramMode();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  irrigationSystemIUAutoUpdate() {

    this.updateIUTimer = setTimeout(() => {

      this.getInUse();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}