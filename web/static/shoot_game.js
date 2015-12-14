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

function Vec2(x, y) {
    this.x = x;
    this.y = y;
}

// Vec2.prototype = {
//     plus: function (that) {
//         return vec2(this.x+that.x, this.y+that.y);
//     },
//     minus: function (that) {
//         return vec2(this.x-that.x, this.y-that.y);
//     },
//     len2: function () {
//         return this.x*this.x + this.y*this.y;
//     },
//     len: function() {
//         return Math.sqrt(this.len2());
//     },
// };

function vec2(x, y) {
    return new Vec2(x, y);
}

var ShootGame = (function() {
    var GAME_TICK_FACTOR = 6;
    var MAX_LATENCY = 5;

    var MOVE_SPEED = 2.5;
    var MOVE_SPEED_SQR = sqr(MOVE_SPEED);

    return function (myName) {
        var my_name = myName;
        var my_id = -1;
        var users = {};
        var sendmessage = null;
        var msg_queue = [];
        var ui_w = 1, ui_h = 1;
        //var gametime = 0;
        var ticks = 0;
        var mx = 0, my = 0;
        
        var process_message = function(data) {
            switch (data.type) {
                case 'new_player': {
                    users[data.id] = { name: data.name, pos: data.init_pos, dest_pos: vec2(0,0) };
                    break;
                }
                case 'move': {
                    users[data.id].dest_pos = data.to_pos;
                    break;
                }
                case 'handshake': {
                    my_id = data.id;
                    my_name = data.name;
                }
            }
        };

        var process_moves = function() {
            for (var pid in users) {
                var user = users[pid];

                var d2 = dist2d2(user.pos, user.dest_pos);
                if (d2 < MOVE_SPEED_SQR) {
                    user.pos = Object.create(user.dest_pos);
                } else {
                    var dir = minus2d(user.dest_pos, user.pos); 
                    var diff = scale2d(dir, MOVE_SPEED / len2d(dir));
                    user.pos = plus2d(user.pos, diff);
                }
            }
        }
        
        this.draw = function(canvas) {
            var ctx = canvas.getContext("2d");
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(0.5*canvas.width, 0.5*canvas.height);
            {
                for (var pid in users) {
                    user = users[pid];
                    
                    ctx.save();
                    ctx.translate(user.pos.x, user.pos.y);
                    {
                        ctx.beginPath();
                        ctx.arc(0, 0, 20, 0, 6.283);
                        ctx.closePath();

                        ctx.fillStyle = "#CCC";
                        ctx.fill();

                        ctx.strokeStyle = "black";
                        ctx.lineWidth = 1.0;
                        ctx.stroke();

                        ctx.font = "14px monospace";
                        ctx.fillStyle = 'black';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(user.name, 0, 0);
                    }
                    ctx.restore();
                }
            }
            ctx.restore();
        };

        this.mousemove = function (x, y) {
            mx = x; my = y;
        };

        this.mousedown = function () {
            if (my_id == -1) return;
            
            var gx = mx - ui_w * 0.5;
            var gy = my - ui_h * 0.5;

            sendmessage(JSON.stringify(
                { type: 'move'
                , to_pos: vec2(gx, gy)     
                }
            ));
        };

        this.mouseup = function () {
        
        };

        this.keydown = function (code) {
        
        };

        this.keyup = function (code) {
        
        };
    
        this.resize = function (w, h) {
            ui_w = w; ui_h = h;
        };

        this.servermessage = function (json) {
            var msg = JSON.parse(json);
            msg_queue.push(msg);
        },
    
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

                ticks += 1;
            }
        },

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

})();
