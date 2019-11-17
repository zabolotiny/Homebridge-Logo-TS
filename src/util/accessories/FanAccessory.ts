import { wait } from "../wait";

let Characteristic: any;

export class FanAccessory {

  static fanType: string = "fan";
  static infoModel: string = "Fan";

  public fanService: any;
  public fanGetOn: string                   = "V130.0";
  public fanSetOn: string                   = "V130.1";
  public fanSetOff: string                  = "V130.2";
  public fanGetRotationDirection: string    = "0";
  public fanSetRotationDirectionCW: string  = "0";
  public fanSetRotationDirectionCCW: string = "0";
  public fanGetRotationSpeed: string        = "0";
  public fanSetRotationSpeed: string        = "0";

  accessoryAnalogTimeOut = 500;

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  lastOn: boolean;
  lastRotationSpeed: number;
  lastRotationSpeedTime: number;
  lastRotationSpeedTimerSet: boolean;
  updateOnTimer: any;
  updateRDTimer: any;
  updateRSTimer: any;

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
      this.fanOnAutoUpdate();
      this.fanRDAutoUpdate();
      this.fanRSAutoUpdate();
    }

    this.lastOn                    = false;
    this.lastRotationSpeed         = -1;
    this.lastRotationSpeedTime     = -1;
    this.lastRotationSpeedTimerSet = false;

  }

  //
  // LOGO! Fan Service
  //

  getOn = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateOnTimer);
      this.updateOnTimer = 0;
    }

    this.logo.ReadLogo(this.fanGetOn, async (value: number) => {
      // LOGO! return 1 for on

      if (value != -1) {

        let on: boolean = value == 1 ? true : false;
        this.lastOn = on;
        this.debugLogBool("On ?", on);
        
        await wait(1);

        this.fanService.updateCharacteristic(
          Characteristic.On,
          on
        );

      }

      if (this.updateInterval > 0) {
        this.fanOnAutoUpdate();
      }

    });

  };

  setOn = async (value: boolean) => {

    this.debugLogBool("Set On to", value);

    if (value != this.lastOn) {

      this.lastOn = value;

      if (value == true) {
        this.logo.WriteLogo(this.fanSetOn, this.buttonValue, this.pushButton);
      } else {
        this.logo.WriteLogo(this.fanSetOff, this.buttonValue, this.pushButton);
      }
      
    }
    
  };

  getRotationDirection = async () => {
    // CLOCKWISE = 0; COUNTER_CLOCKWISE = 1;

    if (this.logo.isValidLogoAddress(this.fanGetRotationDirection)) {
      
      // Cancel timer if the call came from the Home-App and not from the update interval.
      // To avoid duplicate queries at the same time.
      if (this.updateInterval > 0) {
        clearTimeout(this.updateRDTimer);
        this.updateRDTimer = 0;
      }

      this.logo.ReadLogo(this.fanGetRotationDirection, async (value: number) => {

        if (value != -1) {

          this.debugLogNum("RotationDirection ?", value);

          await wait(1);

          this.fanService.updateCharacteristic(
            Characteristic.RotationDirection,
            value
          );

        }

        if (this.updateInterval > 0) {
          this.fanRDAutoUpdate();
        }

      });

    } else {
      
      this.debugLogStr("RotationDirection ?", this.fanGetRotationDirection);
      return this.defaultFromString(this.fanGetRotationDirection);

    }

  };

  setRotationDirection = async (value: number) => {

    if (this.logo.isValidLogoAddress(this.fanSetRotationDirectionCW) && this.logo.isValidLogoAddress(this.fanSetRotationDirectionCCW)) {
      
      this.debugLogNum("Set RotationDirection to", value);

      if (value == 1) {

        this.logo.WriteLogo(this.fanSetRotationDirectionCCW, this.buttonValue, this.pushButton);
        
      } else {

        this.logo.WriteLogo(this.fanSetRotationDirectionCW, this.buttonValue, this.pushButton);
        
      }

    }

  };

  getRotationSpeed = async () => {

    if (this.logo.isValidLogoAddress(this.fanGetRotationSpeed)) {
      
      // Cancel timer if the call came from the Home-App and not from the update interval.
      // To avoid duplicate queries at the same time.
      if (this.updateInterval > 0) {
        clearTimeout(this.updateRSTimer);
        this.updateRSTimer = 0;
      }

      this.logo.ReadLogo(this.fanGetRotationSpeed, async (value: number) => {

        if (value != -1) {

          this.debugLogNum("RotationSpeed ?", value);

          await wait(1);

          this.fanService.updateCharacteristic(
            Characteristic.RotationSpeed,
            value
          );

        }

        if (this.updateInterval > 0) {
          this.fanRSAutoUpdate();
        }

      });

    } else {
      
      this.debugLogStr("RotationSpeed ?", this.fanGetRotationSpeed);
      return this.defaultFromString(this.fanGetRotationSpeed);

    }

  };

  setRotationSpeed = async (value: number) => {

    if (this.logo.isValidLogoAddress(this.fanGetRotationSpeed)) {
      
      this.lastRotationSpeed = value;
      this.lastRotationSpeedTime = + new Date();
      if (!this.lastRotationSpeedTimerSet) {
        this.fanRotationSpeedTimeout();
      }

    }

  };

  //
  // Helper Functions
  //

  debugLogStr(msg: string, str: string) {
    if (this.debugMsgLog == 1) {
      this.log(msg, str);
    }
  }
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
  defaultFromString(str: string): any {
    if (str == "false") {
      return false;
    }
    if (str == "true") {
      return true;
    }
    if (str == "1") {
      return 1;
    }
    if (str == "0") {
      return 0;
    }
    return -1;
  }

  fanRotationSpeedTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastRotationSpeedTime + this.accessoryAnalogTimeOut)) || (this.lastRotationSpeed == 0) || (this.lastRotationSpeed == 100)) {

          this.debugLogNum("Set RotationSpeed to", this.lastRotationSpeed);
          this.lastRotationSpeedTimerSet = false;

          this.logo.WriteLogo(this.fanSetRotationSpeed, this.lastRotationSpeed, 0);

        } else {

          this.lastRotationSpeedTimerSet = true;
          this.fanRotationSpeedTimeout();
        }

    }, 100);
  }

  fanOnAutoUpdate() {

    this.updateOnTimer = setTimeout(() => {

      this.getOn();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  fanRDAutoUpdate() {

    if (this.logo.isValidLogoAddress(this.fanGetRotationDirection)) {

      this.updateRDTimer = setTimeout(() => {

        this.getRotationDirection();
  
      }, this.updateInterval + Math.floor(Math.random() * 10000));
      
    }

  }

  fanRSAutoUpdate() {

    if (this.logo.isValidLogoAddress(this.fanGetRotationSpeed)) {

      this.updateRSTimer = setTimeout(() => {

        this.getRotationSpeed();
  
      }, this.updateInterval + Math.floor(Math.random() * 10000));
      
    }

  }

}