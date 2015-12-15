from .game import GameRoom


class GameHall:

    def __init__(self):
        self._room = GameRoom(self)

    def next_room(self):
        self._room = GameRoom(self)

    def get_room(self):
        return self._room


