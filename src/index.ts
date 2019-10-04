
import { wait } from "./util/wait";
import callbackify from "./util/callbackify";


let Service: any, Characteristic: any;

export default function(homebridge: any) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-tesla", "Tesla", TeslaAccessory);
}

class TeslaAccessory {
  // From config.
  log: Function;
  name: string;
  connection: string | null;

  // Services exposed.
  connectionService: any;

  constructor(log: any, config: any) {
    this.log = log;
    this.name = config["name"];
    this.connection = config["connection"];

    //
    // Online Switch
    //

    if (this.connection) {
      this.log(`Creating wakeup switch: "Turn on the ${this.connection}"`);

      const connectionService = new Service.Switch(
        this.connection,
        "connection",
      );

      connectionService
        .getCharacteristic(Characteristic.On)
        .on("get", this.getConnectionOn)
        .on("set", this.setConnectionOn);

      this.connectionService = connectionService;
    }
  }

  getServices() {
    return [
      this.connectionService
    ];
  }

  //
  // Wakeup Switch
  //

  getConnectionOn(this: any): Boolean {

    let state = "offline";

    this.log("Vehicle state:", state);

    return state === "online";
  }

  setConnectionOn(this: any, on: Boolean) {


    if (on) {
        this.log("Waking up vehicle");
      
    } else {
        this.log(
        "Ignoring command to turn off vehicle (it will sleep on its own)",
      );
    }
  }

};