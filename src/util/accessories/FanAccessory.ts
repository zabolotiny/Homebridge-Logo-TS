import { wait } from "../wait";

let Characteristic: any;

export class FanAccessory {

  static fanType: string = "fan";

  public fanService: any;
  public fanGetOn: string             = "V130.0";
  public fanSetOn: string             = "V130.1";
  public fanSetOff: string            = "V130.2";
  public fanGetRotationSpeed: string  = "VW133";
  public fanSetRotationSpeed: string  = "VW135";

  accessoryAnalogTimeOut = 500;

  log: Function;
  logo: any;
  updateInterval: number;
  buttonValue: number;
  pushButton: number;
  debugMsgLog: number;
  lastRotationSpeed: number;
  lastRotationSpeedTime: number;
  lastRotationSpeedTimerSet: boolean;
  updateOnTimer: any;
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
      this.fanRSAutoUpdate();
    }

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

    if (value == true) {
      this.logo.WriteLogo(this.fanSetOn, this.buttonValue, this.pushButton);
    } else {
      this.logo.WriteLogo(this.fanSetOff, this.buttonValue, this.pushButton);
    }
  };

  getRotationSpeed = async () => {

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

  };

  setRotationSpeed = async (value: number) => {

    this.lastRotationSpeed = value;
    this.lastRotationSpeedTime = + new Date();
    if (!this.lastRotationSpeedTimerSet) {
      this.fanRotationSpeedTimeout();
    }

    // We succeeded, so update the "current" state as well.
    // We need to update the current state "later" because Siri can't
    // handle receiving the change event inside the same "set target state"
    // response.
    await wait(1);

    this.fanService.setCharacteristic(
      Characteristic.RotationSpeed,
      value
    );

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

  fanRotationSpeedTimeout() {
    setTimeout(() => {

        let now = + new Date();

        if ((now >= (this.lastRotationSpeedTime + this.accessoryAnalogTimeOut)) || (this.lastRotationSpeed == 0) || (this.lastRotationSpeed == 100)) {

          this.debugLogNum("Set RotationSpeed to", this.lastRotationSpeed);
          this.lastRotationSpeedTimerSet = false;

          this.logo.WriteLogo(this.setRotationSpeed, this.lastRotationSpeed, 0);

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

  fanRSAutoUpdate() {

    this.updateRSTimer = setTimeout(() => {

      this.getRotationSpeed;

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}

    /*********************
     * LOGO! Fan Service *
     *********************/

     /*
    if (this.type == FanAccessory.fanType) {

      this.fanAccessory = new FanAccessory(this.log, this.logo, this.updateInterval, this.buttonValue, this.pushButton, this.debugMsgLog, Characteristic);

      const fanService = new Service.Fan(
        this.name,
        FanAccessory.fanType,
      );

      fanService
        .getCharacteristic(Characteristic.Active)
        .on("get", callbackify(this.fanAccessory.getOn))
        .on("set", callbackify(this.fanAccessory.setOn));

      fanService
        .getCharacteristic(Characteristic.RotationSpeed)
        .on("get", callbackify(this.fanAccessory.getRotationSpeed))
        .on("set", callbackify(this.fanAccessory.setRotationSpeed));

      this.fanService = fanService;

      this.fanAccessory.fanService          = this.fanService;
      this.fanAccessory.fanGetOn            = config["fanGetOn"]            || "V130.0";
      this.fanAccessory.fanSetOn            = config["fanSetOn"]            || "V130.1";
      this.fanAccessory.fanSetOff           = config["fanSetOff"]           || "V130.2";
      this.fanAccessory.fanGetRotationSpeed = config["fanGetRotationSpeed"] || "VW133";
      this.fanAccessory.fanSetRotationSpeed = config["fanSetRotationSpeed"] || "VW135";

    }
    */