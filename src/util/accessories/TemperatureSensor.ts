import { wait } from "../wait";

let Characteristic: any;

export class TemperatureSensor {

  static temperatureSensorType: string = "temperatureSensor";

  public temperatureSensorService: any;
  public temperature: string = "AM2";

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
      this.temperatureSensorAutoUpdate();
    }

  }

  //
  // LOGO! Temperature Sensor Service
  //

  getStatusActive = async () => {
    return true;
  };

  getCurrentTemperature = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.temperature, async (value: number) => {

      if (value != -1) {

        let temp = (value / 10);
        if ((temp >= 0) && (temp <= 100)) {

          this.debugLogNum("CurrentTemperature ?", temp);

          await wait(1);

          this.temperatureSensorService.updateCharacteristic(
            Characteristic.CurrentTemperature,
            temp
          );
          
        } else {

          this.debugLogNum("Wrong CurrentTemperature (only 0-100) ?", temp);
          
        }
        

      }

      if (this.updateInterval > 0) {
        this.temperatureSensorAutoUpdate();
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

  temperatureSensorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getCurrentTemperature();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}