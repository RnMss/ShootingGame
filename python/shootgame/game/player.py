import math


class Vec2:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def plus(self, p):
        return Vec2(p.x + self.x, self.y + p.y)

    def minus(self, p):
        return Vec2(self.x - p.x, self.y - p.y)

    def scale(self, k):
        return Vec2(self.x * k, self.y * k)

    def len2(self):
        return self.x * self.x + self.y * self.y

    def len(self):
        return math.sqrt(self.len2())


class Player:
    def __init__(self, ws, name, pid):
        self.name = name
        self.pid  = pid
        self.ws   = ws
        self.ready = False

        self.dest = Vec2(0, 0)
        self.pos = Vec2(0, 0)
