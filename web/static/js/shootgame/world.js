// This is a stub
var Terrains = (function () {

    var Blocks = {};

    function collide_circle_point(o, rad, q) {
        var v = minus2d(o, q);
        var len2 = len2d2(v);

        if (len2 >= rad * rad) {
            return o;
        }
        return plus2d(q, scaleTo2d(v, rad));
    }

    function collide_circle_line(p, rad, q0, q1) {
        var v1 = minus2d(q1, q0);
        var v0 = minus2d(p, q0);
        
        var dot = dot2d(v0, v1);

        var sqr_q = v1.x * v1.x + v1.y * v1.y;
        if (dot < 0) {
            return collide_circle_point(p, rad, q0);
        }
        if (dot > sqr_q) {
            return collide_circle_point(p, rad, q1);
        }

        var area = clockwise_area(v0, v1);

        var dist_pq2 = trunc(area / sqr_q * area);
        
        if (dist_pq2 < rad * rad) {
            var v_perp = vec2(v1.y, -v1.x);
            var dist_pq = trunc(Math.sqrt(dist_pq2));
            if (area > 0)
                return plus2d(p, scaleTo2d(v_perp, rad - dist_pq));
            else
                return minus2d(p, scaleTo2d(v_perp, rad - dist_pq));
        } else {
            return p;
        }
    }


    function collide_line_line(p0, p1, q0, q1) {
        // Sp0 = (p0 - q0) x (q1 - q0)
        // Sp1 = (q1 - q0) x (p1 - q0)

        // Sq0 = (q0 - p0) x (p1 - p0)
        // Sq1 = (p1 - p0) x (q1 - p0)
        
        //    Sq0 · Sq1 <= 0
        //           &&
        //    Sp0 == 0 && Sp1 != 0
        // || Sp0 · Sp1 < 0

        var vQ = minus2d(q1, q0);
        var vP = minus2d(p1, p0);
        var q0p0 = minus2d(p0, q0);
        
        var Sp0 = clockwise_area(q0p0, vQ);
        var Sp1 = clockwise_area(vQ, minus2d(p1, q0));

        var Sq0 = -clockwise_area(q0p0, vP);
        var Sq1 = clockwise_area(vP, minus2d(q1, p0));

        if (Sq0 * Sq1 >= 0)
            if ( (Sp0 == 0 && Sp1 != 0) || (Sp0 * Sp1 > 0) ) {
                var x = trunc((p0.x * Sp1 + p1.x * Sp0) / (Sp1 + Sp0));
                var y = trunc((p0.y * Sp1 + p1.y * Sp0) / (Sp1 + Sp0));
                return vec2(x, y);
            }

        return null;
    }


    Blocks.Air = {
        draw: function (ctx) {
        },
        collide_circle: function (pos, radius, bw) {
            return pos;
        },
        collide_point: function (p0, p1, bw) {
            return null;
        } 
    };

    function one_line(x0, y0, x1, y1) {
        return {
            draw: function (ctx) {
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);
                ctx.lineWidth = 0.02;
                ctx.lineCap = "round";
                ctx.strokeStyle = "black";
                ctx.stroke();
            },
            collide_circle: function (pos, radius, bw) {
                pos = collide_circle_line(pos, radius, vec2(x0*bw, y0*bw), vec2(x1*bw, y1*bw));
                return pos;
            },
            collide_point: function (p0, p1, bw) {
                var r = collide_line_line(p0, p1, vec2(x0*bw, y0*bw), vec2(x1*bw, y1*bw));
                return r;
            }
        };
    };

    
    function two_lines(x0, y0, x1, y1, x2, y2, x3, y3) {
        return {
            draw: function (ctx) {
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);
                ctx.moveTo(x2, y2);
                ctx.lineTo(x3, y3);
                ctx.lineWidth = 0.02;
                ctx.lineCap = "round";
                ctx.strokeStyle = "black";
                ctx.stroke();
            },
            collide_circle: function (pos, radius, bw) {
                pos = collide_circle_line(pos, radius, vec2(x0*bw, y0*bw), vec2(x1*bw, y1*bw));
                pos = collide_circle_line(pos, radius, vec2(x2*bw, y2*bw), vec2(x3*bw, y3*bw));
                return pos;
            },
            collide_point: function (p0, p1, bw) {
                var r = collide_line_line(p0, p1, vec2(x0*bw, y0*bw), vec2(x1*bw, y1*bw))     ; p1 = r || p1;
                var r = collide_line_line(p0, p1, vec2(x2*bw, y2*bw), vec2(x3*bw, y3*bw)) || r;
                return r || null;
            }
        };
    };

    Blocks.WallHH = two_lines(0.0, 0.1, 1.0, 0.1,    0.0, 0.9, 1.0, 0.9);
    Blocks.WallVV = two_lines(0.1, 0.0, 0.1, 1.0,    0.9, 0.0, 0.9, 1.0);
    Blocks.WallSlash     = one_line(0.0, 1.0, 1.0, 0.0);
    Blocks.WallBackSlash = one_line(0.0, 0.0, 1.0, 1.0);


    var BlockMap = [];
    for (var name in Blocks) {
        Blocks[name].id = BlockMap.length;
        BlockMap.push(Blocks[name]);
    }

    return {
        Blocks: Blocks,
        blocks: BlockMap,
    };

})();

var GameWorld = (function () {

    var MAX_WIDTH = 40;
    var MAX_HEIGTH = 40;

    return function(array) {

        var width = MAX_WIDTH;
        var height = MAX_HEIGTH;

        var blocks = null;
        if (array) blocks = new Int8Array(array);
            else   blocks = new Int8Array(width*height);

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

        this.block_width = 100 * PRECISION;

        Object.defineProperty(this, 'width' , { value: width  });
        Object.defineProperty(this, 'height', { value: height });

    };

})();



