import { wait } from "../wait";

let Characteristic: any;

export class FilterMaintenanceAccessory {

  static filterMaintenanceType: string = "filterMaintenance";

  public filterMaintenanceService: any;
  public filterChangeIndication: string = "V120.0";
  public filterLifeLevel: string        = "VW122";

  log: Function;
  logo: any;
  updateInterval: number;
  debugMsgLog: number;
  updateCITimer: any;
  updateLLTimer: any;

  constructor(log: Function, 
              logo: any,
              updateInterval: number,
              debugMsgLog: number,
              characteristic: any
              ) {

    this.log            = log;
    this.logo           = logo;
    this.updateInterval = updateInterval,
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