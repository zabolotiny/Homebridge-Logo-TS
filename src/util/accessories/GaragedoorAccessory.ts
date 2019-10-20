import { wait } from "../wait";

let Characteristic: any;

export class GaragedoorAccessory {

  static garagedoorType: string = "garagedoor";

  public garagedoorService: any;

  public garagedoorOpen: string  = "V6.0";
  public garagedoorClose: string = "V6.1";
  public garagedoorState: string = "V6.2";

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  lastGaragedoorTargetState: number;
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
      this.garagedoorAutoUpdate();
    }

    this.lastGaragedoorTargetState = -1;

  }

  //
  // LOGO! GarageDoor Service
  //

  getGarageDoorCurrentDoorState = async () => {
    // 0 - OPEN; 1 - CLOSED; 2 - OPENING; 3 - CLOSING; 4 - STOPPED

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.garagedoorState, async (value: number) => {
      // Logo return 1 for OPEN!

      if (value != -1) {

        const state = value == 1 ? 0 : 1;
        this.debugLogNum("GarageDoorCurrentDoorState ?", state);

        await wait(1);

        this.garagedoorService.updateCharacteristic(
          Characteristic.CurrentDoorState,
          state
        );

        if (state != this.lastGaragedoorTargetState) {
          this.lastGaragedoorTargetState = state;
          await wait(1);

          this.garagedoorService.updateCharacteristic(
            Characteristic.TargetDoorState,
            state
          );
        }

      }

      if (this.updateInterval > 0) {
        this.garagedoorAutoUpdate();
      }

    });

  };

  getGarageDoorTargetDoorState = async () => {
    // 0 - OPEN; 1 - CLOSED

    this.debugLogNum("GarageDoorTargetDoorState ?", this.lastGaragedoorTargetState);
    if (this.lastGaragedoorTargetState != -1) {
      return this.lastGaragedoorTargetState;
    } else {
      return 1;
    }

  };

  setGarageDoorTargetDoorState = async (state: number) => {
    // 0 - OPEN; 1 - CLOSED

    this.debugLogNum("Set GarageDoorTargetDoorState to", state);
    this.lastGaragedoorTargetState = state;

    if (state == 0) {
      this.logo.WriteLogo(this.garagedoorOpen, this.buttonValue, this.pushButton);
    } else {
      this.logo.WriteLogo(this.garagedoorClose, this.buttonValue, this.pushButton);
    }

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    this.garagedoorService.setCharacteristic(
      Characteristic.CurrentDoorState,
      state
    );

  };

  getGarageDoorObstructionDetected = async () => {
    // true or false

    this.debugLogBool("GarageDoorObstructionDetected ?", false);
    return false;
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

  garagedoorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getGarageDoorCurrentDoorState();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}