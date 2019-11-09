Homebridge-Logo-TS
==================

[![npm version](https://badge.fury.io/js/homebridge-logo-ts.svg)](https://badge.fury.io/js/homebridge-logo-ts)  

<img src="Standardraum.png" align="right" alt="Standardraum" height="448" width="207">

Use a Siemens LOGO! PLC for switch on whatever you want.  
Communicate with LOGO! 8.SF4 over Modbus and with LOGO! 0BA7 / 0BA8 over [Snap7](http://snap7.sourceforge.net).  

Type of Accessory:
- Switch
- Blind
- Window
- Garage Door
- Lightbulb
- Thermostat
- Irrigation System
- Valve
- Fan
- Fan v2

Type of Sensor Accessory:
- Light Sensor
- Motion Sensor
- Contact Sensor
- Smoke Sensor
- Temperature Sensor
- Humidity Sensor
- Carbon Dioxide Sensor
- Air Quality Sensor  


The plugin that this one is based on: [homebridge-tesla](https://github.com/nfarina/homebridge-tesla).  
If you use Homebridge-Logo-TS please donate: [PayPal.Me/Sinclair81](https://www.PayPal.Me/Sinclair81) !!  


## Installation

1. Install homebridge using: `sudo npm install -g --unsafe-perm homebridge`
2. Install homebridge-config-ui-x using: `sudo npm install -g --unsafe-perm homebridge-config-ui-x`
3. Update your configuration file with this guide: https://smartapfel.de/homebridge/plugins-installieren/
4. Install homebridge-logo-ts using: homebridge-config-ui-x's Webserver
5. Update your configuration file with code like the sample below

## Homebridge-Logo-TS Main Configuration Parameters:
Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`accessory`              | "Logo-TS"           | yes      | all        | Must be set to "Logo-TS".
`name`                   | (custom)            | yes      | all        | Name of accessory that will appear in homekit app.
`interface`              | "modbus" or "snap7" | yes      | all        | Communication, depends on LOGO! type, 8.SF4 Modbus or Snap7, 0BA7 / 0BA8 only Snap7.
`ip`                     | "10.0.0.100"        | yes      | all        | Must be set to the IP of your LOGO! PLC.
`port`                   | 505                 | no       | "modbus"   | Must be set to the Modbus Port of your LOGO! PLC, default is: 505.
`logoType`               | "8.SF4"             | no       | "snap7"    | Must be set to the type of your LOGO! PLC, default is: "8.SF4".
`localTSAP`              | "0x1200"            | no       | "snap7"    | Must be set to the localTSAP of your LOGO! PLC, default is: 0x1200.
`remoteTSAP`             | "0x2200"            | no       | "snap7"    | Must be set to the remoteTSAP of your LOGO! PLC, default is: 0x2200.
`type`                   | "switch" or ...     | yes      | all        | Type of Accessory: "switch", "blind", "window", "garagedoor", "lightbulb", "thermostat", "irrigationSystem", "valve", "fan" or Type of Sensor Accessory: "lightSensor", "motionSensor", "contactSensor", "smokeSensor", "temperatureSensor", "humiditySensor", "carbonDioxideSensor", "airQualitySensor"
`updateInterval`         | 0                   | no       | all        | Auto Update Interval in milliseconds, 0 = Off
`buttonValue`            | 1                   | no       | all        | Value for Digital Button
`pushButton`             | 1                   | no       | all        | If e.g. the network input in the LOGO! a hardware button on the LOGO! simulated.
`debugMsgLog`            | 0                   | no       | all        | 1 - Displays messages of accessories in the log.


## Switch Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`switchGet`              | "Q1"                | yes*     | "switch"   | Switch Get - Qn, Mn or Vn.n
`switchSetOn`            | "V2.0"              | yes*     | "switch"   | Switch Set On - Mn or Vn.n
`switchSetOff`           | "V3.0"              | yes*     | "switch"   | Switch Set Off - Mn or Vn.n  

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Switch ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "switch",
            "switchGet": "Q1",
            "switchSetOn": "V2.0",
            "switchSetOff": "V3.0"
        },
        {
            "accessory": "Logo-TS",
            "name": "Switch Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "switch",
            "switchGet": "Q2",
            "switchSetOn": "V2.1",
            "switchSetOff": "V3.1"
        }
    ]
```  

## Blind Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`blindSetPos`            | "VW50"              | yes*     | "blind"    | Blind Set Pos - AMn or VWn - (Analog Control)
`blindGetPos`            | "VW52"              | yes*     | "blind"    | Blind Get Pos - AMn or VWn - (Analog Control)
`blindSetState`          | "VW54"              | yes*     | "blind"    | Blind Get State - AMn or VWn - (Analog Control)
`blindDigital`           | 0                   | no       | "blind"    | 0 for Analog Control, 1 for Button Control
`blindSetUp`             | "V5.0"              | no       | "blind"    | Blind Set Up - Mn or Vn.n - (Button Control)
`blindSetDown`           | "V5.1"              | no       | "blind"    | Blind Set Down - Mn or Vn.n - (Button Control)
`blindGetUpDown`         | "V5.2"              | no       | "blind"    | Blind Up or Down - Return 1 for Up or 0 for Down - (Button Control)

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Blind ModBus Analog",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "blind",
            "blindSetPos": "VW50",
            "blindGetPos": "VW52",
            "blindGetState": "VW54"
        },
        {
            "accessory": "Logo-TS",
            "name": "Blind Snap7 Analog",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "blind",
            "blindSetPos": "VW50",
            "blindGetPos": "VW52",
            "blindGetState": "VW54"
        },
        {
            "accessory": "Logo-TS",
            "name": "Blind ModBus Digital",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "blind",
            "blindDigital": 1,
            "blindSetUp": "V5.0",
            "blindSetDown": "V5.1",
            "blindGetUpDown": "V5.2"
        },
        {
            "accessory": "Logo-TS",
            "name": "Blind Snap7 Digital",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "blind",
            "blindDigital": 1,
            "blindSetUp": "V5.0",
            "blindSetDown": "V5.1",
            "blindGetUpDown": "V5.2"
        }
    ]
```

## Window Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`windowSetPos`           | "VW50"              | yes*     | "window"   | Window Set Pos - AMn or VWn - (Analog Control)
`windowGetPos`           | "VW52"              | yes*     | "window"   | Window Get Pos - AMn or VWn - (Analog Control)
`windowSetState`         | "VW54"              | yes*     | "window"   | Window Get State - AMn or VWn - (Analog Control)
`windowDigital`          | 0                   | no       | "window"   | 0 for Analog Control, 1 for Button Control
`windowSetUp`            | "V5.0"              | no       | "window"   | Window Set Up - Mn or Vn.n - (Button Control)
`windowSetDown`          | "V5.1"              | no       | "window"   | Window Set Down - Mn or Vn.n - (Button Control)
`windowGetUpDown`        | "V5.2"              | no       | "window"   | Window Up or Down - Return 1 for Up or 0 for Down - (Button Control)

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Window ModBus Analog",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "window",
            "windowSetPos": "VW50",
            "windowGetPos": "VW52",
            "windowGetState": "VW54"
        },
        {
            "accessory": "Logo-TS",
            "name": "Window Snap7 Analog",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "window",
            "windowSetPos": "VW50",
            "windowGetPos": "VW52",
            "windowGetState": "VW54"
        },
        {
            "accessory": "Logo-TS",
            "name": "Window ModBus Digital",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "window",
            "windowDigital": 1,
            "windowSetUp": "V5.0",
            "windowSetDown": "V5.1",
            "windowGetUpDown": "V5.2"
        },
        {
            "accessory": "Logo-TS",
            "name": "Window Snap7 Digital",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "window",
            "windowDigital": 1,
            "windowSetUp": "V5.0",
            "windowSetDown": "V5.1",
            "windowGetUpDown": "V5.2"
        }
    ]
```


## Garage Door Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`garagedoorOpen`         | "V401.0"            | yes*     | "garagedoor" | Garagedoor Open - Mn or Vn.n
`garagedoorClose`        | "V401.1"            | yes*     | "garagedoor" | Garagedoor Close - Mn or Vn.n
`garagedoorState`        | "V401.2"            | yes*     | "garagedoor" | Garagedoor State - Mn or Vn.n
`garagedoorObstruction`  | "false"             | no*      | "garagedoor" | Garagedoor Obstruction Detected - `"false"` or a valid LOGO! Address (Mn or Vn.n)

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "GarageDoor ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 120000,
            "type": "garagedoor",
            "garagedoorOpen": "V401.0",
            "garagedoorClose": "V401.1",
            "garagedoorState": "V401.2",
            "garagedoorObstruction": "false"
        },
        {
            "accessory": "Logo-TS",
            "name": "GarageDoor Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "updateInterval": 120000,
            "type": "garagedoor",
            "garagedoorOpen": "V401.0",
            "garagedoorClose": "V401.1",
            "garagedoorState": "V401.2",
            "garagedoorObstruction": "false"
        }
    ]
```


## Lightbulb Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`lightbulbSetOn`         | "V7.0"              | yes*     | "lightbulb" | Lightbulb Set On - Mn or Vn.n
`lightbulbSetOff`        | "V7.1"              | yes*     | "lightbulb" | Lightbulb Set Off - Mn or Vn.n
`lightbulbSetBrightness` | "VW70"              | yes*     | "lightbulb" | Lightbulb Set Brightness - AMn or VWn
`lightbulbGetBrightness` | "VW72"              | yes*     | "lightbulb" | Lightbulb Get Brightness - AMn or VWn

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Lightbulb ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "lightbulb",
            "lightbulbSetOn": "V7.0",
            "lightbulbSetOff": "V7.1",
            "lightbulbSetBrightness": "VW70",
            "lightbulbGetBrightness": "VW72"
        },
        {
            "accessory": "Logo-TS",
            "name": "Lightbulb Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "lightbulb",
            "lightbulbSetOn": "V7.0",
            "lightbulbSetOff": "V7.1",
            "lightbulbSetBrightness": "VW70",
            "lightbulbGetBrightness": "VW72"
        }
    ]
```


## Thermostat Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`thermostatGetHCState`   | "VW210"             | yes*     | "thermostat" | Thermostat Get Heating Cooling State - AMn or VWn
`thermostatSetHCState`   | "VW200"             | yes*     | "thermostat" | Thermostat Set Heating Cooling State - AMn or VWn
`thermostatGetTemp`      | "VW212"             | yes*     | "thermostat" | Thermostat Get Temperature - AMn or VWn
`thermostatGetTargetTemp`    | "VW214"         | yes*     | "thermostat" | Thermostat Get Target Temperature - AMn or VWn
`thermostatSetTargetTemp`    | "VW202"         | yes*     | "thermostat" | Thermostat Set Target Temperature - AMn or VWn
`thermostatTempDisplayUnits` | 0               | yes*     | "thermostat" | Temperature Display Units - Celsius = 0; Fahrenheit = 1;

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Thermostat ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "thermostat",
            "thermostatGetHCState": "VW210",
            "thermostatSetHCState": "VW200",
            "thermostatGetTemp": "VW212",
            "thermostatGetTargetTemp": "VW214",
            "thermostatSetTargetTemp": "VW202",
            "thermostatTempDisplayUnits": 0
        },
        {
            "accessory": "Logo-TS",
            "name": "Thermostat Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "thermostat",
            "thermostatGetHCState": "VW210",
            "thermostatSetHCState": "VW200",
            "thermostatGetTemp": "VW212",
            "thermostatGetTargetTemp": "VW214",
            "thermostatSetTargetTemp": "VW202",
            "thermostatTempDisplayUnits": 0
        }
    ]
```


## Irrigation System Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`irrigationSystemGetActive`      | "V400.0"    | yes*     | "irrigationSystem" | Irrigation System Get Active - Mn or Vn.n
`irrigationSystemSetActiveOn`    | "V400.1"    | yes*     | "irrigationSystem" | Irrigation System Set Active to On - Mn or Vn.n
`irrigationSystemSetActiveOff`   | "V400.2"    | yes*     | "irrigationSystem" | Irrigation System Set Active to Off - Mn or Vn.n
`irrigationSystemGetProgramMode` | "VW402"     | yes*     | "irrigationSystem" | Irrigation System Get Program Mode - AMn or VWn
`irrigationSystemGetInUse`       | "V400.3"    | yes*     | "irrigationSystem" | Irrigation System Get In Use - Mn or Vn.n

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Irrigation System ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "irrigationSystem",
            "irrigationSystemGetActive": "V400.0",
            "irrigationSystemSetActiveOn": "V400.1",
            "irrigationSystemSetActiveOff": "V400.2",
            "irrigationSystemGetProgramMode": "VW402",
            "irrigationSystemGetInUse": "V400.3"
        },
        {
            "accessory": "Logo-TS",
            "name": "Irrigation System Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "irrigationSystem",
            "irrigationSystemGetActive": "V400.0",
            "irrigationSystemSetActiveOn": "V400.1",
            "irrigationSystemSetActiveOff": "V400.2",
            "irrigationSystemGetProgramMode": "VW402",
            "irrigationSystemGetInUse": "V400.3"
        }
    ]
```


## Valve Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`valveGetActive`         | "V400.0"    | yes*     | "valve" | Valve Get Active - Mn or Vn.n
`valveSetActiveOn`       | "V400.1"    | yes*     | "valve" | Valve Set Active to On - Mn or Vn.n
`valveSetActiveOff`      | "V400.2"    | yes*     | "valve" | Valve Set Active to Off - Mn or Vn.n
`valveGetInUse`          | "V400.3"    | yes*     | "valve" | Valve Get In Use - Mn or Vn.n
`valveType`              | 0           | yes*     | "valve" | Valve Type - Generic Valve = 0, Irrigation = 1, Shower Head = 2, Water Faucet = 3,
`valveSetDuration`       | "0"         | no*      | "valve" | Valve Set Duration - `"0"` or a valid LOGO! Address (AMn or VWn)
`valveGetDuration`       | "0"         | no*      | "valve" | Valve Get Duration - `"0"` or a valid LOGO! Address (AMn or VWn)

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Valve ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "valve",
            "valveGetActive": "V400.0",
            "valveSetActiveOn": "V400.1",
            "valveSetActiveOff": "V400.2",
            "valveGetInUse": "V400.3",
            "valveType": 1,
            "valveSetDuration": "0",
            "valveGetDuration": "0"
        },
        {
            "accessory": "Logo-TS",
            "name": "Valve Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "valve",
            "valveGetActive": "V400.0",
            "valveSetActiveOn": "V400.1",
            "valveSetActiveOff": "V400.2",
            "valveGetInUse": "V400.3",
            "valveType": 1,
            "valveSetDuration": "0",
            "valveGetDuration": "0"
        }
    ]
```

## Fan Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`fanGetOn`                   | "V130.0"        | yes*     | "fan"      | Fan Get On - Mn or Vn.n
`fanSetOn`                   | "V130.1"        | yes*     | "fan"      | Fan Set On to On - Mn or Vn.n
`fanSetOff`                  | "V130.2"        | yes*     | "fan"      | Fan Set On to Off - Mn or Vn.n
`fanGetRotationDirection`    | "0"             | no*      | "fan"      | Fan Get Rotation Direction - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanSetRotationDirectionCW`  | "0"             | no*      | "fan"      | Fan Set Rotation Direction to Clockwise - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanSetRotationDirectionCCW` | "0"             | no*      | "fan"      | Fan Set Rotation Direction to Counter Clockwise - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanGetRotationSpeed`        | "0"             | no*      | "fan"      | Fan Get Rotation Speed - `"0"` or a valid LOGO! Address (AMn or VWn)
`fanSetRotationSpeed`        | "0"             | no*      | "fan"      | Fan Set Rotation Speed - `"0"` or a valid LOGO! Address (AMn or VWn)


```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Fan ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "fan",
            "fanGetOn": "V130.0",
            "fanSetOn": "V130.1",
            "fanSetOff": "V130.2",
            "fanGetRotationDirection": "0",
            "fanSetRotationDirectionCW": "0",
            "fanSetRotationDirectionCCW": "0",
            "fanGetRotationSpeed": "0",
            "fanSetRotationSpeed": "0"
        },
        {
            "accessory": "Logo-TS",
            "name": "Fan Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "fan",
            "fanGetOn": "V130.0",
            "fanSetOn": "V130.1",
            "fanSetOff": "V130.2",
            "fanGetRotationDirection": "0",
            "fanSetRotationDirectionCW": "0",
            "fanSetRotationDirectionCCW": "0",
            "fanGetRotationSpeed": "0",
            "fanSetRotationSpeed": "0"
        }
    ]
```

## Fan v2 Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`fanv2GetActive`               | "V130.0"        | yes*     | "fanv2"      | Fan v2 Get Active - Mn or Vn.n
`fanv2SetActiveOn`             | "V130.1"        | yes*     | "fanv2"      | Fan v2 Set Active to On - Mn or Vn.n
`fanv2SetActiveOff`            | "V130.2"        | yes*     | "fanv2"      | Fan v2 Set Active to Off - Mn or Vn.n
`fanv2GetCurrentFanState`      | "0"             | no*      | "fanv2"      | Fan v2 Get Current Fan State (0 = Inactive, 1 = Idle, 2 = Blowing Air) - `"0"` or a valid LOGO! Address (AMn or VWn)
`fanv2SetTargetFanStateAuto`   | "0"             | no*      | "fanv2"      | Fan v2 Set Target Fan State to Auto - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanv2SetTargetFanStateManual` | "0"             | no*      | "fanv2"      | Fan v2 Set Target Fan State to Manual - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanv2GetRotationDirection`    | "0"             | no*      | "fanv2"      | Fan v2 Get Rotation Direction - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanv2SetRotationDirectionCW`  | "0"             | no*      | "fanv2"      | Fan v2 Set Rotation Direction to Clockwise - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanv2SetRotationDirectionCCW` | "0"             | no*      | "fanv2"      | Fan v2 Set Rotation Direction to Counter Clockwise - `"0"` or a valid LOGO! Address (Mn or Vn.n)
`fanv2GetRotationSpeed`        | "0"             | no*      | "fanv2"      | Fan v2 Get Rotation Speed - `"0"` or a valid LOGO! Address (AMn or VWn)
`fanv2SetRotationSpeed`        | "0"             | no*      | "fanv2"      | Fan v2 Set Rotation Speed - `"0"` or a valid LOGO! Address (AMn or VWn)


```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Fan v2 ModBus",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "type": "fanv2",
            "fanv2GetActive": "V130.0",
            "fanv2SetActiveOn": "V130.1",
            "fanv2SetActiveOff": "V130.2",
            "fanv2GetCurrentFanState": "0",
            "fanv2SetTargetFanStateAuto": "0",
            "fanv2SetTargetFanStateManual": "0",
            "fanv2GetRotationDirection": "0",
            "fanv2SetRotationDirectionCW": "0",
            "fanv2SetRotationDirectionCCW": "0",
            "fanv2GetRotationSpeed": "0",
            "fanv2SetRotationSpeed": "0"
        },
        {
            "accessory": "Logo-TS",
            "name": "Fan v2 Snap7",
            "interface": "snap7",
            "ip": "10.0.0.200",
            "logoType": "0BA7",
            "localTSAP": "0x1200",
            "remoteTSAP": "0x2200",
            "type": "fanv2",
            "fanv2GetActive": "V130.0",
            "fanv2SetActiveOn": "V130.1",
            "fanv2SetActiveOff": "V130.2",
            "fanv2GetCurrentFanState": "0",
            "fanv2SetTargetFanStateAuto": "0",
            "fanv2SetTargetFanStateManual": "0",
            "fanv2GetRotationDirection": "0",
            "fanv2SetRotationDirectionCW": "0",
            "fanv2SetRotationDirectionCCW": "0",
            "fanv2GetRotationSpeed": "0",
            "fanv2SetRotationSpeed": "0"
        }
    ]
```


## Light Sensor Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`lightLevel`             | "AM3"               | yes*     | "lightSensor" | Light Sensor for Current Ambient Light Level in Lux
`lightLDRLevelParts`     | 0                   | yes*     | "lightSensor" | Indicates how many formula parts the lux value is calculated. [0, 1, 2, 3] 0 - simply shows the value of the LOGO!, [more information about the light sensor](src/util/accessories/LightSensor/LightSensor.md)

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Light Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "debugMsgLog": 1,
            "type": "lightSensor",
            "lightLevel": "AM3",
            "lightLDRLevelParts": 0
        }
    ]
```


## Motion Sensor Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`motionDetected`         | "M9"                | yes*     | "motionSensor"        | Motion Sensor

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Motion Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "debugMsgLog": 1,
            "type": "motionSensor",
            "motionDetected": "M9"
        }
    ]
```


## Contact Sensor Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`contactDetected`        | "M15"               | yes*     | "contactSensor"       | Contact Sensor

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Contact Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "debugMsgLog": 1,
            "type": "contactSensor",
            "contactDetected": "M15"
        }
    ]
```


## Smoke Sensor Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`smokeDetected`          | "M12"               | yes*     | "smokeSensor"         | Smoke Sensor

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Smoke Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "debugMsgLog": 1,
            "type": "smokeSensor",
            "smokeDetected": "M12"
        }
    ]
```


## Temperature Sensor Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`temperature`            | "AM2"               | yes*     | "temperatureSensor"   | Temperature Sensor for Current Temperature in °C

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Temperature Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "debugMsgLog": 1,
            "type": "temperatureSensor",
            "temperature": "AM2"
        }
    ]
```


## Humidity Sensor Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`humidity`               | "AM1"               | yes*     | "humiditySensor"      | Humidity Sensor for Current Relative Humidity in %

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Humidity Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "debugMsgLog": 1,
            "type": "humiditySensor",
            "humidity": "AM1"
        }
    ]
```


## Carbon Dioxide Sensor Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`carbonDioxideLevel`     | "AM3"               | yes*     | "carbonDioxideSensor" | Carbon Dioxide Sensor for Carbon Dioxide Level in ppm
`carbonDioxideLimit`     | 1000                | yes*     | "carbonDioxideSensor" | Carbon Dioxide Sensor for Carbon Dioxide Peak Level in ppm

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Carbon Dioxide Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "debugMsgLog": 1,
            "type": "carbonDioxideSensor",
            "carbonDioxideLevel": "AM3",
            "carbonDioxideLimit": 1000
        }
    ]
```


## Air Quality Sensor Accessory Configuration  

Name                     | Value               | Required | Option for | Notes
------------------------ | ------------------- | -------- | ---------- | ------------------------
`carbonDioxideLevel`     | "AM3"               | yes*     | "airQualitySensor"    | Air Quality Sensor for Air Quality (Carbon Dioxide Level in ppm)

```
"accessories": [
        {
            "accessory": "Logo-TS",
            "name": "Air Quality Sensor",
            "interface": "modbus",
            "ip": "10.0.0.100",
            "port": 505,
            "updateInterval": 30000,
            "debugMsgLog": 1,
            "type": "airQualitySensor",
            "carbonDioxideLevel": "AM3"
        }
    ]
```
  

Required: yes* - means that this parameter is only required for this particular accessory!  
Required: no* - means if no valid LOGO address is specified for this parameter, this characteristic returns the specified value or is deactivated in the accessory!
  

## Test Homebridge-Logo-TS
1. Download or clone Homebridge-Logo-TS.
2. Install: $ npm install
3. Build:   $ npm run build
4. Run:     $ /usr/local/bin/homebridge -D -P ~/Homebridge-Logo-TS/