import { wait } from "../wait";

let Characteristic: any;

export class BlindAccessory {

  static blindType: string = "blind";
  static infoModel: string = "Blind";

  public blindService: any;

  public blindSetPos: string    = "VW50";
  public blindGetPos: string    = "VW52";
  public blindGetState: string  = "VW54";
  public blindDigital: number   = 0;
  public blindSetUp: string     = "V5.0";
  public blindSetDown: string   = "V5.1";
  public blindGetUpDown: string = "V5.2";

  accessoryAnalogTimeOut = 500;

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  lastBlindTargetPos: number;
  lastBlindTargetPosTime: number;
  lastBlindTargetPosTimerSet: boolean;
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
      this.blindAutoUpdate();
    }

    this.lastBlindTargetPos         = -1;
    this.lastBlindTargetPosTime     = -1;
    this.lastBlindTargetPosTimerSet = false;

  }

  //
  // LOGO! Blind Service
  //

  getBlindCurrentPosition = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    if (!this.blindDigital) {

      this.logo.ReadLogo(this.blindGetPos, async (value: number) => {

        if (value != -1) {

          let pos = 100 - value;
          pos = this.blindCurrentPositionIsNearTargetPosition(pos, this.lastBlindTargetPos);
          this.debugLogNum("BlindCurrentPosition ?", pos);

          await wait(1);

          this.blindService.updateCharacteristic(
            Characteristic.CurrentPosition,
            pos
          );

          await wait(1);

          this.blindService.updateCharacteristic(
            Characteristic.PositionState,
            2
          );

          if (pos != this.lastBlindTargetPos) {
            this.lastBlindTargetPos = pos;

            await wait(1);

            this.blindService.updateCharacteristic(
              Characteristic.TargetPosition,
              pos
            );
          }

        }

        if (this.updateInterval > 0) {
          this.blindAutoUpdate();
        }

      });

    } else {

      this.logo.ReadLogo(this.blindGetUpDown, async (value: number) => {

        if (value != -1) {

          const pos = value == 1 ? 100 : 0;
          this.debugLogNum("BlindCurrentPosition ?", pos);

          await wait(1);

          this.blindService.updateCharacteristic(
            Characteristic.CurrentPosition,
            pos
          );

          await wait(1);

          this.blindService.updateCharacteristic(
            Characteristic.PositionState,
            2
          );

        }

        if (this.updateInterval > 0) {
          this.blindAutoUpdate();
        }

      });

    }

  };

  getBlindTargetPosition = async () => {

    this.debugLogNum("BlindTargetPosition ?", this.lastBlindTargetPos);
    if (this.lastBlindTargetPos != -1) {
      return this.lastBlindTargetPos;
    } else {
      return 100;
    }

  };

  setBlindTargetPosition = async (pos: number) => {

    this.lastBlindTargetPos = pos;
    this.lastBlindTargetPosTime = + new Date();
    if (!this.lastBlindTargetPosTimerSet) {
      this.blindTargetPositionTimeout();
    }

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    this.blindService.setCharacteristic(
      Characteristic.CurrentPosition,
      pos
    );

  };

  getBlindPositionState = async () => {
    // 0 - DECREASING; 1 - INCREASING; 2 - STOPPED

    if (!this.blindDigital) {

      this.logo.ReadLogo(this.blindGetState, async (value: number) => {

        if (value != -1) {

          const state = this.blindLogoStateToHomebridgeState(value);
          this.debugLogNum("BlindPositionState ?", state);

          await wait(1);

          this.blindService.updateCharacteristic(
            Characteristic.PositionState,
            state
          );

        }

      });

    } else {

      this.debugLogNum("BlindPositionState ?", 2);
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

  blindTargetPositionTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastBlindTargetPosTime + this.accessoryAnalogTimeOut)) || (this.lastBlindTargetPos == 0) || (this.lastBlindTargetPos == 100)) {

          this.debugLogNum("Set BlindTargetPosition to", this.lastBlindTargetPos);
          this.lastBlindTargetPosTimerSet = false;

          if (!this.blindDigital) {

            this.logo.WriteLogo(this.blindSetPos, (100 - this.lastBlindTargetPos), 0);

          } else {

            if (this.lastBlindTargetPos >= 50) {
              this.logo.WriteLogo(this.blindSetUp, this.buttonValue, this.pushButton);
            } else {
              this.logo.WriteLogo(this.blindSetDown, this.buttonValue, this.pushButton);
            }

          }

        } else {

          this.lastBlindTargetPosTimerSet = true;
          this.blindTargetPositionTimeout();
        }

    }, 100);
  }

  blindLogoStateToHomebridgeState(value: number): number {
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

  blindCurrentPositionIsNearTargetPosition(current: number, target: number) {
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

  blindAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getBlindCurrentPosition();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}