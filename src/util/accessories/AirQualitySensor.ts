import { wait } from "../wait";

let Characteristic: any;

export class AirQualitySensor {

  static airQualitySensorType: string = "airQualitySensor";
  static infoModel: string = "Air Quality Sensor";

  public airQualitySensorService: any;
  public carbonDioxideLevel: string = "AM3";

  log: Function;
  logo: any;
  updateInterval: number;
  debugMsgLog: number;
  lastCarbonDioxideLevel: number;
  lastAirQuality: number;
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
      this.carbonDioxideSensorAutoUpdate();
    }

    this.lastCarbonDioxideLevel = -1;
    this.lastAirQuality         = 0; // UNKNOWN = 0;

  }

  //
  // LOGO! Air Quality Sensor Service
  //
  // 1000ppm CO2 (CO2 in Air 0.04% = ~400ppm)

  getStatusActive = async () => {
    return true;
  };

  getAirQuality = async () => {
    // UNKNOWN = 0;
    // EXCELLENT = 1; // CO2 <  800ppm      (IDA 1)
    // GOOD = 2;      // CO2 >  800-1000ppm (IDA 2)
    // FAIR = 3;      // CO2 > 1000-1400ppm (IDA 3)
    // INFERIOR = 4;  // CO2 > 1400-1800ppm (IDA 4)
    // POOR = 5;      // CO2 > 1800ppm
    
    this.debugLogNum("AirQuality ?", this.lastAirQuality);
    return this.lastAirQuality;

  };

  getCarbonDioxideLevel = async () => {

    // Cancel timer if the call came from the Home-App and not from the update interval.
    // To avoid duplicate queries at the same time.
    if (this.updateInterval > 0) {
      clearTimeout(this.updateTimer);
      this.updateTimer = 0;
    }

    this.logo.ReadLogo(this.carbonDioxideLevel, async (value: number) => {

      if (value != -1) {

        this.lastCarbonDioxideLevel = value;
        this.debugLogNum("CarbonDioxideLevel ?", value);

        await wait(1);

        this.airQualitySensorService.updateCharacteristic(
          Characteristic.CarbonDioxideLevel,
          value
        );

        let newAirQuality = this.airQuality(value);

        if (newAirQuality != this.lastAirQuality) {

          this.lastAirQuality = newAirQuality;

          await wait(1);

          this.airQualitySensorService.updateCharacteristic(
            Characteristic.AirQuality,
            newAirQuality
          );
          
        }

      }

      if (this.updateInterval > 0) {
        this.carbonDioxideSensorAutoUpdate();
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

  airQuality(value: number): number {
    let airQuality = 0;                           // UNKNOWN = 0;
    if (value < 800) {
      airQuality = 1;                             // EXCELLENT = 1; // CO2 <  800ppm      (IDA 1)
    } else if (value >= 800 && value < 1000 ) {
      airQuality = 2;                             // GOOD = 2;      // CO2 >  800-1000ppm (IDA 2)
    } else if (value >= 1000 && value < 1400 ) {
      airQuality = 3;                             // FAIR = 3;      // CO2 > 1000-1400ppm (IDA 3)
    } else if (value >= 1400 && value < 1800 ) {
      airQuality = 4;                             // INFERIOR = 4;  // CO2 > 1400-1800ppm (IDA 4)
    } else if (value >= 1800 ) {
      airQuality = 5;                             // POOR = 5;      // CO2 > 1800ppm
    }
    return airQuality;
  }

  carbonDioxideSensorAutoUpdate() {

    this.updateTimer = setTimeout(() => {

      this.getCarbonDioxideLevel();

    }, this.updateInterval + Math.floor(Math.random() * 10000));

  }

}