import { wait } from "../wait";

let Characteristic: any;

export class SmokeSensor {

  static smokeSensorType: string = "smokeSensor";

  public smokeSensorService: any;
  public smokeDetected: string = "M12";

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
      this.smokeSensorAutoUpdate();
    }

  }

  //
  // LOGO! Smoke Sensor Service
  //

  getStatusActive = async () => {
    return true;
  };

  getSmokeDetected = async () => {
    // SMOKE_NOT_DETECTED = 0; SMOKE_DETECTED = 1;

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.smokeDetected, async (value: number) => {

      if (value != -1) {

        this.debugLogNum("SmokeSensorState ?", value);

        await wait(1);

        this.smokeSensorService.updateCharacteristic(
          Characteristic.SmokeDetected,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.smokeSensorAutoUpdate();
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

  smokeSensorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getSmokeDetected();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}