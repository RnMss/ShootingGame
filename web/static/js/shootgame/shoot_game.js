"use strict";

// ServerMessage = {
//     time   : Int,
//     events : Event[]
// }
//
// Event
//     = { type = 'handshake',
//         name : String,          -- Your name
//         id   : Int,
//         time : Int              -- Game time when you started
//       }
//     | { type = 'new_player',
//         name     : String,      -- Player name
//         id       : Int,         -- Player ID
//         init_pos : Point
//       }
//     | { type = 'move',
//         id     : Int,           -- Player who moved
//         to_pos : Point
//       }
//
// Point = { x: Number,
//           y: Number
//         }
//
//
// ClientMessage
//     = { type = 'handshake',
//         name : String
//       }
//     | { type = 'move',
//         to_pos : Point
//       }


/*
user = { name: String,
       , dest: 
       }
*/


var PI = Math.PI;
var PI2 = PI * 2;
var RANGLE = PI / 2;

var FULL_ANGLE = 3600;
var FLAT_ANGLE = 1800;
var RIGHT_ANGLE = 900;

// 用定点数代替浮点数，保证不同机器没有误差
// 这样就服务器就不用写游戏逻辑了哈哈哈哈哈
var PRECISION = 10000;

// 0.0°至90.0°的正弦（乘以PRECISION）
var DEGREE_SIN = new Int32Array([
0,17,34,52,69,87,104,122,139,157,174,191,209,226,244,261,279,296,314,331,348,366,383,401,418,436,453,471,488,505,523,540,558,575,593,610,627,645,662,680,697,714,732,749,767,784,801,819,836,854,
871,888,906,923,941,958,975,993,1010,1027,1045,1062,1079,1097,1114,1132,1149,1166,1184,1201,1218,1236,1253,1270,1287,1305,1322,1339,1357,1374,1391,1409,1426,1443,1460,1478,1495,1512,1529,1547,1564,1581,1598,1616,1633,1650,1667,1684,1702,1719,
1736,1753,1770,1788,1805,1822,1839,1856,1873,1890,1908,1925,1942,1959,1976,1993,2010,2027,2044,2062,2079,2096,2113,2130,2147,2164,2181,2198,2215,2232,2249,2266,2283,2300,2317,2334,2351,2368,2385,2402,2419,2436,2453,2469,2486,2503,2520,2537,2554,2571,
2588,2605,2621,2638,2655,2672,2689,2706,2722,2739,2756,2773,2789,2806,2823,2840,2856,2873,2890,2907,2923,2940,2957,2973,2990,3007,3023,3040,3056,3073,3090,3106,3123,3139,3156,3173,3189,3206,3222,3239,3255,3272,3288,3305,3321,3338,3354,3370,3387,3403,
3420,3436,3452,3469,3485,3502,3518,3534,3551,3567,3583,3599,3616,3632,3648,3665,3681,3697,3713,3729,3746,3762,3778,3794,3810,3826,3842,3859,3875,3891,3907,3923,3939,3955,3971,3987,4003,4019,4035,4051,4067,4083,4099,4115,4131,4146,4162,4178,4194,4210,
4226,4241,4257,4273,4289,4305,4320,4336,4352,4368,4383,4399,4415,4430,4446,4461,4477,4493,4508,4524,4539,4555,4570,4586,4601,4617,4632,4648,4663,4679,4694,4710,4725,4740,4756,4771,4786,4802,4817,4832,4848,4863,4878,4893,4909,4924,4939,4954,4969,4984,
4999,5015,5030,5045,5060,5075,5090,5105,5120,5135,5150,5165,5180,5195,5210,5224,5239,5254,5269,5284,5299,5313,5328,5343,5358,5372,5387,5402,5417,5431,5446,5461,5475,5490,5504,5519,5533,5548,5562,5577,5591,5606,5620,5635,5649,5664,5678,5692,5707,5721,
5735,5750,5764,5778,5792,5807,5821,5835,5849,5863,5877,5891,5906,5920,5934,5948,5962,5976,5990,6004,6018,6032,6045,6059,6073,6087,6101,6115,6129,6142,6156,6170,6184,6197,6211,6225,6238,6252,6266,6279,6293,6306,6320,6333,6347,6360,6374,6387,6401,6414,
6427,6441,6454,6467,6481,6494,6507,6520,6534,6547,6560,6573,6586,6600,6613,6626,6639,6652,6665,6678,6691,6704,6717,6730,6743,6755,6768,6781,6794,6807,6819,6832,6845,6858,6870,6883,6896,6908,6921,6934,6946,6959,6971,6984,6996,7009,7021,7033,7046,7058,
7071,7083,7095,7107,7120,7132,7144,7156,7169,7181,7193,7205,7217,7229,7241,7253,7265,7277,7289,7301,7313,7325,7337,7349,7360,7372,7384,7396,7408,7419,7431,7443,7454,7466,7477,7489,7501,7512,7524,7535,7547,7558,7569,7581,7592,7604,7615,7626,7637,7649,
7660,7671,7682,7693,7705,7716,7727,7738,7749,7760,7771,7782,7793,7804,7815,7826,7836,7847,7858,7869,7880,7890,7901,7912,7922,7933,7944,7954,7965,7975,7986,7996,8007,8017,8028,8038,8048,8059,8069,8079,8090,8100,8110,8120,8131,8141,8151,8161,8171,8181,
8191,8201,8211,8221,8231,8241,8251,8260,8270,8280,8290,8300,8309,8319,8329,8338,8348,8358,8367,8377,8386,8396,8405,8415,8424,8433,8443,8452,8461,8471,8480,8489,8498,8508,8517,8526,8535,8544,8553,8562,8571,8580,8589,8598,8607,8616,8625,8633,8642,8651,
8660,8668,8677,8686,8694,8703,8712,8720,8729,8737,8746,8754,8763,8771,8779,8788,8796,8804,8813,8821,8829,8837,8845,8853,8862,8870,8878,8886,8894,8902,8910,8917,8925,8933,8941,8949,8957,8964,8972,8980,8987,8995,9003,9010,9018,9025,9033,9040,9048,9055,
9063,9070,9077,9085,9092,9099,9106,9114,9121,9128,9135,9142,9149,9156,9163,9170,9177,9184,9191,9198,9205,9211,9218,9225,9232,9238,9245,9252,9258,9265,9271,9278,9284,9291,9297,9304,9310,9316,9323,9329,9335,9342,9348,9354,9360,9366,9372,9378,9384,9390,
9396,9402,9408,9414,9420,9426,9432,9438,9443,9449,9455,9460,9466,9472,9477,9483,9488,9494,9499,9505,9510,9515,9521,9526,9531,9537,9542,9547,9552,9557,9563,9568,9573,9578,9583,9588,9593,9598,9602,9607,9612,9617,9622,9626,9631,9636,9640,9645,9650,9654,
9659,9663,9668,9672,9677,9681,9685,9690,9694,9698,9702,9707,9711,9715,9719,9723,9727,9731,9735,9739,9743,9747,9751,9755,9759,9762,9766,9770,9774,9777,9781,9785,9788,9792,9795,9799,9802,9806,9809,9812,9816,9819,9822,9826,9829,9832,9835,9838,9841,9845,
9848,9851,9854,9857,9859,9862,9865,9868,9871,9874,9876,9879,9882,9884,9887,9890,9892,9895,9897,9900,9902,9905,9907,9909,9912,9914,9916,9918,9921,9923,9925,9927,9929,9931,9933,9935,9937,9939,9941,9943,9945,9947,9948,9950,9952,9953,9955,9957,9958,9960,
9961,9963,9964,9966,9967,9969,9970,9971,9973,9974,9975,9976,9978,9979,9980,9981,9982,9983,9984,9985,9986,9987,9988,9988,9989,9990,9991,9991,9992,9993,9993,9994,9995,9995,9996,9996,9997,9997,9997,9998,9998,9998,9999,9999,9999,9999,9999,9999,9999,9999,
10000]);

var DEG_RAD = 1800 / PI, RAD_DEG = PI / 1800;

function sin(deg) {
    if (deg < 0) return -sin(deg);
    
    deg %= 3600;
    return (
        deg <= 1800
            ? deg <= 900
                ? DEGREE_SIN[deg]
                : DEGREE_SIN[1800-deg]
            : deg <= 2700
                ? -DEGREE_SIN[deg-1800]
                : -DEGREE_SIN[3600-deg]
    );
}

function cos(deg) {
    if (deg < 0) deg = -deg;
    deg %= 3600;

    return (
        deg <= 1800
            ? deg <= 900
                ? DEGREE_SIN[900-deg]
                : -DEGREE_SIN[deg-900]
            : deg <= 2700
                ? -DEGREE_SIN[2700-deg]
                : DEGREE_SIN[deg-2700]
    );        
}

// 太麻烦不想写，暂时偷懒
// 姑且认为atan2的能精确到0.1°
function atan2(y, x) {
    var d = Math.floor(Math.atan2(y, x) * DEG_RAD);
    if (d < 0) d += FULL_ANGLE;
    return d;
}


function Vec2(x, y) {
    this.x = x;
    this.y = y;
}

function vec2(x, y) {
    return new Vec2(x, y);
}

// This is a stub
var GameWorld = (function () {

    var MAX_WIDTH = 40;
    var MAX_HEIGTH = 40;

    return function(array) {

        var width = MAX_WIDTH;
        var height = MAX_HEIGTH;

        var blocks = new Int8Array(array);

        function get_block(x, y) {
            return blocks[y * width + x];
        }
        this.get_block = get_block;

        this.block_from_point = function (x, y) {
            return get_block(
                Math.floor(x / this.block_width),
                Math.floor(y / this.block_width)
            );
        }

        function set_block(x, y, b) {
            blocks[y * width + x] = b;
        }
        this.set_block = set_block;

        this.block_width = 40 * PRECISION;

        Object.defineProperty(this, 'width' , { value: width  });
        Object.defineProperty(this, 'height', { value: height });

    };

})();


var ShootGame = (function() {
    var GAME_TICK_FACTOR = 6;
    var MIN_LATENCY = 2;
    var MAX_LATENCY = 6;

    var MOVE_SPEED = 2.5 *PRECISION>>0;    // 玩家移速，单位是 [1e-4 px / frame]
    var MOVE_SPEED_SQR = sqr(MOVE_SPEED);  // 玩家移速的平方 [1e-8 px^2 / frame^2]
    
    
    var ROTATE_SPEED = 75;       // 单位是 [0.1° / frame]
    var ROTATE_TOLERANCE = 280;  // 目标点与玩家面向夹角小于这个值就开始移动了（不然走弧线动作很愣）
                                 //  [0.1°]

    var PLAYER_RADIUS = 20.0 *PRECISION>>0;  // 玩家单位的半径 [ 1e-4 px ]
    var GUN_LENGTH = 24.0 *PRECISION>>0;     // 从玩家中心到枪口的长度 [1e-4 px]
    var BULLET_SPEED = 9 *PRECISION>>0;      // 子弹的移速 [ 1e-4px / frame ]
    var BULLET_LIFE = 60;                    // 子弹的寿命（和射程成正比） [ frame ]
    var BULLET_COOLDOWN = 40;                // 开枪冷却 [ frame ]

    function Bullet(player) {
        this.from = player.id;
        this.id = player.bullet_id;
        this.pos = plus2d(player.pos, scale2dP(player.dest_norm, GUN_LENGTH));
        this.orient = player.dest_angle;
        this.velocity = scale2dP(player.dest_norm, BULLET_SPEED);
    }
    Bullet.prototype = {
        from: null,
        age: 0,
        pos: null,
        orient: null,
        velocity: null,
        dead: false,
    };



    function Player(name, pos) {
        this.name = name;
        this.pos = pos;
        this._dest = pos;
    }

    Player.prototype = {
        name: null,

        bullet_id: null,

        shoot_cooldown: 0,

        pos: null,

        health: 10,
        dead: true,
        
        _orient: 0,
        _orient_norm: vec2(1*PRECISION, 0*PRECISION),

        set orient(v) {
            var vv = v % FULL_ANGLE;
            if (vv < 0.0) vv += FULL_ANGLE;
            this._orient = vv;
            this._orient_norm = norm_from_angle(vv);
        },

        get orient() {
            return this._orient;
        },

        get orient_norm() {
            return this._orient_norm;
        },

        _dest: vec2(0, 0),
        _dest_angle: Number.NaN,
        _dest_norm: Number.NaN,

        get dest() {
            return this._dest;
        },

        set dest(v) {
            this._dest = v;
            this.refresh_dest_angle();
        },

        get dest_angle() {
            return this._dest_angle;
        },

        get dest_norm() {
            return this._dest_norm;
        },

        refresh_dest_angle: function () {
            var dv = minus2d(this._dest, this.pos);
            var da = atan2(dv.y, dv.x);
            this._dest_angle = da;
            this._dest_norm = norm_from_angle(da);
        } 
    };

    function shot_test(bullet, player) {
        return dist2d2(bullet.pos, player.pos) <= PLAYER_RADIUS * PLAYER_RADIUS;
    }

    var BLOOD_TIME = 180;       // 流血持续时间
    var BLOOD_MAX_RADIUS = 40;  // 单位 [ px ]
    var BLOOD_FLOW_RATE = BLOOD_MAX_RADIUS*BLOOD_MAX_RADIUS / BLOOD_TIME;
    function VFXBlood(time, pos, spread, radius, duration) {
        this.start_time = time;
        this.pos = pos;
        this.spread = spread || BLOOD_TIME;
        this.radius = radius || BLOOD_MAX_RADIUS;
        this.flow_rate = this.radius*this.radius/this.spread;
        this.duration = duration || null;
    }
    VFXBlood.prototype = {
        dead: false,
        draw: function (ctx, time) {
            var elp_time = time - this.start_time;
            var time_over = elp_time - this.spread;
            var rad = ((time_over > 0)
                        ? this.radius
                        : Math.sqrt(this.flow_rate * elp_time)); // 血泊的面积和时间成正比

            var alpha = 1.0;
            if (this.duration && time_over > 0) {
                if (time_over > this.duration) {
                    this.dead = true;
                    return;
                } else {
                    alpha = 1.0 - time_over/ this.duration;
                }
            }

            ctx.save();
            ctx.translate(this.pos.x / PRECISION, this.pos.y / PRECISION);
            {
                ctx.beginPath();
                ctx.arc(0, 0, rad, 0, PI2);
                ctx.closePath();

                ctx.globalAlpha = alpha;
                ctx.fillStyle = "#711";
                ctx.fill();
            }
            ctx.restore();
        }
    };

    var CMD_RING_MAX_RADIUS = 20;  // 鼠标命令地上的圈的最后半径 [ px ]
    var CMD_RING_TIME = 45;        // [ frame ]
    var CMD_RING_RADIUS_RATE = CMD_RING_MAX_RADIUS / CMD_RING_TIME;
    var CMD_RING_COLOR = ["rgba(196,0,0,0.6)", "rgba(0,128,0,0.6)"];
    function VFXCmdRing(time, pos, type) {
        this.start_time = time;
        this.pos = pos;
        this.type = type;
    }
    VFXCmdRing.prototype = {
        start_time: null,
        pos: null,
        type: null,
        dead: false,
        draw: function (ctx, time) {
            var elp_time = time - this.start_time;
            if (elp_time > CMD_RING_TIME) {
                this.dead = true;
                return;
            }

            var rad = CMD_RING_RADIUS_RATE * elp_time;
            var color = CMD_RING_COLOR[this.type];

            ctx.save();
            ctx.translate(this.pos.x / PRECISION, this.pos.y / PRECISION);
            {
                ctx.beginPath();
                ctx.arc(0, 0, rad, 0, PI2);
                ctx.closePath();

                ctx.globalAlpha = 1.0 - (elp_time / CMD_RING_TIME);
                ctx.lineWidth = 2.0;
                ctx.strokeStyle = color;
                ctx.stroke();
            }
            ctx.restore();
        }
    };

    var BULLET_DEATH_SPARKS = 6;
    var BULLET_DEATH_SPARK_ANGLE = PI2 / BULLET_DEATH_SPARKS;
    var BULLET_DEATH_TIME = 12;
    var BULLET_DEATH_RADIUS = 10;
    var BULLET_DEATH_SPARK_LEN = 4;
    function VFXBulletDeath(time, pos) {
        this.start_time = time;
        this.pos = pos;
    }
    VFXBulletDeath.prototype = {
        start_time: null,
        pos: null,
        dead: false,
        draw: function (ctx, time) {
            var elp_time = time - this.start_time;
            if (elp_time > BULLET_DEATH_TIME) {
                this.dead = true;
                return;
            } else {
                ctx.save();
                ctx.translate(this.pos.x / PRECISION, this.pos.y / PRECISION);
                ctx.strokeStyle = "#C11";
                ctx.lineWidth = 1;
                for (var i=0; i<BULLET_DEATH_SPARKS; ++i) {
                    ctx.beginPath();
                    var rad0 = elp_time / BULLET_DEATH_TIME * BULLET_DEATH_RADIUS;
                    ctx.moveTo(rad0, 0);
                    ctx.lineTo(rad0 + BULLET_DEATH_SPARK_LEN, 0);
                    ctx.stroke();

                    ctx.rotate(BULLET_DEATH_SPARK_ANGLE);
                }
                ctx.restore();
            }
        }
    }

    var TEXT_FLOAT_SPEED = 0.8 * PRECISION>>0;
    function VFXFloatingText(start_time, pos, text, color, size, duration) {

        var pos = pos;
        this.dead = false;

        this.draw = function (ctx, time) {
            var elp_time = time - start_time;
            if (elp_time > duration) {
                this.dead = true;
                return;
            } else {
                ctx.save();

                ctx.translate(pos.x / PRECISION, (pos.y - elp_time * TEXT_FLOAT_SPEED) / PRECISION);
                ctx.globalAlpha = 1.0 - elp_time / duration;

                ctx.font = size + " monospace";
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.fillText(text, 0, 0);

                ctx.restore();
            }
        }
    }



    function remove_dead_in_dict(d) {
        var deadlist = [];
        for (var k in d) {
            if (d[k].dead) {
                deadlist.push(k);
            }
        }
        for (var i=0; i<deadlist.length; ++i) {
            delete d[deadlist[i]];
        }
    }



    return function (myName) {
        var my_name = myName;
        var my_id = -1;
        var my_player = null;

        var users = {};
        var bullets = {};
        var sendmessage = null;
        var msg_queue = [];
        var ui_w = 1, ui_h = 1;
        //var gametime = 0;
        var ticks = 0;
        var mx = 0, my = 0;

        var world = null;

        var game_state = false;
        
        function process_message(data) {
            switch (data.type) {
                case 'new_player': {
                    var px = data.init_pos.x * world.block_width + world.block_width / 2;
                    var py = data.init_pos.y * world.block_width + world.block_width / 2;
                    
                    users[data.id] = new Player(data.name, vec2(px, py));
                    if (data.id == my_id) {
                        my_player = users[data.id];
                    }
                    break;
                }
                case 'remove_player': {
                    delete users[data.id];
                    break;
                }
                case 'move': {
                    var user = users[data.id];
                    user.dest = data.to_pos;
                    user.bullet_id = null;
                    break;
                }
                case 'handshake': {
                    my_id = data.id;
                    my_name = data.name;
                    world = new GameWorld(data.world);
                    break;
                }
                case 'shoot': {
                    var user = users[data.from];
                    if (ticks >= user.shoot_cooldown) {
                        user.dest = data.to_pos;
                        user.bullet_id = data.id;
                    }
                    break;
                }
                case 'ready': {
                    users[data.id].dead = false;
                    break;
                }
            }

        };

        var my_player_dead = false;
        function player_died(player) {
            player.dead = true;
            if (player.id == my_id) my_player_dead = true;
        }

        function player_shot_by_bullet(player, bullet) {
            bullet.dead = true;

            if (--player.health <= 0) {
                player_died(player);
                add_effect(new VFXBlood(ticks, bullet.pos), 0);
            } else {
                var text_pos = plus2d(player.pos, vec2(0, -PLAYER_RADIUS*1.4));
                add_effect(new VFXFloatingText(ticks, text_pos, "-1", "red", "24px", 240), 2);
                add_effect(new VFXBlood(ticks, bullet.pos, 20, 8, 240), 0);
            }
        }

        function adjust_player_pos(u) {
            var result = false;
            var BW = world.block_width;

            // if (pos + [d]) collides a block, align it to the wall of [n+current].
            function adj_side(dx, dy, nx, ny) {
                var bx = Math.floor((u.pos.x + dx) / BW);
                var by = Math.floor((u.pos.y + dy) / BW);
                if (world.get_block(bx, by) == 1) {
                    u.pos = vec2(nx == null ? u.pos.x : (bx+nx)*BW - dx,
                                 ny == null ? u.pos.y : (by+ny)*BW - dy);
                    result = true;
                }
            }

            adj_side(-PLAYER_RADIUS,              0,    1, null);
            adj_side( PLAYER_RADIUS,              0,    0, null);
            adj_side(             0, -PLAYER_RADIUS, null,    1);
            adj_side(             0,  PLAYER_RADIUS, null,    0);

            function adj_corner(dx, dy, nx, ny) {
                var bx = Math.floor((u.pos.x + dx) / BW);
                var by = Math.floor((u.pos.y + dy) / BW);

                if (world.get_block(bx, by) == 1) {
                    var corner = vec2((bx+nx)*BW, (by+ny)*BW);
                    var delta = minus2d(u.pos, corner);
                    var d_len2 = len2d2(delta);
                    if (d_len2 < PLAYER_RADIUS * PLAYER_RADIUS) {
                        var d_len = Math.sqrt(d_len2) >>0;
                        u.pos = plus2d(corner, scale2d(delta, PLAYER_RADIUS / d_len));
                        result = true;
                    }
                }
            }
            
            adj_corner(-PLAYER_RADIUS, -PLAYER_RADIUS, 1, 1);
            adj_corner(-PLAYER_RADIUS,  PLAYER_RADIUS, 1, 0);
            adj_corner( PLAYER_RADIUS, -PLAYER_RADIUS, 0, 1);
            adj_corner( PLAYER_RADIUS,  PLAYER_RADIUS, 0, 0);

            return result;
        }

        function process_player_move(player) {

            if (player.dead) return;

            var d2 = dist2d2(player.pos, player.dest);

            if (d2 == 0) {
                // Do nothing
            } else if (d2 < MOVE_SPEED_SQR) {
                player.pos = Object.create(player.dest);
            } else {
                var angleabs = Math.abs(player.orient - player.dest_angle);
                if (angleabs > FLAT_ANGLE) angleabs = FULL_ANGLE - angleabs;

                if (player.bullet_id == null && angleabs <= ROTATE_TOLERANCE) {
                    player.pos = plus2d(player.pos, scale2dP(player.orient_norm, MOVE_SPEED));
                    var adjusted = adjust_player_pos(player);
                    if (adjusted || angleabs > 0) {
                        player.refresh_dest_angle();
                    }
                }

                if (angleabs == 0) {
                    if (player.bullet_id != null) {
                        var bullet = new Bullet(player);
                        bullets[player.bullet_id] = bullet;

                        player.dest = player.pos;
                        player.bullet_id = null;

                        player.shoot_cooldown = ticks + BULLET_COOLDOWN;
                    }
                } else if(angleabs < ROTATE_SPEED) {
                    player.orient = player.dest_angle;
                } else {
                    var clockwise_diff = player.dest_angle - player.orient;
                    if (clockwise_diff < 0) {
                        clockwise_diff += FULL_ANGLE;
                    }
                    if (clockwise_diff < FLAT_ANGLE) {
                        player.orient += ROTATE_SPEED;
                    } else {
                        player.orient -= ROTATE_SPEED;
                    }    
                }
            }
        }

        function process_bullet_move(bullet) {
            bullet.pos = plus2d(bullet.pos, bullet.velocity);
            bullet.age += 1;
            if (bullet.age < BULLET_LIFE) {
                var x = Math.floor(bullet.pos.x / world.block_width);
                var y = Math.floor(bullet.pos.y / world.block_width);
                if (world.get_block(x, y) == 0) {
                    return;
                }
            }

            bullet.dead = true;
            add_effect(new VFXBulletDeath(ticks, bullet.pos), 1);
        }

        function process_moves() {
            for (var pid in users) {
                process_player_move(users[pid]);
            }

            for (var bid in bullets) {
                var bullet = bullets[bid];
                process_bullet_move(bullet);

                for (var pid in users) {
                    var player = users[pid];
                    if (!player.dead && !bullet.dead) {
                        if (shot_test(bullet, player)) {
                            player_shot_by_bullet(player, bullet);
                        }
                    }
                }
            }
            remove_dead_in_dict(bullets);

            ticks += 1;
        }
        
        function draw_person(ctx, name, dead) {
            ctx.beginPath();
            ctx.moveTo(0, -GUN_LENGTH / PRECISION);
            ctx.arc(0, 0, PLAYER_RADIUS / PRECISION, 0.2-RANGLE, PI2-RANGLE-0.2);
            ctx.closePath();

            ctx.fillStyle = dead ? "#333" : "#CCC";
            ctx.fill();

            ctx.strokeStyle = dead ? "#DDD" : "#000";
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'miter';
            ctx.stroke();

            ctx.font = "14px monospace";
            ctx.fillStyle = dead ? "#FFF" : "#000";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, 0, 0);
        }

        function draw_cooldown(ctx, percent) {
            ctx.beginPath();
            ctx.arc(0, 0, (GUN_LENGTH*2-PLAYER_RADIUS) / PRECISION, 0, percent*PI2, false);
            
            ctx.strokeStyle = "#555";
            ctx.lineWidth = 4.0;
            ctx.stroke();
        }

        function draw_players(ctx) {
            for (var pid in users) {
                var user = users[pid];
                
                ctx.save();
                ctx.translate(user.pos.x / PRECISION, user.pos.y / PRECISION);
                ctx.rotate(user.orient * RAD_DEG + RANGLE);
                {
                    draw_person(ctx, user.name, user.dead);
                    var shoot_cd = user.shoot_cooldown - ticks;
                    if (shoot_cd > 0) {
                        draw_cooldown(ctx, shoot_cd/BULLET_COOLDOWN);
                    }
                }
                ctx.restore();
            }
        }

        function draw_bullets(ctx) {
            for (var bid in bullets) {
                var bullet = bullets[bid];

                ctx.save();
                ctx.translate(bullet.pos.x / PRECISION, bullet.pos.y / PRECISION);
                //ctx.rotate(bullet.orient + RANGLE);
                {
                    ctx.beginPath();
                    ctx.arc(0, 0, 4, 0, PI2);
                    ctx.closePath();

                    ctx.fillStyle = "#F22";
                    ctx.fill();

                    ctx.strokeStyle = "#800";
                    ctx.lineWidth = 1.0;
                    ctx.lineJoin = 'miter';
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        var effects = [{}, {}, {}];
        var effects_autoid = 0;
        function add_effect(vfx, n) {
            effects[n || 0][effects_autoid++] = vfx;
        }

        function draw_effects(ctx, n) {
            var effs = effects[n];
            for (var eid in effs) {
                var effect = effs[eid];
                effect.draw(ctx, ticks);
            }

            remove_dead_in_dict(effs);
        }


        var map = {};
        
        var GRID_WIDTH = 100;

        function draw_map(ctx) {
            ctx.save();

            var BW = world.block_width;

            var x0 = Math.floor((my_player.pos.x - ui_w * 0.5 * PRECISION) / BW);
            var x1 =  Math.ceil((my_player.pos.x + ui_w * 0.5 * PRECISION) / BW);
            var y0 = Math.floor((my_player.pos.y - ui_h * 0.5 * PRECISION) / BW);            
            var y1 =  Math.ceil((my_player.pos.y + ui_h * 0.5 * PRECISION) / BW);

            if (x0 < 0) x0 = 0;
            if (x1 > world.width) x1 = world.width;
            if (y0 < 0) y0 = 0;
            if (y1 > world.height) y1 = world.height;
            
            ctx.beginPath();

            for (var y = y0; y < y1; ++y) {
                for (var x = x0; x < x1; ++x) {
                    var b = world.get_block(x, y);
                    if (b == 1) {
                        var px0 = x * BW, px1 = px0 + BW;
                        var py0 = y * BW, py1 = py0 + BW;
                        ctx.rect(px0/PRECISION + 6, py0/PRECISION + 6, BW/PRECISION - 12, BW/PRECISION - 12);
                    }
                }
            }

            ctx.fillStyle = "#FC8";
            ctx.fill();

            ctx.lineWidth = 10;
            ctx.lineJoin = 'round';
            ctx.strokeStyle = "#FC8";
            ctx.stroke();

            ctx.restore();
        }

        function draw_debug(ctx) {
            ctx.save();

            ctx.font = "11px monospace";
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText("Stalled: ", 20, 30);

            var ML = 60;
            var w = msg_queue.length;
            var r = Math.floor(w / ML * 255), g = 255 - r;

            if (w > ML) { 
                ctx.fillStyle = 'red'; 
            } else {
                ctx.fillStyle = "rgba("+r+","+g+",0,1)";
            }
            ctx.fillRect(80, 25, w, 10);

            ctx.restore();
        }

        function draw_hud(ctx) {
            ctx.save();

            ctx.font = "24px monospace";
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';

            var s = "";
            for (var i=0; i<my_player.health; ++i) s += "♥";

            ctx.fillStyle = "red";
            ctx.fillText(s, 20, ui_h - 20);

            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.strokeText(s, 20, ui_h - 20);
            
            ctx.restore();
        }


        this.draw = function(canvas) {
            var ctx = canvas.getContext("2d");
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (game_state) {
                ctx.save();
                ctx.translate(
                    0.5*canvas.width - my_player.pos.x / PRECISION,
                    0.5*canvas.height - my_player.pos.y / PRECISION
                );
                {
                    draw_effects(ctx, 0);
                    draw_map(ctx);
                    draw_effects(ctx, 1);
                    draw_players(ctx);
                    draw_bullets(ctx);
                    draw_effects(ctx, 2);
                }
                ctx.restore();

                draw_debug(ctx);

                draw_hud(ctx);
            } else {
                ctx.save();

                var x = 0, y = 0;
                var pad = 40, spc = 100;
                var w = ui_w - pad*2 - spc, h = ui_h - pad*2 - spc;
                for (var pid in users) {
                    var user = users[pid];

                    ctx.save();
                    ctx.translate(x + spc*0.5 + pad, y + spc*0.5 + pad);

                    draw_person(ctx, user.name, user.dead);
                    ctx.restore();

                    x += spc; if (x > w) {
                        x = 0; y += spc;
                    }
                }

                ctx.restore();
            }
        };

        this.mousemove = function (x, y) {
            mx = x; my = y;

            if (keymap[18]) {
                this.mousedown(2);
            }
        };

        this.mousedown = function (button) {
            if (my_id == -1) return;
            
            var pos = my_player ? my_player.pos : vec2(0, 0);
            var gx = ((mx - ui_w * 0.5) *PRECISION>>0) + pos.x;
            var gy = ((my - ui_h * 0.5) *PRECISION>>0) + pos.y;
            var pos = vec2(gx, gy);

            if (button == 2) {
                sendmessage(JSON.stringify(
                    { type: 'move'
                    , to_pos: pos
                    }
                ));

                add_effect(new VFXCmdRing(ticks, pos, 1), 2);
            } else
            if (button == 0) {
                sendmessage(JSON.stringify(
                    { type: 'shoot'
                    , to_pos: pos     
                    }
                ));

                add_effect(new VFXCmdRing(ticks, pos, 0), 2);
            }
        };

        this.mouseup = function (button) {
        
        };

        var keymap = {};
        this.keydown = function (code) {
            keymap[code] = true;
        };

        this.keyup = function (code) {
            keymap[code] = false;
        };
    
        this.resize = function (w, h) {
            ui_w = w; ui_h = h;
        };

        this.servermessage = function (json) {
            var msg = JSON.parse(json);
            if (msg.time == -1) {
                var events = msg.events;
                for (var i=0; i<events.length; ++i) {
                    process_message(events[i]);
                }
            } else {
                game_state = true;
                msg_queue.push(msg);
            }
        };
    
        this.tick = function() {
            var catch_up = 4;
            if (msg_queue.length > 0) {

                do {
                    if ( (ticks % GAME_TICK_FACTOR == 0) 
                    ) {
                        var msg = msg_queue.shift();
                        var events = msg.events;
                        for (var i=0; i<events.length; ++i) {
                            process_message(events[i]);
                        }
                    }

                    process_moves();

                    catch_up -= 1;
                } while (msg_queue.length > 1 && catch_up > 0);
            }
        };

        this.announce_ready = function() {
            sendmessage(JSON.stringify({
                type: 'ready'
            }));
        }

        this.__defineSetter__('onsendmessage', function (f) {
            sendmessage = f;
        });
        
        this.init = function() {
            sendmessage(JSON.stringify({
                type: 'handshake',
                name: my_name,
            }));
        };
    };

})();

function sqr(x) {
    return x*x;
}
function dist2d2(p, q) {
    return sqr(p.x - q.x) + sqr(p.y - q.y);
}
function dist2d(p, q) {
    return Math.sqrt(dist2d2(p, q)) >>0;
}
function len2d2(p) {
    return p.x * p.x + p.y * p.y;
}
function len2d(p) {
    return Math.sqrt(len2d2(p)) >>0;
}
function plus2d(p, q) {
    return vec2(p.x + q.x, p.y + q.y);
}
function minus2d(p, q) {
    return vec2(p.x - q.x, p.y - q.y);
}
function scale2d(p, k) {
    return vec2(p.x * k >>0, p.y * k >>0);
}
function scale2dP(p, k) {
    return vec2(p.x * k / PRECISION>>0, p.y * k /PRECISION>>0);
}
function div2d(p, k) {
    return vec2(p.x / k >>0, p.y / k >>0);
}
function scaleTo2d(p, len) {
    return scale2d(p, len / len2d(p)>>0);
}
function normalize2d(p) {
    return scale2d(p, PRECISION / len2d(p)>>0);
}
function is_clockwise(p, q) {
    return q.y * p.x - p.y * q.x > 0;
}

function norm_from_angle(a) {
    return vec2(cos(a), sin(a));
}