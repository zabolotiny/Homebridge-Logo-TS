import { wait } from "../wait";

let Characteristic: any;

export class FilterMaintenanceAccessory {

  static filterMaintenanceType: string = "filterMaintenance";

  public filterMaintenanceService: any;
  public filterChangeIndication: string      = "V120.0";
  public filterLifeLevel: string             = "0";
  public filterResetFilterIndication: string = "0";

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  updateCITimer: any;
  updateLLTimer: any;

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
      this.filterMaintenanceCIAutoUpdate();
      this.filterMaintenanceLLAutoUpdate();
    }

  }

  //
  // LOGO! Filter Maintenance Service
  //

  getFilterChangeIndication = async () => {
    // FILTER_OK = 0; CHANGE_FILTER = 1;

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateCITimer);
      this.updateCITimer = 0;
    }

    this.logo.ReadLogo(this.filterChangeIndication, async (value: number) => {
      // LOGO! return 1 for change

      if (value != -1) {

        this.debugLogNum("FilterChangeIndication ?", value);

        await wait(1);

        this.filterMaintenanceService.updateCharacteristic(
          Characteristic.FilterChangeIndication,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.filterMaintenanceCIAutoUpdate();
      }

    });

  };

  getFilterLifeLevel = async () => {

    if (this.logo.isValidLogoAddress(this.filterLifeLevel)) {
      
      // Cancel timer if the call came from the Home-App and not from the update interval.
      // To avoid duplicate queries at the same time.
      if (this.updateInterval > 0) {
        clearTimeout(this.updateLLTimer);
        this.updateLLTimer = 0;
      }

      this.logo.ReadLogo(this.filterLifeLevel, async (value: number) => {

        if (value != -1) {

          this.debugLogNum("FilterLifeLevel ?", value);

          await wait(1);

          this.filterMaintenanceService.updateCharacteristic(
            Characteristic.FilterLifeLevel,
            value
          );

        }

        if (this.updateInterval > 0) {
          this.filterMaintenanceLLAutoUpdate();
        }

      });

    } else {
      
      this.debugLogStr("FilterLifeLevel ?", this.filterLifeLevel);
      return this.defaultFromString(this.filterLifeLevel);

    }

  };

  setResetFilterIndication = async (value: number) => {

    this.debugLogNum("Set ResetFilterIndication to", value);

    if (this.logo.isValidLogoAddress(this.filterResetFilterIndication)) {

      this.logo.WriteLogo(this.filterResetFilterIndication, this.buttonValue, this.pushButton);
      
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

  filterMaintenanceCIAutoUpdate() {

    this.updateCITimer = setTimeout(() => {

      this.getFilterChangeIndication();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  filterMaintenanceLLAutoUpdate() {

    this.updateLLTimer = setTimeout(() => {

      this.getFilterLifeLevel();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}