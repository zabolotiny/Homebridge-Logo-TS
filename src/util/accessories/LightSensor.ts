import { wait } from "../wait";

let Characteristic: any;

export class LightSensor {

  static lightSensorType: string = "lightSensor";

  public lightSensorService: any;
  public lightLevel: string = "AM3";

  public lightLDRLevelParts: number = 3;

  public lightLDRLevelMin: number   = 0;
  public lightLDRLevelMax: number   = 1000;
  public lightLDRLevelP1Min: number = 423;
  public lightLDRLevelP2Min: number = 696;
  
  public lightLDRLevelP0S: number   = 1.92170242765178;
  public lightLDRLevelP0Y: number   = -2.27030759992747;
  public lightLDRLevelP1S: number   = 3.85547119519305;
  public lightLDRLevelP1Y: number   = -7.34902696724256;
  public lightLDRLevelP2S: number   = 16.3271951868277;
  public lightLDRLevelP2Y: number   = -42.8043502895429;

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

        let lux = this.calculateLightLevelVoltInLux(value);
        this.debugLogNum("CurrentAmbientLightLevel ?", lux);

        await wait(1);

        this.lightSensorService.updateCharacteristic(
          Characteristic.CurrentAmbientLightLevel,
          lux
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

  calculateLightLevelVoltInLux(volt: number): number {

    let lux = volt;

    if (this.lightLDRLevelParts == 1) {
      if ((volt >= this.lightLDRLevelMin) && (volt <= this.lightLDRLevelMax)) {
        let a = Math.pow(10, this.lightLDRLevelP0Y);
        let b = this.lightLDRLevelP0S;
        lux = a * Math.pow(volt, b);
      }
    }

    if (this.lightLDRLevelParts == 2) {
      if ((volt >= this.lightLDRLevelMin) && (volt < this.lightLDRLevelP1Min)) {
        let a = Math.pow(10, this.lightLDRLevelP0Y);
        let b = this.lightLDRLevelP0S;
        lux = a * Math.pow(volt, b);
      }
      if ((volt >= this.lightLDRLevelP1Min) && (volt <= this.lightLDRLevelMax)) {
        let a = Math.pow(10, this.lightLDRLevelP1Y);
        let b = this.lightLDRLevelP1S;
        lux = a * Math.pow(volt, b);
      }
    }

    if (this.lightLDRLevelParts == 3) {
      if ((volt >= this.lightLDRLevelMin) && (volt < this.lightLDRLevelP1Min)) {
        let a = Math.pow(10, this.lightLDRLevelP0Y);
        let b = this.lightLDRLevelP0S;
        lux = a * Math.pow(volt, b);
      }
      if ((volt >= this.lightLDRLevelP1Min) && (volt < this.lightLDRLevelP2Min)) {
        let a = Math.pow(10, this.lightLDRLevelP1Y);
        let b = this.lightLDRLevelP1S;
        lux = a * Math.pow(volt, b);
      }
      if ((volt >= this.lightLDRLevelP2Min) && (volt <= this.lightLDRLevelMax)) {
        let a = Math.pow(10, this.lightLDRLevelP2Y);
        let b = this.lightLDRLevelP2S;
        lux = a * Math.pow(volt, b);
      }
    }

    return lux;
  }

  lightSensorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getCurrentAmbientLightLevel();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}
