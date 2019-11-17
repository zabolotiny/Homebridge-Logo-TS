import { wait } from "../wait";

let Characteristic: any;

export class MotionSensor {

  static motionSensorType: string = "motionSensor";
  static infoModel: string = "Motion Sensor";

  public motionSensorService: any;
  public motionDetected: string = "M15";

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
      this.motionSensorAutoUpdate();
    }

  }

  //
  // LOGO! Motion Sensor Service
  //

  getStatusActive = async () => {
    return true;
  };

  getMotionDetected = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.motionDetected, async (value: number) => {

      if (value != -1) {

        const state = value == 1 ? true : false;
        this.debugLogBool("MotionDetected ?", state);

        await wait(1);

        this.motionSensorService.updateCharacteristic(
          Characteristic.MotionDetected,
          state
        );

      }

      if (this.updateInterval > 0) {
        this.motionSensorAutoUpdate();
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

  motionSensorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getMotionDetected();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}