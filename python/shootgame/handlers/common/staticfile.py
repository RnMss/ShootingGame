import os.path
from tornado.web import StaticFileHandler


class FileHandler(StaticFileHandler):

    def initialize(self, path):
        self.dirname, self.filename = os.path.split(path)
        super(FileHandler, self).initialize(self.dirname)

    def get(self, path=None, include_body=True):
        super(FileHandler, self).get(self.filename, include_body)
