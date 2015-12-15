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





function Vec2(x, y) {
    this.x = x;
    this.y = y;
}

function vec2(x, y) {
    return new Vec2(x, y);
}

var ShootGame = (function() {
    var GAME_TICK_FACTOR = 6;
    var MIN_LATENCY = 2;
    var MAX_LATENCY = 6;

    var MOVE_SPEED = 2.5;
    var MOVE_SPEED_SQR = sqr(MOVE_SPEED);
    var ROTATE_SPEED = 8.0 / 60;
    var ROTATE_TOLERANCE = 0.5;

    var PLAYER_RADIUS = 20;
    var GUN_LENGTH = 24;
    var BULLET_SPEED = 8.0;
    var BULLET_LIFE = 120;
    var BULLET_COOLDOWN = 40;

    function Bullet(player) {
        this.from = player.id;
        this.id = player.bullet_id;
        this.pos = plus2d(player.pos, scale2d(player.dest_norm, GUN_LENGTH));
        this.orient = player.dest_angle;
        this.velocity = scale2d(player.dest_norm, BULLET_SPEED);
    }
    Bullet.prototype = {
        from: null,
        age: 0,
        pos: null,
        orient: null,
        velocity: null,
        dead: false,

        process_move: function() {
            this.pos = plus2d(this.pos, this.velocity);
            this.age += 1;
            if (this.age >= BULLET_LIFE) {
                this.dead = true;
            }
        }
    };


    function Player(name, pos) {
        this.name = name;
        this.pos = pos;
    }

    Player.prototype = {
        name: null,

        bullet_id: null,

        shoot_cooldown: 0,

        pos: null,
        
        _orient: 0.0,
        _orient_norm: vec2(1, 0),
        
        get orient() {
            return this._orient;
        },

        set orient(v) {
            var vv = v % PI2;
            if (vv < 0.0) vv += PI2;
            this._orient = vv;
            this._orient_norm = norm_from_angle(vv);
        },

        get orient_norm() {
            return this._orient_norm;
        },

        _dest: vec2(0, 0),
        _dest_angle: Math.NaN,
        _dest_norm: Math.NaN,

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

        // _aim: null,
        // _aim_angle: null,

        // get aim() {
        //     return this._aim;
        // },

        // set aim(v) {
        //     this._aim = v;
        //     if (v) {

        //     }
        // },

        // get aim_angle() {
        //     return this._aim_angle;
        // },

        refresh_dest_angle: function () {
            var dv = minus2d(this._dest, this.pos);
            var da = Math.atan2(dv.y, dv.x);
            if (da < 0) da += PI2
            this._dest_angle = da;
            this._dest_norm = norm_from_angle(da);
        },

        process_move: function(bullets) {
            if (this.dead) return;

            var d2 = dist2d2(this.pos, this.dest);

            if (d2 < 0.00000001) {
                // Do nothing
            } else if (d2 < MOVE_SPEED_SQR) {
                this.pos = Object.create(this.dest);
            } else {
                var angleabs = Math.abs(this.orient - this.dest_angle);
                if (this.bullet_id == null && angleabs < ROTATE_TOLERANCE) {
                    this.pos = plus2d(this.pos, scale2d(this.orient_norm, MOVE_SPEED));
                    if (angleabs > 0.0001) {
                        this.refresh_dest_angle();
                    }
                }

                if (angleabs < 0.0001) {
                    if (this.bullet_id != null) {
                        var bullet = new Bullet(this);
                        bullets[this.bullet_id] = bullet;

                        this.dest = this.pos;
                        this.bullet_id = null;
                    }
                } else if(angleabs < ROTATE_SPEED) {
                    this.orient = this.dest_angle;
                } else {
                    var clockwise_diff = this.dest_angle - this.orient;
                    while (clockwise_diff < 0) {
                        clockwise_diff += PI2;
                    }
                    if (clockwise_diff < PI) {
                        this.orient += ROTATE_SPEED;
                    } else {
                        this.orient -= ROTATE_SPEED;
                    }    
                }
            }
        }
    };

    function shot_test(bullet, player) {
        return dist2d2(bullet.pos, player.pos) <= PLAYER_RADIUS * PLAYER_RADIUS;
    }

    var BLOOD_TIME = 180;
    var BLOOD_MAX_RADIUS = 40;
    var BLOOD_FLOW_RATE = BLOOD_MAX_RADIUS*BLOOD_MAX_RADIUS / BLOOD_TIME;
    function VFXBlood(time, pos) {
        this.start_time = time;
        this.pos = pos;
    }
    VFXBlood.prototype = {
        dead: false,
        draw: function (ctx, time) {
            var elp_time = time - this.start_time;
            var rad = (elp_time >= BLOOD_TIME
                        ? BLOOD_MAX_RADIUS
                        : Math.sqrt(BLOOD_FLOW_RATE * elp_time));

            ctx.save();
            ctx.translate(this.pos.x, this.pos.y);
            {
                ctx.beginPath();
                ctx.arc(0, 0, rad, 0, PI2);
                ctx.closePath();

                ctx.fillStyle = "#711";
                ctx.fill();
            }
            ctx.restore();
        }
    };

    var CMD_RING_MAX_RADIUS = 20;
    var CMD_RING_TIME = 45;
    var CMD_RING_RADIUS_RATE = CMD_RING_MAX_RADIUS / CMD_RING_TIME;
    var CMD_RING_COLOR = ["rgba(196,0,0,0.6)", "rgba(0,128,0,0.6)"];
    function VFXCmdRing(time, pos, type) {
        this.start_time = time;
        this.pos = pos;
        this.type = type;
    }
    VFXCmdRing.prototype = {
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
            ctx.translate(this.pos.x, this.pos.y);
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
        
        function process_message(data) {
            switch (data.type) {
                case 'new_player': {
                    users[data.id] = new Player(data.name, data.init_pos);
                    if (data.id == my_id) {
                        my_player = users[data.id];
                    }
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
                    break;
                }
                case 'shoot': {
                    var user = users[data.from];
                    if (ticks >= user.shoot_cooldown) {
                        user.dest = data.to_pos;
                        user.bullet_id = data.id;

                        user.shoot_cooldown = ticks + BULLET_COOLDOWN;
                    }
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
            player_died(player);
            add_effect(new VFXBlood(ticks, bullet.pos));
        }

        function process_moves() {
            for (var pid in users) {
                users[pid].process_move(bullets);
            }

            for (var bid in bullets) {
                var bullet = bullets[bid];
                bullet.process_move();

                for (var pid in users) {
                    var player = users[pid];
                    if (!player.dead) {
                        if (shot_test(bullet, player)) {
                            player_shot_by_bullet(player, bullet);
                        }
                    }
                }
            }
            remove_dead_in_dict(bullets);

            ticks += 1;
        }
        
        function draw_players(ctx) {
            for (var pid in users) {
                var user = users[pid];
                
                ctx.save();
                ctx.translate(user.pos.x, user.pos.y);
                ctx.rotate(user.orient + RANGLE);
                {
                    ctx.beginPath();
                    ctx.moveTo(0, -GUN_LENGTH);
                    ctx.arc(0, 0, PLAYER_RADIUS, 0.2-RANGLE, PI2-RANGLE-0.2);
                    ctx.closePath();

                    ctx.fillStyle = user.dead ? "#333" : "#CCC";
                    ctx.fill();

                    ctx.strokeStyle = user.dead ? "#DDD" : "#000";
                    ctx.lineWidth = 2.5;
                    ctx.lineJoin = 'miter';
                    ctx.stroke();

                    ctx.font = "14px monospace";
                    ctx.fillStyle = user.dead ? "#FFF" : "#000";
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(user.name, 0, 0);


                    var shoot_cd = user.shoot_cooldown - ticks;
                    if (shoot_cd > 0) {
                        ctx.beginPath();
                        ctx.arc(0, 0, GUN_LENGTH*2-PLAYER_RADIUS, 0, shoot_cd/BULLET_COOLDOWN*PI2, false);
                        
                        ctx.strokeStyle = "#555";
                        ctx.lineWidth = 4.0;
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }
        }

        function draw_bullets(ctx) {
            for (var bid in bullets) {
                var bullet = bullets[bid];

                ctx.save();
                ctx.translate(bullet.pos.x, bullet.pos.y);
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

        var effects = {};
        var effects_autoid = 0;
        function add_effect(vfx) {
            effects[effects_autoid++] = vfx;
        }

        function draw_effects(ctx) {
            for (eid in effects) {
                var effect = effects[eid];
                effect.draw(ctx, ticks);
            }

            remove_dead_in_dict(effects);
        }


        var map = {};
        
        var GRID_WIDTH = 100;

        function draw_map(ctx) {
            ctx.save();

            var left = my_player.pos.x - ui_w * 0.5;
            var right = my_player.pos.x + ui_w * 0.5;
            var top = my_player.pos.y - ui_h * 0.5;
            var bottom = my_player.pos.y + ui_h * 0.5;

            ctx.lineWidth = 3.0;
            ctx.strokeStyle = "#FC8";

            for (
                var x = Math.ceil(left / GRID_WIDTH) * GRID_WIDTH;
                x < right;
                x += GRID_WIDTH
            ) {
                ctx.beginPath();
                ctx.moveTo(x, top);
                ctx.lineTo(x, bottom);

                ctx.stroke();
            }

            for (
                var y = Math.ceil(top / GRID_WIDTH) * GRID_WIDTH;
                y < bottom;
                y += GRID_WIDTH
            ) {
                ctx.beginPath();
                ctx.moveTo(left, y);
                ctx.lineTo(right, y);

                ctx.stroke();
            }

            ctx.restore();
        }


        this.draw = function(canvas) {
            var ctx = canvas.getContext("2d");
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (my_player) {
                ctx.save();
                ctx.translate(
                    0.5*canvas.width - my_player.pos.x,
                    0.5*canvas.height - my_player.pos.y
                );
                {
                    draw_map(ctx);
                    draw_effects(ctx);
                    draw_players(ctx);
                    draw_bullets(ctx);
                }
                ctx.restore();

                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText("buffered messages " + msg_queue.length, 20, 20);
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
            var gx = mx - ui_w * 0.5 + pos.x;
            var gy = my - ui_h * 0.5 + pos.y;
            var pos = vec2(gx, gy);

            if (button == 2) {
                sendmessage(JSON.stringify(
                    { type: 'move'
                    , to_pos: pos
                    }
                ));

                add_effect(new VFXCmdRing(ticks, pos, 1));
            } else
            if (button == 0) {
                sendmessage(JSON.stringify(
                    { type: 'shoot'
                    , to_pos: pos     
                    }
                ));

                add_effect(new VFXCmdRing(ticks, pos, 0));
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
            msg_queue.push(msg);
        };
    
        this.tick = function() {
            if (msg_queue.length > 0) {
                if (   (ticks % GAME_TICK_FACTOR == 0) 
                    || (msg_queue.length > MAX_LATENCY)
                ) {
                    var msg = msg_queue.shift();
                    var events = msg.events;
                    for (var i=0; i<events.length; ++i) {
                        process_message(events[i]);
                    }
                }

                process_moves();
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
    return Math.sqrt(dist2d2(p, q));
}
function len2d2(p) {
    return p.x * p.x + p.y * p.y;
}
function len2d(p) {
    return Math.sqrt(len2d2(p));
}
function plus2d(p, q) {
    return vec2(p.x + q.x, p.y + q.y);
}
function minus2d(p, q) {
    return vec2(p.x - q.x, p.y - q.y);
}
function scale2d(p, k) {
    return vec2(p.x * k, p.y * k);
}
function div2d(p, k) {
    return vec2(p.x / k, p.y / k);
}
function normalize2d(p) {
    return scale2d(p, 1.0 / len2d(p));
}
function norm_from_angle(a) {
    return vec2(Math.cos(a), Math.sin(a));
}