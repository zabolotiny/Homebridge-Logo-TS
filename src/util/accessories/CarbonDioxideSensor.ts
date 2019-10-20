import { wait } from "../wait";

let Characteristic: any;

export class CarbonDioxideSensor {

  static carbonDioxideSensorType: string = "carbonDioxideSensor";

  public carbonDioxideSensorService: any;
  public carbonDioxideLevel: string = "AM3";
  public carbonDioxideLimit: number = 1000;

  log: Function;
  logo: any;
  updateInterval: number;
  debugMsgLog: number;
  lastCarbonDioxideDetected: boolean;
  lastCarbonDioxideLevel: number;
  lastCarbonDioxidePeakLevel: number;
  updateTimer: any;

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
      this.carbonDioxideSensorAutoUpdate();
    }

    this.lastCarbonDioxideDetected             = false;
    this.lastCarbonDioxideLevel                = -1;
    this.lastCarbonDioxidePeakLevel            = -1;

  }

  //
  // LOGO! Carbon Dioxide Sensor Service
  //
  // 1000ppm CO2 (CO2 in Air 0.04% = ~400ppm)

  getStatusActive = async () => {
    return true;
  };

  getCarbonDioxideDetected = async () => {
    // CO2_LEVELS_NORMAL = 0; CO2_LEVELS_ABNORMAL = 1;

    let state = this.lastCarbonDioxideDetected == true ? 1 : 0;
    this.debugLogNum("CarbonDioxideDetected ?", state);
    return state;

  };

  getCarbonDioxideLevel = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.carbonDioxideLevel, async (value: number) => {

      if (value != -1) {

        this.lastCarbonDioxideLevel = value;
        this.debugLogNum("CarbonDioxideLevel ?", value);

        await wait(1);

        this.carbonDioxideSensorService.updateCharacteristic(
          Characteristic.CarbonDioxideLevel,
          value
        );

        let newCarbonDioxideDetected = value > this.carbonDioxideLimit ? true : false;

        if (newCarbonDioxideDetected != this.lastCarbonDioxideDetected) {

          this.lastCarbonDioxideDetected = newCarbonDioxideDetected;

          // CO2_LEVELS_NORMAL = 0; CO2_LEVELS_ABNORMAL = 1;
          let state = newCarbonDioxideDetected == true ? 1 : 0;

          await wait(1);

          this.carbonDioxideSensorService.updateCharacteristic(
            Characteristic.CarbonDioxideDetected,
            state
          );
        }

        if (value > this.lastCarbonDioxidePeakLevel) {
          this.lastCarbonDioxidePeakLevel = value;
          
          await wait(1);

          this.carbonDioxideSensorService.updateCharacteristic(
            Characteristic.CarbonDioxidePeakLevel,
            value
          );
        }

      }

      if (this.updateInterval > 0) {
        this.carbonDioxideSensorAutoUpdate();
      }

    });

  };

  getCarbonDioxidePeakLevel = async () => {
    
    this.debugLogNum("CarbonDioxidePeakLevel ?", this.lastCarbonDioxidePeakLevel);
    return this.lastCarbonDioxidePeakLevel;

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

  carbonDioxideSensorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getCarbonDioxideLevel();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}