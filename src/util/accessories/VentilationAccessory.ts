import { wait } from "../wait";

let Characteristic: any;

export class VentilationAccessory {

  static ventilationType: string = "ventilation";
  static infoModel: string = "Ventilation";

  public ventilationService: any;
  public ventilationGetOn: string                   = "V130.0";
  public ventilationSetOn: string                   = "V130.1";
  public ventilationSetOff: string                  = "V130.2";
  public ventilationGetRotationDirection: string    = "0";
  public ventilationSetRotationDirectionCW: string  = "0";
  public ventilationSetRotationDirectionCCW: string = "0";
  public ventilationGetRotationSpeed: string        = "0";
  public ventilationSetRotationSpeed: string        = "0";

  public ventilationGetFilterChangeIndication: string = "V120.0";
  public ventilationGetFilterLifeLevel: string        = "0";
  public ventilationSetResetFilterIndication: string  = "0";

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
  updateFCITimer: any;
  updateFLLTimer: any;

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
      this.ventilationOnAutoUpdate();
      this.ventilationRDAutoUpdate();
      this.ventilationRSAutoUpdate();
      this.ventilationFCIAutoUpdate();
      this.ventilationFLLAutoUpdate();
    }

    this.lastOn                    = false;
    this.lastRotationSpeed         = -1;
    this.lastRotationSpeedTime     = -1;
    this.lastRotationSpeedTimerSet = false;

  }

  //
  // LOGO! Ventilation Service
  //

  getOn = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateOnTimer);
      this.updateOnTimer = 0;
    }

    this.logo.ReadLogo(this.ventilationGetOn, async (value: number) => {
      // LOGO! return 1 for on

      if (value != -1) {

        let on: boolean = value == 1 ? true : false;
        this.lastOn = on;
        this.debugLogBool("On ?", on);
        
        await wait(1);

        this.ventilationService.updateCharacteristic(
          Characteristic.On,
          on
        );

      }

      if (this.updateInterval > 0) {
        this.ventilationOnAutoUpdate();
      }

    });

  };

  setOn = async (value: boolean) => {

    this.debugLogBool("Set On to", value);

    if (value != this.lastOn) {

      this.lastOn = value;

      if (value == true) {
        this.logo.WriteLogo(this.ventilationSetOn, this.buttonValue, this.pushButton);
      } else {
        this.logo.WriteLogo(this.ventilationSetOff, this.buttonValue, this.pushButton);
      }
      
    }
    
  };

  getRotationDirection = async () => {
    // CLOCKWISE = 0; COUNTER_CLOCKWISE = 1;

    if (this.logo.isValidLogoAddress(this.ventilationGetRotationDirection)) {
      
      // Cancel timer if the call came from the Home-App and not from the update interval.
      // To avoid duplicate queries at the same time.
      if (this.updateInterval > 0) {
        clearTimeout(this.updateRDTimer);
        this.updateRDTimer = 0;
      }

      this.logo.ReadLogo(this.ventilationGetRotationDirection, async (value: number) => {

        if (value != -1) {

          this.debugLogNum("RotationDirection ?", value);

          await wait(1);

          this.ventilationService.updateCharacteristic(
            Characteristic.RotationDirection,
            value
          );

        }

        if (this.updateInterval > 0) {
          this.ventilationRDAutoUpdate();
        }

      });

    } else {
      
      this.debugLogStr("RotationDirection ?", this.ventilationGetRotationDirection);
      return this.defaultFromString(this.ventilationGetRotationDirection);

    }

  };

  setRotationDirection = async (value: number) => {

    if (this.logo.isValidLogoAddress(this.ventilationSetRotationDirectionCW) && this.logo.isValidLogoAddress(this.ventilationSetRotationDirectionCCW)) {
      
      this.debugLogNum("Set RotationDirection to", value);

      if (value == 1) {

        this.logo.WriteLogo(this.ventilationSetRotationDirectionCCW, this.buttonValue, this.pushButton);
        
      } else {

        this.logo.WriteLogo(this.ventilationSetRotationDirectionCW, this.buttonValue, this.pushButton);
        
      }

    }

  };

  getRotationSpeed = async () => {

    if (this.logo.isValidLogoAddress(this.ventilationGetRotationSpeed)) {
      
      // Cancel timer if the call came from the Home-App and not from the update interval.
      // To avoid duplicate queries at the same time.
      if (this.updateInterval > 0) {
        clearTimeout(this.updateRSTimer);
        this.updateRSTimer = 0;
      }

      this.logo.ReadLogo(this.ventilationGetRotationSpeed, async (value: number) => {

        if (value != -1) {

          this.debugLogNum("RotationSpeed ?", value);

          await wait(1);

          this.ventilationService.updateCharacteristic(
            Characteristic.RotationSpeed,
            value
          );

        }

        if (this.updateInterval > 0) {
          this.ventilationRSAutoUpdate();
        }

      });

    } else {
      
      this.debugLogStr("RotationSpeed ?", this.ventilationGetRotationSpeed);
      return this.defaultFromString(this.ventilationGetRotationSpeed);

    }

  };

  setRotationSpeed = async (value: number) => {

    if (this.logo.isValidLogoAddress(this.ventilationGetRotationSpeed)) {
      
      this.lastRotationSpeed = value;
      this.lastRotationSpeedTime = + new Date();
      if (!this.lastRotationSpeedTimerSet) {
        this.ventilationRotationSpeedTimeout();
      }

    }

  };

  getFilterChangeIndication = async () => {
    // FILTER_OK = 0; CHANGE_FILTER = 1;

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateFCITimer);
      this.updateFCITimer = 0;
    }

    this.logo.ReadLogo(this.ventilationGetFilterChangeIndication, async (value: number) => {
      // LOGO! return 1 for change

      if (value != -1) {

        this.debugLogNum("FilterChangeIndication ?", value);

        await wait(1);

        this.ventilationService.updateCharacteristic(
          Characteristic.FilterChangeIndication,
          value
        );

      }

      if (this.updateInterval > 0) {
        this.ventilationFCIAutoUpdate();
      }

    });

  };

  getFilterLifeLevel = async () => {

    if (this.logo.isValidLogoAddress(this.ventilationGetFilterLifeLevel)) {
      
      // Cancel timer if the call came from the Home-App and not from the update interval.
      // To avoid duplicate queries at the same time.
      if (this.updateInterval > 0) {
        clearTimeout(this.updateFLLTimer);
        this.updateFLLTimer = 0;
      }

      this.logo.ReadLogo(this.ventilationGetFilterLifeLevel, async (value: number) => {

        if (value != -1) {

          this.debugLogNum("FilterLifeLevel ?", value);

          await wait(1);

          this.ventilationService.updateCharacteristic(
            Characteristic.FilterLifeLevel,
            value
          );

        }

        if (this.updateInterval > 0) {
          this.ventilationFLLAutoUpdate();
        }

      });

    } else {
      
      this.debugLogStr("FilterLifeLevel ?", this.ventilationGetFilterLifeLevel);
      return this.defaultFromString(this.ventilationGetFilterLifeLevel);

    }

  };

  setResetFilterIndication = async (value: number) => {

    this.debugLogNum("Set ResetFilterIndication to", value);

    if (this.logo.isValidLogoAddress(this.ventilationSetResetFilterIndication)) {

      this.logo.WriteLogo(this.ventilationSetResetFilterIndication, this.buttonValue, this.pushButton);
      
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

  ventilationRotationSpeedTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastRotationSpeedTime + this.accessoryAnalogTimeOut)) || (this.lastRotationSpeed == 0) || (this.lastRotationSpeed == 100)) {

          this.debugLogNum("Set RotationSpeed to", this.lastRotationSpeed);
          this.lastRotationSpeedTimerSet = false;

          this.logo.WriteLogo(this.ventilationSetRotationSpeed, this.lastRotationSpeed, 0);

        } else {

          this.lastRotationSpeedTimerSet = true;
          this.ventilationRotationSpeedTimeout();
        }

    }, 100);
  }

  ventilationOnAutoUpdate() {

    this.updateOnTimer = setTimeout(() => {

      this.getOn();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  ventilationRDAutoUpdate() {

    if (this.logo.isValidLogoAddress(this.ventilationGetRotationDirection)) {

      this.updateRDTimer = setTimeout(() => {

        this.getRotationDirection();
  
      }, this.updateInterval + Math.floor(Math.random() * 10000));
      
    }

  }

  ventilationRSAutoUpdate() {

    if (this.logo.isValidLogoAddress(this.ventilationGetRotationSpeed)) {

      this.updateRSTimer = setTimeout(() => {

        this.getRotationSpeed();
  
      }, this.updateInterval + Math.floor(Math.random() * 10000));
      
    }

  }

  ventilationFCIAutoUpdate() {

    this.updateFCITimer = setTimeout(() => {

      this.getFilterChangeIndication();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

  ventilationFLLAutoUpdate() {

    this.updateFLLTimer = setTimeout(() => {

      this.getFilterLifeLevel();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}