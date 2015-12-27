from random import uniform, randint
from .player import Vec2


class World:

    def __init__(self):

        self.width = 40
        self.height = 40
        size = self.width * self.height

        def gen_blk(x, y):
            if x==0 or x==self.width-1:
                return 1

            if y==0 or y==self.height-1:
                return 2

            if uniform(0, 1) < 0.2:
                return randint(1,4)
            else:
                return 0

        self.blocks = [gen_blk(x, y)
                            for x in range(self.width)
                            for y in range(self.height)]

    def data(self):
        return self.blocks

    def new_spawn_point(self):
        while True:
            x = randint(1, self.width-1)
            y = randint(1, self.height-1)

            if self.blocks[y*self.width+x] == 0:
                break

        return Vec2(x, y)
