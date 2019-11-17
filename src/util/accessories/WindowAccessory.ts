import { wait } from "../wait";

let Characteristic: any;

export class WindowAccessory {

  static windowType: string = "window";
  static infoModel: string = "Window";

  public windowService: any;

  public windowSetPos: string    = "VW50";
  public windowGetPos: string    = "VW52";
  public windowGetState: string  = "VW54";
  public windowDigital: number   = 0;
  public windowSetUp: string     = "V5.0";
  public windowSetDown: string   = "V5.1";
  public windowGetUpDown: string = "V5.2";

  accessoryAnalogTimeOut = 500;

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  lastWindowTargetPos: number;
  lastWindowTargetPosTime: number;
  lastWindowTargetPosTimerSet: boolean;
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
      this.windowAutoUpdate();
    }

    this.lastWindowTargetPos         = -1;
    this.lastWindowTargetPosTime     = -1;
    this.lastWindowTargetPosTimerSet = false;

  }

  //
  // LOGO! Window Service
  //

  getWindowCurrentPosition = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    if (!this.windowDigital) {

      this.logo.ReadLogo(this.windowGetPos, async (value: number) => {

        if (value != -1) {

          let pos = 100 - value;
          pos = this.windowCurrentPositionIsNearTargetPosition(pos, this.lastWindowTargetPos);
          this.debugLogNum("WindowCurrentPosition ?", pos);

          await wait(1);

          this.windowService.updateCharacteristic(
            Characteristic.CurrentPosition,
            pos
          );

          await wait(1);

          this.windowService.updateCharacteristic(
            Characteristic.PositionState,
            2
          );

          if (pos != this.lastWindowTargetPos) {
            this.lastWindowTargetPos = pos;

            await wait(1);

            this.windowService.updateCharacteristic(
              Characteristic.TargetPosition,
              pos
            );
          }

        }

        if (this.updateInterval > 0) {
          this.windowAutoUpdate();
        }

      });

    } else {

      this.logo.ReadLogo(this.windowGetUpDown, async (value: number) => {

        if (value != -1) {

          const pos = value == 1 ? 100 : 0;
          this.debugLogNum("WindowCurrentPosition ?", pos);

          await wait(1);

          this.windowService.updateCharacteristic(
            Characteristic.CurrentPosition,
            pos
          );

          await wait(1);

          this.windowService.updateCharacteristic(
            Characteristic.PositionState,
            2
          );

        }

        if (this.updateInterval > 0) {
          this.windowAutoUpdate();
        }

      });

    }

  };

  getWindowTargetPosition = async () => {

    this.debugLogNum("WindowTargetPosition ?", this.lastWindowTargetPos);
    if (this.lastWindowTargetPos != -1) {
      return this.lastWindowTargetPos;
    } else {
      return 0;
    }

  };

  setWindowTargetPosition = async (pos: number) => {

    this.lastWindowTargetPos = pos;
    this.lastWindowTargetPosTime = + new Date();
    if (!this.lastWindowTargetPosTimerSet) {
      this.windowTargetPositionTimeout();
    }

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    this.windowService.setCharacteristic(
      Characteristic.CurrentPosition,
      pos
    );

  };

  getWindowPositionState = async () => {
    // 0 - DECREASING; 1 - INCREASING; 2 - STOPPED

    if (!this.windowDigital) {

      this.logo.ReadLogo(this.windowGetState, async (value: number) => {

        if (value != -1) {

          const state = this.windowLogoStateToHomebridgeState(value);
          this.debugLogNum("WindowPositionState ?", state);

          await wait(1);

          this.windowService.updateCharacteristic(
            Characteristic.PositionState,
            state
          );

        }

      });

    } else {

      this.debugLogNum("WindowPositionState ?", 2);
      return 2;

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

  windowTargetPositionTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastWindowTargetPosTime + this.accessoryAnalogTimeOut)) || (this.lastWindowTargetPos == 0) || (this.lastWindowTargetPos == 100)) {

          this.debugLogNum("Set WindowTargetPosition to", this.lastWindowTargetPos);
          this.lastWindowTargetPosTimerSet = false;

          if (!this.windowDigital) {

            this.logo.WriteLogo(this.windowSetPos, (100 - this.lastWindowTargetPos), 0);

          } else {

            if (this.lastWindowTargetPos >= 50) {
              this.logo.WriteLogo(this.windowSetUp, this.buttonValue, this.pushButton);
            } else {
              this.logo.WriteLogo(this.windowSetDown, this.buttonValue, this.pushButton);
            }

          }

        } else {

          this.lastWindowTargetPosTimerSet = true;
          this.windowTargetPositionTimeout();
        }

    }, 100);
  }

  windowLogoStateToHomebridgeState(value: number): number {
    if (value == 0) {        // LOGO! Stop
      return 2;              // Homebridge STOPPED
    } else if (value == 1) { // LOGO! Up
      return 0;              // Homebridge DECREASING
    } else if (value == 2) { // LOGO! Down
      return 1;              // Homebridge INCREASING
    } else {
      return 2;              // Homebridge STOPPED
    }
  }

  windowCurrentPositionIsNearTargetPosition(current: number, target: number) {
    if (target != -1) {
      const near = target - current;
      if ( (near >= -5) && (near <= 5) ) {
        return target;
      } else {
        return current;
      }
    } else {
      return current;
    }
  }

  windowAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getWindowCurrentPosition();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}
