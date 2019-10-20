import { wait } from "../wait";

let Characteristic: any;

export class LightSensor {

  static lightSensorType: string = "lightSensor";

  public lightSensorService: any;
  public lightLevel: string = "AM3";

  log: Function;
  logo: any;
  updateInterval: number;
  debugMsgLog: number;
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
      this.lightSensorAutoUpdate();
    }

  }

  //
  // LOGO! Light Sensor Service
  //

  getStatusActive = async () => {
    return true;
  };

  getCurrentAmbientLightLevel = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.lightLevel, async (value: number) => {

      if (value != -1) {

        this.debugLogNum("CurrentAmbientLightLevel ?", value);

        await wait(1);

        this.lightSensorService.updateCharacteristic(
          Characteristic.CurrentAmbientLightLevel,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.lightSensorAutoUpdate();
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

  lightSensorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getCurrentAmbientLightLevel();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}