import threading
import sched
import time
from .player import Player, Vec2
from . import world
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
        self.thrd.daemon = True
        self.thrd.start()

    def _looped(self):
        while True:
            self.sch.enter(self.interval, 1, self.func, self.args, self.kwargs)
            self.sch.run(True)

    def cancel(self):
        self.thrd.cancel()


STATE_PREPARE = 0
STATE_RUNNING = 1
STATE_FINISHED = 2

class GameRoom:

    def __init__(self, hall):
        self._hall = hall

        self._users = {}
        self._unready = 0

        self._world = world.World()

        self._auto_id = 1
        self._bullet_id = 1
        self._events = []
        self._lock = threading.Lock()
        self._timer = None
        self._ticks = 0

        self._state = STATE_PREPARE

    def __del__(self):
        self._timer.cancel()

    def _tick(self):
        self._lock.acquire()

        # self._process_move()

        for pid, player in self._users.items():
            try:
                player.ws.send_events(self._ticks, self._events)
            except:
                pass

        self._events = []

        self._lock.release()

        self._ticks += 1

    def start(self):
        self._lock.acquire()
        if self._state == STATE_PREPARE:
            self._timer = set_interval(0.099, GameRoom._tick, (self,))
            print("Game started between: ", [u.name for u in self._users.values()])
            self._state = STATE_RUNNING
            self._hall.next_room()
        self._lock.release()

    def add_player(self, ws, name):
        if self._state != STATE_PREPARE:
            return None

        self._lock.acquire()

        pid = self._auto_id
        self._auto_id += 1

        self._unready += 1

        new_player = Player(ws, name, pid, self._world.new_spawn_point())

        old_player_msg = [{
            'type' : 'handshake',
            'name' : name,
            'id'   : pid,
            'world': self._world.data(),
            'time' : 0
        }]
        for p, player in self._users.items():
            old_player_msg.append({
                'type' : 'new_player',
                'id'   : p,
                'name' : player.name,
                'init_pos' : { 'x': player.pos.x, 'y': player.pos.y }
            })

            if player.ready:
                old_player_msg.append({
                    'type': 'ready',
                    'id': p
                })

        new_player_msg = {
            'type' : 'new_player',
            'id'   : pid,
            'name' : name,
            'init_pos' : { 'x': new_player.pos.x, 'y': new_player.pos.y }
        }

        old_player_msg.append(new_player_msg)

        ws.send_events(-1, old_player_msg)

        for user in self._users.values():
            user.ws.send_events(-1, [new_player_msg])

        self._users[pid] = new_player

        self._lock.release()


        return pid

    def remove_player(self, pid):
        self._lock.acquire()

        if not self._users[pid].ready:
            self._unready -= 1

        del self._users[pid]
        if self._state == STATE_RUNNING and len(self._users) == 0:
            self._state = STATE_FINISHED
            self._timer.cancel()

        remove_player_msg = {
            'type': 'remove_player',
            'id': pid
        }
        for user in self._users.values():
            user.ws.send_events(-1, [remove_player_msg])

        self._lock.release()

        if self._state == STATE_FINISHED:
            print("A room closed.")

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

    def player_ready(self, pid):
        self._lock.acquire()

        if not self._users[pid].ready:
            self._users[pid].ready = True
            self._unready -= 1

        unready = self._unready

        ready_msg = {
            'type': 'ready',
            'id' : pid
        }

        for user in self._users.values():
            user.ws.send_events(-1, [ready_msg])

        self._lock.release()

        if unready == 0:
            self.start()


    def shoot_bullet(self, from_pid, x, y):
        self._lock.acquire()
        bid = self._bullet_id
        self._bullet_id += 1
        self._events.append({
            'type' : 'shoot',
            'from'   : from_pid,
            'id'     : bid,
            'to_pos' : { 'x': x, 'y': y }
        })
        self._lock.release()

    def plant_timebomb(self, from_pid):
        self._lock.acquire()
        self._events.append({
            'type' : 'plant_timebomb',
            'from' : from_pid
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
