import tornado.websocket
import json
# import threading


class ShootGameWSHandler(tornado.websocket.WebSocketHandler):

    def initialize(self, hall):
        self._hall = hall
        self._room = None
        # self._lock = threading.Lock()

        self._pid = None

    def open(self):
        self._room = self._hall.get_room()
        print("Connection opened from: %s" % self.request.remote_ip)

    def on_close(self):
        if self._pid:
            self._room.remove_player(self._pid)

        print("Connection closed client: %s" % self.request.remote_ip)

    def on_message(self, message):
        data = json.loads(message)

        def case_handshake(d):
            if self._pid is None:
                name = d['name'] if len(d['name'])<8 else d['name'][:6]+"..."
                self._pid = self._room.add_player(self, name)
                if self._pid is None:
                    self.close()

        def case_move(d):
            if self._pid:
                self._room.player_move(self._pid, d['to_pos']['x'], d['to_pos']['y'])

        def case_shoot(d):
            if self._pid:
                self._room.shoot_bullet(self._pid, d['to_pos']['x'], d['to_pos']['y'])

        def case_default(d):
            print("invalid message: ", message)

        { 'handshake': case_handshake
        , 'move'     : case_move
        , 'shoot'    : case_shoot
        }.get(data['type'], case_default)(data)

    def send_events(self, tick, events):
        data = { 'time': tick, 'events': events }
        self.write_message(json.dumps(data))
