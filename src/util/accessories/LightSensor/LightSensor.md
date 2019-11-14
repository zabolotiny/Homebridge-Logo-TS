# Light Sensor - Lux approximation #

## Characterizing the Light Dependent Resistor ##

Place the sensor of the commercial light meter beside the LDR.
While ensuring that the same levels of light fall on the two sensors, record a reading of the LDR voltages and the light meter lux. Repeat this process for many different lighting levels from very dark (near 0 lux) to very bright (thousands of lux).  It is important that at all of these different light levels, you do your best to ensure that both sensors get the same amount of light.  
Transfer your readings to a spreadsheet (or enter them directly while you are making measurements) and then make a plot of the illuminance (lux) as a function of voltages (resistance).  
You can download the spreadsheet which will create the plot and perform all of the necessary analysis from your entries.  

## Light Sensor Accessory Configuration ##

Name                     | Value               | Required | Option for    | Notes
------------------------ | ------------------- | -------- | ------------- | ---------------------------------------------------
`lightLevel`             | "AM3"               | no       | "lightSensor" | Light Sensor for Current Ambient Light Level in Lux
`lightLDRLevelParts`     | 3                   | no       | "lightSensor" | Indicates how many formula parts the lux value is calculated. (0, 1, 2, 3)
`lightLDRLevelMin`       | 0                   | no       | "lightSensor" | The minimum voltage of the LDR.
`lightLDRLevelMax`       | 1000                | no       | "lightSensor" | The maximum voltage of the LDR.
`lightLDRLevelP1Min`     | 423                 | no       | "lightSensor" | Specifies where the transition from Formula 1 to Formula 2 is.
`lightLDRLevelP2Min`     | 696                 | no       | "lightSensor" | Specifies where the transition from Formula 2 to Formula 3 is.
`lightLDRLevelP0S`       | 1,92170242765178    | no       | "lightSensor" | Slope of Formula 1
`lightLDRLevelP0Y`       | -2,27030759992747   | no       | "lightSensor" | y-intercept of Formula 1
`lightLDRLevelP1S`       | 3,85547119519305    | no       | "lightSensor" | Slope of Formula 3
`lightLDRLevelP1Y`       | -7,34902696724256   | no       | "lightSensor" | y-intercept of Formula 2
`lightLDRLevelP2S`       | 16,3271951868277    | no       | "lightSensor" | Slope of Formula 3
`lightLDRLevelP2Y`       | -42,8043502895429   | no       | "lightSensor" | y-intercept of Formula 3

```json
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
            "lightLDRLevelParts": 3,
            "lightLDRLevelMin": 0,
            "lightLDRLevelMax": 1000,
            "lightLDRLevelP1Min": 423,
            "lightLDRLevelP2Min": 696,
            "lightLDRLevelP0S": 1.92170242765178,
            "lightLDRLevelP0Y": -2.27030759992747,
            "lightLDRLevelP1S": 3.85547119519305,
            "lightLDRLevelP1Y": -7.34902696724256,
            "lightLDRLevelP2S": 16.3271951868277,
            "lightLDRLevelP2Y": -42.8043502895429
        }
    ]
```

## Lux Formula ##

```x
Slope = INDEX( RGP( LOG(lux)[Area in table]; LOG(volt)[Area in table] ); 1 )  
y-intercept = INDEX( RGP( LOG(lux)[Area in table]; LOG(volt)[Area in table] ); 2 )  
A = 10 ^ y-intercept  
B = Slope  
Lux = A * Voltage ^ B  
```

Original: [Design a Luxmeter Using a Light Dependent Resistor](https://www.allaboutcircuits.com/projects/design-a-luxmeter-using-a-light-dependent-resistor/)
