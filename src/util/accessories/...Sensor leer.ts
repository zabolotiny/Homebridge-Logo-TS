import { wait } from "../wait";

let Characteristic: any;

export class ...Sensor {

  static ...SensorType: string = "...Sensor";

  public ...SensorService: any;
  public ...: string = "AM3";

  log: Function;
  logo: any;
  updateInterval: number;
  debugMsgLog: number;
  last...: number;
  last...: number;
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
      this...SensorAutoUpdate();
    }

    this.last... = -1;

  }

  //
  // LOGO! Air Quality Sensor Service
  //

  getStatusActive = async () => {
    return true;
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

  

}