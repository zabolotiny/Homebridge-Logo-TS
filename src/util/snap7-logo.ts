
let snap7 = require('node-snap7');

export enum WordLen {
    S7WLBit   = 0,
    S7WLByte  = 1,
    S7WLWord  = 2,
    S7WLDWord = 3
}

export class LogoAddress {
    constructor(
        public addr: number,
        public bit: number,
        public wLen: WordLen
    ) {}
}

export class Snap7Logo {

    target_type: string = "0BA7";
    target_db: number = 1;
    debugMsgLog: number = 0;
    log: Function;

    constructor(
        public type: string,
        public ipAddr: string,
        public local_TSAP: number,
        public remote_TSAP: number,
        public debug: number,
        public logFunction: any
    ) {
        this.target_type = type;
        this.debugMsgLog = debug;
        this.log         = logFunction;
    }

    ReadLogo(item: string, callBack: (value: number) => any) {

        var debugLog: number = this.debugMsgLog;
        var log: any         = this.log;
        var getAddressAndBit =  this.getAddressAndBit;
        var db               = this.target_db;
        var type             = this.target_type;

        var s7client  = new snap7.S7Client();
        s7client.SetConnectionParams(this.ipAddr, this.local_TSAP, this.remote_TSAP);
        this.ConnectS7(s7client, debugLog, 5,(success: Boolean) => {
            if(!success) {
                if (debugLog == 1) {
                    log(' >> Connection failed.');
                }
                callBack(-1);
                return -1;
            }

            var target = getAddressAndBit(item, type);
            var target_len = 1;

            if (target.wLen == WordLen.S7WLWord) {
                target_len = 2;
            }
            if (target.wLen == WordLen.S7WLDWord) {
                target_len = 4;
            }
            
            s7client.DBRead(db, target.addr, target_len, function(err: Error, res: [number]) {
                if(err) {
                    if (debugLog == 1) {
                        log(' >> DBRead failed. Code #' + err + ' - ' + s7client.ErrorText(err));
                    }
                    callBack(-1);
                } else {

                    var buffer = Buffer.from(res);

                    if (target.wLen == WordLen.S7WLBit) {
                        callBack((buffer[0] >> target.bit) & 1);
                    }

                    if (target.wLen == WordLen.S7WLByte) {
                        callBack(buffer[0]);
                    }
                
                    if (target.wLen == WordLen.S7WLWord) {
                        callBack( (buffer[0] << 8) | buffer[1] );
                    }

                    if (target.wLen == WordLen.S7WLDWord) {
                        callBack( (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3] );
                    }

                }
                s7client.Disconnect();
            });
        });
    }

    WriteLogo(item: string, value: number, pushButton: number) {

        var debugLog: number = this.debugMsgLog;
        var log: any         = this.log;
        var getAddressAndBit = this.getAddressAndBit;
        var db               = this.target_db;
        var type             = this.target_type;
        var s7client  = new snap7.S7Client();
        s7client.SetConnectionParams(this.ipAddr, this.local_TSAP, this.remote_TSAP);
        this.ConnectS7(s7client, debugLog, 5,(success: Boolean) => {
            if(!success) {
                if (debugLog == 1) {
                    log(' >> Connection failed.');
                }
                return -1;
            }

            var target = getAddressAndBit(item, type);
            var target_len = 1;
            var buffer_on;

            if (target.wLen == WordLen.S7WLBit) {
                if (pushButton == 0) {
                    buffer_on = Buffer.from([value << target.bit]);
                } else {
                    buffer_on  = Buffer.from([1 << target.bit]);
                }
            }

            if (target.wLen == WordLen.S7WLByte) {
                buffer_on  = Buffer.from([value]);
            }

            if (target.wLen == WordLen.S7WLWord) {
                buffer_on  = Buffer.from([((value & 0b1111111100000000) >> 8), (value & 0b0000000011111111)]);
                target_len = 2;
            }
            if (target.wLen == WordLen.S7WLDWord) {
                buffer_on  = Buffer.from([((value & 0b11111111000000000000000000000000) >> 24), ((value & 0b00000000111111110000000000000000) >> 16), ((value & 0b00000000000000001111111100000000) >> 8), (value & 0b00000000000000000000000011111111)]);
                target_len = 4;
            }
            
            this.WriteS7(s7client, db, target.addr, target_len, debugLog, 5, buffer_on, (success: Boolean) => {
                if(!success) {
                    return -1;
                }

                if (pushButton == 1) {

                    sleep(300).then(() => {
                        var buffer_off = Buffer.from([0]);
                    
                        this.WriteS7(s7client, db, target.addr, target_len, debugLog, 5, buffer_off, (success: Boolean) => {
                            if(!success) {
                                return -1;
                            }

                            s7client.Disconnect();
                        });
                    
                    });
                } else {

                    s7client.Disconnect();
                }

            });

        });
    }

    ConnectS7(s7client: any, debugLog: number, retryCount: number, callBack?: (success: Boolean) => any) {
        var log: any = this.log;
        if (retryCount == 0) {
            log(' >> Retry counter reached max value');
            if (callBack) {
                callBack(false);
            }
            return -1;
        }
        retryCount = retryCount - 1;
        s7client.Connect((err: Error) => {
            if(err) {
                if (debugLog == 1) {
                    log(' >> Connection failed. Retrying. Code #' + err + ' - ' + s7client.ErrorText(err));
                }
                sleep(200).then(() => {
                    this.ConnectS7(s7client, debugLog, retryCount, callBack);
                });
                return -1;
            }
            if (callBack) {
                callBack(true);
            }
        });
    }


    WriteS7(s7client: any, db: number, start: number, size: number, debugLog: number, retryCount: number, buffer?: Buffer, callBack?: (success: Boolean) => any) {
        var log: any = this.log;
        if (retryCount == 0) {
            log(' >> Retry counter reached max value');
            if (callBack) {
                callBack(false);
            }
            return -1;
        }
        retryCount = retryCount - 1;
        s7client.DBWrite(db, start, size, buffer, (err: Error) => {
            if(err) {
                if (debugLog == 1) {
                    log(' >> DBWrite failed. Code #' + err + ' - ' + s7client.ErrorText(err));
                }
                log(' >> Retrying:' + retryCount);
                sleep(500).then(() => {
                    s7client.Disconnect();
                    this.ConnectS7(s7client, debugLog, 5,(success: Boolean) => {
                        this.WriteS7(s7client, db, start, size, debugLog, retryCount, buffer, callBack);
                    });
                });
                return
            }
            if (callBack) {
                callBack(true);
            }
        });
    }

    getAddressAndBit(name: string, target_type: string): LogoAddress {

        if (name.match("AI[0-9]{1,2}")) {
            var num = parseInt(name.replace("AI", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateWord(926, num);
            } else {
                return Snap7Logo.calculateWord(1032, num);
            }
        }

        if (name.match("AQ[0-9]{1,2}")) {
            var num = parseInt(name.replace("AQ", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateWord(944, num);
            } else {
                return Snap7Logo.calculateWord(1072, num);
            }
        }

        if (name.match("AM[0-9]{1,2}")) {
            var num = parseInt(name.replace("AM", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateWord(952, num);
            } else {
                return Snap7Logo.calculateWord(1118, num);
            }
        }

        if (name.match("I[0-9]{1,2}")) {
            var num = parseInt(name.replace("I", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateBit(923, num);
            } else {
                return Snap7Logo.calculateBit(1024, num);
            }
        }

        if (name.match("Q[0-9]{1,2}")) {
            var num = parseInt(name.replace("Q", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateBit(942, num);
            } else {
                return Snap7Logo.calculateBit(1064, num);
            }
        }

        if (name.match("M[0-9]{1,2}")) {
            var num = parseInt(name.replace("M", ""), 10)
            if (target_type == "0BA7") {
                return Snap7Logo.calculateBit(948, num);
            } else {
                return Snap7Logo.calculateBit(1104, num);
            }
        }

        if (name.match("V[0-9]{1,4}\.[0-7]{1}")) {
            var str = name.replace("V", "");
            var a = parseInt(str.split(".", 2)[0], 10);
            var b = parseInt(str.split(".", 2)[1], 10);
            return new LogoAddress(a, b, WordLen.S7WLBit);
        }

        if (name.match("VB[0-9]{1,4}")) {
            var num = parseInt(name.replace("VB", ""), 10)
            return new LogoAddress(num, 0, WordLen.S7WLByte);
        }

        if (name.match("VW[0-9]{1,4}")) {
            var num = parseInt(name.replace("VW", ""), 10)
            return new LogoAddress(num, 0, WordLen.S7WLWord);
        }

        if (name.match("VD[0-9]{1,4}")) {
            var num = parseInt(name.replace("VD", ""), 10)
            return new LogoAddress(num, 0, WordLen.S7WLDWord);
        }

        return new LogoAddress(0, 0, WordLen.S7WLBit);
    }

    isValidLogoAddress(name: string): boolean {

        if (name.match("AI[0-9]{1,2}")) {
            return true;
        }

        if (name.match("AQ[0-9]{1,2}")) {
            return true;
        }

        if (name.match("AM[0-9]{1,2}")) {
            return true;
        }

        if (name.match("I[0-9]{1,2}")) {
            return true;
        }

        if (name.match("Q[0-9]{1,2}")) {
            return true;
        }

        if (name.match("M[0-9]{1,2}")) {
            return true;
        }

        if (name.match("V[0-9]{1,4}\.[0-7]{1}")) {
            return true;
        }

        if (name.match("VB[0-9]{1,4}")) {
            return true;
        }

        if (name.match("VW[0-9]{1,4}")) {
            return true;
        }

        if (name.match("VD[0-9]{1,4}")) {
            return true;
        }

        return false;
    }

    static calculateBit(base: number, num: number) {
        var x = Math.floor((num - 1) / 8);
        var y = 8 * (x + 1);
        var addr = base + x;
        var bit = 7 - (y - num);
        return new LogoAddress(addr, bit, WordLen.S7WLBit);
    }

    static calculateWord(base: number, num: number) {
        var addr = base + ((num - 1) * 2);
        return new LogoAddress(addr, 0, WordLen.S7WLWord);
    }

}

const sleep = (milliseconds: number) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}