import { wait } from "../wait";

let Characteristic: any;

export class LightbulbAccessory {

  static lightbulbType: string = "lightbulb";
  static infoModel: string = "Lightbulb";

  public lightbulbService: any;

  public lightbulbSetOn: string         = "V7.0";
  public lightbulbSetOff: string        = "V7.1";
  public lightbulbSetBrightness: string = "VW70";
  public lightbulbGetBrightness: string = "VW72";

  accessoryAnalogTimeOut = 500;

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  lastLightbulbOn: number;
  lastLightbulbTargetBrightness: number;
  lastLightbulbTargetBrightnessTime: number;
  lastLightbulbTargetBrightnessTimerSet: boolean;
  updateTimer: any;

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
      this.lightbulbAutoUpdate();
    }

    this.lastLightbulbOn                       = -1;
    this.lastLightbulbTargetBrightness         = -1;
    this.lastLightbulbTargetBrightnessTime     = -1;
    this.lastLightbulbTargetBrightnessTimerSet = false;

  }

  //
  // LOGO! LightBulb Service
  //

  getLightbulbOn = async () => {

    const on = this.lastLightbulbOn == 1 ? true : false;
    this.debugLogBool("Lightbulb ?", on);
    return on;

  };

  setLightbulbOn = async (on: boolean) => {

    let new_on: number = on ? 1 : 0;

    if ((this.lastLightbulbOn == -1) || (this.lastLightbulbOn != new_on)) {

      this.debugLogBool("Set Lightbulb to", on);
      this.lastLightbulbOn = new_on;

      if (on) {
        this.logo.WriteLogo(this.lightbulbSetOn, this.buttonValue, this.pushButton);
      } else {
        this.logo.WriteLogo(this.lightbulbSetOff, this.buttonValue, this.pushButton);
      }

    }

  };

  getLightbulbBrightness = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.lightbulbGetBrightness, async (value: number) => {

      if (value != -1) {

        this.debugLogNum("LightbulbBrightness ?", value);
        this.lastLightbulbOn = value > 0 ? 1 : 0;

        await wait(1);

        this.lightbulbService.updateCharacteristic(
          Characteristic.On,
          (value > 0 ? true : false)
        );

        await wait(1);

        this.lightbulbService.updateCharacteristic(
          Characteristic.Brightness,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.lightbulbAutoUpdate();
      }

    });

  };

  setLightbulbBrightness = async (bright: number) => {

    this.lastLightbulbTargetBrightness = bright;
    this.lastLightbulbTargetBrightnessTime = + new Date();
    if (!this.lastLightbulbTargetBrightnessTimerSet) {
      this.lightbulbTargetBrightnessTimeout();
    }

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

  lightbulbTargetBrightnessTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastLightbulbTargetBrightnessTime + this.accessoryAnalogTimeOut)) || (this.lastLightbulbTargetBrightness == 0) || (this.lastLightbulbTargetBrightness == 100)) {

          this.debugLogNum("Set LightbulbTargetBrightness to", this.lastLightbulbTargetBrightness);
          this.lastLightbulbTargetBrightnessTimerSet = false;

          this.logo.WriteLogo(this.lightbulbSetBrightness, this.lastLightbulbTargetBrightness, 0);

        } else {

          this.lastLightbulbTargetBrightnessTimerSet = true;
          this.lightbulbTargetBrightnessTimeout();
        }

    }, 100);
  }

  lightbulbAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getLightbulbBrightness();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}