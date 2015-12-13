function Ge(x) { return document.getElementById(x); }
function Ce(x,y) {
	var a=document.createElement(x);
	if (y) {a.className = y;}
	return a;
}
function Cd(y) { return Ce("div",y); }
function Ct(x) { return document.createTextNode(x); }
function Uc(x) { return encodeURIComponent(x); }
function Ae(x,y) { x.appendChild(y); return x; }
function Aes(x,ys) { for (var i=0;i<ys.length;++i) { Ae(x, ys[i]); } return x; }
function OnEvent(x,e,y,u) {
    try {
        x.addEventListener(e,y,u);
    } catch (this_is_ie_oh_shit) {
        x["on"+e] = y;
    }
}
/**
 */
function createAjax() {
    try {return new XMLHttpRequest()} catch (oh_shit_this_is_IE) {}
    try {return new ActiveXObject("Msxml2.XMLHTTP")} catch (oh_shit_this_is_old_IE) {}
    try {return new ActiveXObject("Microsoft.XMLHTTP")} catch (hey_welcome_to_earth) {}
    return null;
}
/**
 */
function urlFetch(url) {
    var client = createAjax();
    client.open("GET", url, false);
    client.send();
    return client.responseText;
}

function Bind1(_this, _method) {
	var _t = _this;
	return function(param1) {
		_method.call(_t, param1);
	}
}

// Get global position
function Gp(p) {
	var t = p.getBoundingClientRect();
	return {x : t.left, y : t.top};
}

function Chr(a) {
	return String.fromCharCode(a);
}

function parseQueryArguments() {

    function decodeSpc(s) {
        return decodeURIComponent(s.replace(/\+/g, " "));
    }

    var query = location.search;
    if (query.substr(0,1) == "?") {
        query = query.substr(1);

        var result = {};
        var args = query.split("&");
        for (var i=0; i<args.length; ++i) {
            var kv = args[i].split("=");
            var key = decodeSpc(kv[0]);
            var val = kv.length > 1 ? decodeSpc(kv[1]) : null;
            if (key in result) {
                var old_val = result[key];
                if (old_val instanceof Array) {
                    old_val.push(val);
                } else if (typeof old_val === "string") {
                    result[key] = [old_val, val];
                } else {
                    result[key] = val;
                }
            } else {
                result[key] = val;
            }
        }
        return result;
    } else {
        return {};
    }
}
