import { wait } from "../wait";

let Characteristic: any;

export class HumiditySensor {

  static humiditySensorType: string = "humiditySensor";

  public humiditySensorService: any;
  public humidity: string = "AM1";

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
      this.humiditySensorAutoUpdate();
    }

  }

  //
  // LOGO! Humidity Sensor Service
  //

  getStatusActive = async () => {
    return true;
  };

  getCurrentRelativeHumidity = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.humidity, async (value: number) => {

      if (value != -1) {

        let humi = value / 10;
        this.debugLogNum("CurrentRelativeHumidity ?", humi);

        await wait(1);

        this.humiditySensorService.updateCharacteristic(
          Characteristic.CurrentRelativeHumidity,
          humi
        );

      }

      if (this.updateInterval > 0) {
        this.humiditySensorAutoUpdate();
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

  humiditySensorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getCurrentRelativeHumidity();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}