import { wait } from "../wait";

let Characteristic: any;

export class ContactSensor {

  static contactSensorType: string = "contactSensor";

  public contactSensorService: any;
  public contactDetected: string = "M9";

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
      this.contactSensorAutoUpdate();
    }

  }

  //
  // LOGO! Contact Sensor Service
  //

  getStatusActive = async () => {
    return true;
  };

  getContactSensorState = async () => {
    // CONTACT_DETECTED = 0; CONTACT_NOT_DETECTED = 1;

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.contactDetected, async (value: number) => {
      // LOGO! return 1 for contact / close

      if (value != -1) {

        const state = value == 1 ? 0 : 1;
        this.debugLogNum("ContactSensorState ?", state);

        await wait(1);

        this.contactSensorService.updateCharacteristic(
          Characteristic.ContactSensorState,
          state
        );

      }

      if (this.updateInterval > 0) {
        this.contactSensorAutoUpdate();
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

  contactSensorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getContactSensorState();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}