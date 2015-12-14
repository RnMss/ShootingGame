import threading
import sched
import time
from .player import Player, Vec2
import math


class set_interval:

    def __init__(self, interval, func, args=(), kwargs={}):
        self.thrd = None
        self.interval = interval
        self.func = func
        self.args = args
        self.kwargs = kwargs
        self.sch = sched.scheduler(time.monotonic, time.sleep)

        self.thrd = threading.Timer(interval, set_interval._looped, (self,))
        self.thrd.start()

    def _looped(self):
        while True:
            self.sch.enter(self.interval, 1, self.func, self.args, self.kwargs)
            self.sch.run(True)

    def cancel(self):
        self.thrd.cancel()


class GameRoom:

    def __init__(self):
        self._users = {}
        self._auto_id = 1
        self._events = []
        self._lock = threading.Lock()
        self._timer = None
        self._ticks = 0

    def __del__(self):
        self._timer.cancel()

    def _tick(self):
        self._lock.acquire()

        self._process_move()

        for pid, player in self._users.items():
            try:
                player.ws.send_events(self._ticks, self._events)
            except:
                pass

        self._events = []

        self._lock.release()

        self._ticks += 1

    def start(self):
        self._timer = set_interval(0.1, GameRoom._tick, (self,))

    def add_player(self, ws, name):
        self._lock.acquire()

        pid = self._auto_id
        self._auto_id += 1

        init_msg = [{
            'type' : 'handshake',
            'name' : name,
            'id'   : pid,
            'time' : 0
        }]
        for p, player in self._users.items():
            init_msg += [
                {
                'type' : 'new_player',
                'id'   : p,
                'name' : player.name,
                'init_pos' : { 'x': player.pos.x, 'y': player.pos.y }
                },
                {
                'type' : 'move',
                'id'   : p,
                'to_pos' : { 'x': player.dest.x, 'y': player.dest.y }
                }
            ]

        self._users[pid] = Player(ws, name, pid)

        self._events.append({
            'type' : 'new_player',
            'id'   : pid,
            'name' : name,
            'init_pos' : { 'x': 0, 'y': 0 }
        })

        ws.send_events(self._ticks, init_msg)

        self._lock.release()

        return pid

    def remove_player(self, pid):
        self._lock.acquire()
        del self._users[pid]
        self._lock.release()

    def player_move(self, pid, x, y):
        self._lock.acquire()
        player = self._users[pid]
        player.dest = Vec2(x, y)
        self._events.append({
            'type'  : 'move',
            'id'    : pid,
            'to_pos': { 'x': x , 'y': y }
        })
        self._lock.release()


    GAME_TICK_FACTOR = 6
    MOVE_SPEED = 2.5 * GAME_TICK_FACTOR
    MOVE_SPEED_SQR = MOVE_SPEED * MOVE_SPEED

    def _process_move(self):
        for pid, user in self._users.items():

            dir = (user.dest).minus(user.pos)
            d2 = dir.len2()
            if d2 < GameRoom.MOVE_SPEED_SQR:
                user.pos = user.dest
            else:
                diff = (dir).scale(GameRoom.MOVE_SPEED / math.sqrt(d2))
                user.pos = (user.pos).plus(diff)
