import { wait } from "../wait";

let Characteristic: any;

export class Fanv2Accessory {

  static fanv2Type: string = "fanv2";
  static infoModel: string = "Fan v2";

  public fanv2Service: any;
  public fanv2GetActive: string               = "V130.0";
  public fanv2SetActiveOn: string             = "V130.1";
  public fanv2SetActiveOff: string            = "V130.2";
  public fanv2GetCurrentFanState: string      = "0";
  public fanv2SetTargetFanStateAuto: string   = "0";
  public fanv2SetTargetFanStateManual: string = "0";
  public fanv2GetRotationDirection: string    = "0";
  public fanv2SetRotationDirectionCW: string  = "0";
  public fanv2SetRotationDirectionCCW: string = "0";
  public fanv2GetRotationSpeed: string        = "0";
  public fanv2SetRotationSpeed: string        = "0";

  accessoryAnalogTimeOut = 500;

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  lastActive: number;
  lastRotationSpeed: number;
  lastTargetFanState: number;
  lastRotationSpeedTime: number;
  lastRotationSpeedTimerSet: boolean;
  updateAcTimer: any;
  updateFSTimer: any;
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
      this.fanv2AcAutoUpdate();
      this.fanv2FSAutoUpdate();
      this.fanv2RDAutoUpdate();
      this.fanv2RSAutoUpdate();
    }

    this.lastActive                = -1;
    this.lastTargetFanState        = -1;
    this.lastRotationSpeed         = -1;
    this.lastRotationSpeedTime     = -1;
    this.lastRotationSpeedTimerSet = false;

  }

  //
  // LOGO! Fanv2 Service
  //

  getActive = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateAcTimer);
      this.updateAcTimer = 0;
    }

    this.logo.ReadLogo(this.fanv2GetActive, async (value: number) => {
      // LOGO! return 1 for Activ

      if (value != -1) {

        this.lastActive = value;
        this.debugLogNum("Active ?", value);
        
        await wait(1);

        this.fanv2Service.updateCharacteristic(
          Characteristic.Active,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.fanv2AcAutoUpdate();
      }

    });

  };

  setActive = async (value: number) => {

    this.debugLogNum("Set Active to", value);

    if (value != this.lastActive) {

      this.lastActive = value;

      if (value == 1) {
        this.logo.WriteLogo(this.fanv2SetActiveOn, this.buttonValue, this.pushButton);
      } else {
        this.logo.WriteLogo(this.fanv2SetActiveOff, this.buttonValue, this.pushButton);
      }
      
    }
    
  };

  getCurrentFanState = async () => {
    // INACTIVE = 0; IDLE = 1; BLOWING_AIR = 2;

    if (this.logo.isValidLogoAddress(this.fanv2GetCurrentFanState)) {
      
      // Cancel timer if the call came from the Home-App and not from the update interval.
      // To avoid duplicate queries at the same time.
      if (this.updateInterval > 0) {
        clearTimeout(this.updateFSTimer);
        this.updateFSTimer = 0;
      }

      this.logo.ReadLogo(this.fanv2GetCurrentFanState, async (value: number) => {

        if (value != -1) {

          this.debugLogNum("CurrentFanState ?", value);

          await wait(1);

          this.fanv2Service.updateCharacteristic(
            Characteristic.CurrentFanState,
            value
          );

        }

        if (this.updateInterval > 0) {
          this.fanv2FSAutoUpdate();
        }

      });

    } else {
      
      this.debugLogStr("CurrentFanState ?", this.fanv2GetCurrentFanState);
      return this.defaultFromString(this.fanv2GetCurrentFanState);

    }

  };

  getTargetFanState = async () => {
    // MANUAL = 0; AUTO = 1;

    if (this.logo.isValidLogoAddress(this.fanv2SetTargetFanStateAuto) && this.logo.isValidLogoAddress(this.fanv2SetTargetFanStateManual)) {
      
      this.debugLogNum("TargetFanState ?", this.lastTargetFanState);
      return this.lastTargetFanState == -1 ? 1 : this.lastTargetFanState;

    } else {
      
      this.debugLogStr("TargetFanState ?", this.fanv2SetTargetFanStateAuto);
      return this.defaultFromString(this.fanv2SetTargetFanStateAuto);

    }

  };

  setTargetFanState = async (value: number) => {
    // MANUAL = 0; AUTO = 1;

    if (this.logo.isValidLogoAddress(this.fanv2SetTargetFanStateAuto) && this.logo.isValidLogoAddress(this.fanv2SetTargetFanStateManual)) {
      
      this.debugLogNum("Set TargetFanState to", value);
      this.lastTargetFanState = value;

      if (value == 1) {

        this.logo.WriteLogo(this.fanv2SetTargetFanStateAuto, this.buttonValue, this.pushButton);
        
      } else {

        this.logo.WriteLogo(this.fanv2SetTargetFanStateManual, this.buttonValue, this.pushButton);
        
      }

    }

  };

  getRotationDirection = async () => {
    // CLOCKWISE = 0; COUNTER_CLOCKWISE = 1;

    if (this.logo.isValidLogoAddress(this.fanv2GetRotationDirection)) {
      
      // Cancel timer if the call came from the Home-App and not from the update interval.
      // To avoid duplicate queries at the same time.
      if (this.updateInterval > 0) {
        clearTimeout(this.updateRDTimer);
        this.updateRDTimer = 0;
      }

      this.logo.ReadLogo(this.fanv2GetRotationDirection, async (value: number) => {

        if (value != -1) {

          this.debugLogNum("RotationDirection ?", value);

          await wait(1);

          this.fanv2Service.updateCharacteristic(
            Characteristic.RotationDirection,
            value
          );

        }

        if (this.updateInterval > 0) {
          this.fanv2RDAutoUpdate();
        }

      });

    } else {
      
      this.debugLogStr("RotationDirection ?", this.fanv2GetRotationDirection);
      return this.defaultFromString(this.fanv2GetRotationDirection);

    }

  };

  setRotationDirection = async (value: number) => {

    if (this.logo.isValidLogoAddress(this.fanv2SetRotationDirectionCW) && this.logo.isValidLogoAddress(this.fanv2SetRotationDirectionCCW)) {
      
      this.debugLogNum("Set RotationDirection to", value);

      if (value == 1) {

        this.logo.WriteLogo(this.fanv2SetRotationDirectionCCW, this.buttonValue, this.pushButton);
        
      } else {

        this.logo.WriteLogo(this.fanv2SetRotationDirectionCW, this.buttonValue, this.pushButton);
        
      }

    }

  };

  getRotationSpeed = async () => {

    if (this.logo.isValidLogoAddress(this.fanv2GetRotationSpeed)) {
      
      // Cancel timer if the call came from the Home-App and not from the update interval.
      // To avoid duplicate queries at the same time.
      if (this.updateInterval > 0) {
        clearTimeout(this.updateRSTimer);
        this.updateRSTimer = 0;
      }

      this.logo.ReadLogo(this.fanv2GetRotationSpeed, async (value: number) => {

        if (value != -1) {

          this.debugLogNum("RotationSpeed ?", value);

          await wait(1);

          this.fanv2Service.updateCharacteristic(
            Characteristic.RotationSpeed,
            value
          );

        }

        if (this.updateInterval > 0) {
          this.fanv2RSAutoUpdate();
        }

      });

    } else {
      
      this.debugLogStr("RotationSpeed ?", this.fanv2GetRotationSpeed);
      return this.defaultFromString(this.fanv2GetRotationSpeed);

    }

  };

  setRotationSpeed = async (value: number) => {

    if (this.logo.isValidLogoAddress(this.fanv2GetRotationSpeed)) {
      
      this.lastRotationSpeed = value;
      this.lastRotationSpeedTime = + new Date();
      if (!this.lastRotationSpeedTimerSet) {
        this.fanv2RotationSpeedTimeout();
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

  fanv2RotationSpeedTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastRotationSpeedTime + this.accessoryAnalogTimeOut)) || (this.lastRotationSpeed == 0) || (this.lastRotationSpeed == 100)) {

          this.debugLogNum("Set RotationSpeed to", this.lastRotationSpeed);
          this.lastRotationSpeedTimerSet = false;

          this.logo.WriteLogo(this.fanv2SetRotationSpeed, this.lastRotationSpeed, 0);

        } else {

          this.lastRotationSpeedTimerSet = true;
          this.fanv2RotationSpeedTimeout();
        }

    }, 100);
  }

  fanv2AcAutoUpdate() {

    this.updateAcTimer = setTimeout(() => {

      this.getActive();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  fanv2FSAutoUpdate() {

    if (this.logo.isValidLogoAddress(this.fanv2GetCurrentFanState)) {

      this.updateFSTimer = setTimeout(() => {

        this.getCurrentFanState();
  
      }, this.updateInterval + Math.floor(Math.random() * 10000));
      
    }

  }

  fanv2RDAutoUpdate() {

    if (this.logo.isValidLogoAddress(this.fanv2GetRotationDirection)) {

      this.updateRDTimer = setTimeout(() => {

        this.getRotationDirection();
  
      }, this.updateInterval + Math.floor(Math.random() * 10000));
      
    }

  }

  fanv2RSAutoUpdate() {

    if (this.logo.isValidLogoAddress(this.fanv2GetRotationSpeed)) {

      this.updateRSTimer = setTimeout(() => {

        this.getRotationSpeed();
  
      }, this.updateInterval + Math.floor(Math.random() * 10000));
      
    }

  }

}