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
        var traps = {};
        var entities = [];

        var sendmessage = null;
        var msg_queue = [];
        var ui_w = 1, ui_h = 1;
        //var gametime = 0;
        var ticks = 0;
        var mx = 0, my = 0;

        var world = null;

        var game_state = false;
        
        function EntityTimeBomb(pos, delay, radius, damage) {
            EntityTimeTrigger.call(this, ticks + delay, function() {
                add_effect(new VFXExplosion(ticks, pos, radius/PRECISION), 1);
                for (var pid in users) {
                    var u = users[pid];
                    if (!u.dead && dist2d2(u.pos, pos) < radius*radius) {
                        player_damaged(u, damage, u.pos);
                    }
                }
            });
        }

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
                case 'plant_timebomb': {
                    var user = users[data.from];
                    player_plants_timebomb(user);
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

        function player_damaged(player, damage, pos) {
            player.health -= damage;
            if (player.health <= 0) {
                if (!player.dead) {
                    player_died(player);
                    add_effect(new VFXBlood(ticks, pos), 0);
                }
            } else {
                var text_pos = plus2d(player.pos, vec2(0, -PLAYER_RADIUS*1.4));
                add_effect(new VFXFloatingText(ticks, text_pos, "-" + damage, "red", "24px", 240), 2);
                add_effect(new VFXBlood(ticks, pos, 20, 8, 240), 0);
            }
        }

        function player_shot_by_bullet(player, bullet) {
            bullet.dead = true;
            player_damaged(player, 1, bullet.pos);
        }

        function player_plants_timebomb(player) {
            entities.push(new EntityTimeBomb(player.pos, 120, 100*PRECISION, 3));
        }

        // function adjust_player_pos(u) {
        //     var result = false;
        //     var BW = world.block_width;

        //     // if (pos + [d]) collides a block, align it to the wall of [n+current].
        //     function adj_side(dx, dy, nx, ny) {
        //         var bx = Math.floor((u.pos.x + dx) / BW);
        //         var by = Math.floor((u.pos.y + dy) / BW);
        //         if (world.get_block(bx, by) == 1) {
        //             u.pos = vec2(nx == null ? u.pos.x : (bx+nx)*BW - dx,
        //                          ny == null ? u.pos.y : (by+ny)*BW - dy);
        //             result = true;
        //         }
        //     }

        //     adj_side(-PLAYER_RADIUS,              0,    1, null);
        //     adj_side( PLAYER_RADIUS,              0,    0, null);
        //     adj_side(             0, -PLAYER_RADIUS, null,    1);
        //     adj_side(             0,  PLAYER_RADIUS, null,    0);

        //     function adj_corner(dx, dy, nx, ny) {
        //         var bx = Math.floor((u.pos.x + dx) / BW);
        //         var by = Math.floor((u.pos.y + dy) / BW);

        //         if (world.get_block(bx, by) == 1) {
        //             var corner = vec2((bx+nx)*BW, (by+ny)*BW);
        //             var delta = minus2d(u.pos, corner);
        //             var d_len2 = len2d2(delta);
        //             if (d_len2 < PLAYER_RADIUS * PLAYER_RADIUS) {
        //                 var d_len = Math.sqrt(d_len2) >>0;
        //                 u.pos = plus2d(corner, scale2d(delta, PLAYER_RADIUS / d_len));
        //                 result = true;
        //             }
        //         }
        //     }
            
        //     adj_corner(-PLAYER_RADIUS, -PLAYER_RADIUS, 1, 1);
        //     adj_corner(-PLAYER_RADIUS,  PLAYER_RADIUS, 1, 0);
        //     adj_corner( PLAYER_RADIUS, -PLAYER_RADIUS, 0, 1);
        //     adj_corner( PLAYER_RADIUS,  PLAYER_RADIUS, 0, 0);

        //     return result;
        // }

        function adjust_player_pos(u) {
            var BW = world.block_width;

            var x0 = Math.floor((u.pos.x - PLAYER_RADIUS) / BW);
            var x1 =  Math.ceil((u.pos.x + PLAYER_RADIUS) / BW);
            var y0 = Math.floor((u.pos.y - PLAYER_RADIUS) / BW);
            var y1 =  Math.ceil((u.pos.y + PLAYER_RADIUS) / BW);

            for (var y=y0; y<y1; ++y) {
                for (var x=x0; x<x1; ++x) {
                    var b = world.get_block(x, y);
                    var terrain = Terrains.blocks[b];
                    if (! terrain) { 
                        console.log(x + " " + y);
                    }
                    var delta = vec2(x*BW, y*BW);
                    var p0 = minus2d(u.pos, delta); 
                    var p1 = terrain.collide_circle(p0, PLAYER_RADIUS, BW);
                    u.pos = plus2d(p1, delta);
                }
            }

            return true;
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

        function process_bullet_move(u) {
            u.age += 1;

            var BW = world.block_width;
            if (u.age < BULLET_LIFE) {
                var new_pos = plus2d(u.pos, u.velocity);
            
                var xa = u.pos.x / BW;
                var ya = u.pos.y / BW;
                var xb = new_pos.x / BW;
                var yb = new_pos.y / BW;

                var x0, x1, y0, y1;
                if (xa<xb) { x0=Math.floor(xa)-1; x1=Math.ceil(xb); } else { x0=Math.floor(xb)-1; x1=Math.ceil(xa); }
                if (ya<yb) { y0=Math.floor(ya)-1; y1=Math.ceil(yb); } else { y0=Math.floor(yb)-1; y1=Math.ceil(ya); }
                
                for (var y=y0; y<y1; ++y) {
                    for (var x=x0; x<x1; ++x) {
                        var b = world.get_block(x, y);
                        var terrain = Terrains.blocks[b];
                        if (!terrain) continue;

                        var delta = vec2(x*BW, y*BW);
                        var p0 = minus2d(u.pos, delta);
                        var p1 = minus2d(new_pos, delta);
                        var res = terrain.collide_point(p0, p1, BW);
                        if (res) {
                            new_pos = plus2d(res, delta);
                            u.dead = true;
                        }
                    }
                }

                u.pos = new_pos;
            } else {
                u.dead = true;
            }
            if (u.dead) {
                add_effect(new VFXBulletDeath(ticks, u.pos), 1);
            }
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

            for (var i=0; i<entities.length; ) {
                var entity = entities[i];
                entity.tick(ticks);
                if (entity.dead) {
                    var back = entities.pop();
                    if (i<entities.length) {
                        entities[i] = back;
                    }
                } else {
                    ++i;
                }
            }

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

            var BW = world.block_width;

            var x0 = Math.floor((my_player.pos.x - ui_w * 0.5 * PRECISION) / BW);
            var x1 =  Math.ceil((my_player.pos.x + ui_w * 0.5 * PRECISION) / BW);
            var y0 = Math.floor((my_player.pos.y - ui_h * 0.5 * PRECISION) / BW);            
            var y1 =  Math.ceil((my_player.pos.y + ui_h * 0.5 * PRECISION) / BW);

            if (x0 < 0) x0 = 0;
            if (x1 > world.width) x1 = world.width;
            if (y0 < 0) y0 = 0;
            if (y1 > world.height) y1 = world.height;
            

            for (var y = y0; y < y1; ++y) {
                for (var x = x0; x < x1; ++x) {
                    var b = world.get_block(x, y);

                    if (b != 0) {
                        var px0 = x * BW, px1 = px0 + BW;
                        var py0 = y * BW, py1 = py0 + BW;

                        ctx.save();

                        ctx.translate(px0/PRECISION, py0/PRECISION);
                        ctx.scale(BW/PRECISION, BW/PRECISION);
                        Terrains.blocks[b].draw(ctx);

                        ctx.restore();
                    }
                }
            }


        }

        function draw_debug(ctx) {
            ctx.save();

            ctx.font = "11px monospace";
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            ctx.fillText("Stalled: ", 20, 30);
            ctx.fillText("Pos: (" + my_player.pos.x/PRECISION + "," + my_player.pos.y/PRECISION +"), (" + my_player.pos.x/world.block_width + "," + my_player.pos.y/world.block_width + ")", 20, 40);

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

            if (code == 65) {
                sendmessage(JSON.stringify(
                    { type: 'plant_timebomb' }
                ));
            }
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

