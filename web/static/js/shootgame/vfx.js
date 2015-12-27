"use strict";

//////////////////////////////////////////////////////////////////////////////
// 流血效果
//////////////////////////////////////////////////////////////////////////////


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

//////////////////////////////////////////////////////////////////////////////
// 鼠标命令的动画
//////////////////////////////////////////////////////////////////////////////


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

//////////////////////////////////////////////////////////////////////////////
// 子弹消失的动画
//////////////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////////////
// 文字漂浮效果
//////////////////////////////////////////////////////////////////////////////

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
    };
}
VFXFloatingText.prototype = {
    dead: false,
    draw: null
};

//////////////////////////////////////////////////////////////////////////////
// 爆炸效果
//////////////////////////////////////////////////////////////////////////////

var EXPLOSION_RATE = 9;
function VFXExplosion(start_time, pos, radius) {
    var duration = radius / EXPLOSION_RATE;
    this.draw = function (ctx, time) {
        var elp_time = time - start_time;
        if (elp_time > duration) {
            this.dead = true;
            return;
        } else {
            ctx.save();
            ctx.translate(pos.x / PRECISION, pos.y / PRECISION);
            {
                ctx.beginPath();
                ctx.arc(0, 0, EXPLOSION_RATE * elp_time, 0, PI2);
                ctx.closePath();
                ctx.fillStyle = "rgba(220,40,120,0.3)";
                ctx.fill();
                ctx.strokeStyle = "#F33";
                ctx.lineWidth = 4;
                ctx.stroke();
            }
            ctx.restore();
        }
    };
}
