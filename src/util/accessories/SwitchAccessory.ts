import { wait } from "../wait";

let Characteristic: any;

export class SwitchAccessory {

  static switchType: string = "switch";
  static infoModel: string = "Switch";

  public switchService: any;

  public switchGet: string    = "Q1";;
  public switchSetOn: string  = "V2.0";
  public switchSetOff: string = "V3.0";

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
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
      this.switchAutoUpdate();
    }

  }

  //
  // LOGO! Switch Service
  //

  getSwitchOn = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.switchGet, async (value: number) => {

      if (value != -1) {

        const on = value == 1 ? true : false;
        this.debugLogBool("Switch ?", on);

        await wait(1);

        this.switchService.updateCharacteristic(
          Characteristic.On,
          on
        );

      }

      if (this.updateInterval > 0) {
        this.switchAutoUpdate();
      }

    });

  };

  setSwitchOn = async (on: boolean) => {
    this.debugLogBool("Set switch to", on);

    if (on) {
      this.logo.WriteLogo(this.switchSetOn, this.buttonValue, this.pushButton);
    } else {
      this.logo.WriteLogo(this.switchSetOff, this.buttonValue, this.pushButton);
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

  switchAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getSwitchOn();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}