import tornado
import tornado.web
import tornado.httpserver
import tornado.ioloop

from . import settings, handlers
from . import game

def main():
    _the_room = game.GameRoom()
    _the_room.start()

    _handlers = (
        [ (r'/'       , handlers.common.FileHandler, {'path':settings.index_html_path})
        , (r'/ws'     , handlers.ShootGameWSHandler, {'room':_the_room})
        , (r'/st/(.+)', tornado.web.StaticFileHandler, {'path':settings.static_path})
        ] )

    app = tornado.web.Application(
        handlers       = _handlers,
        template_path  = settings.template_path,
        static_path    = settings.static_path,
        autoreload     = settings.autoreload,
        debug          = settings.debug,
    )
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(settings.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == '__main__':
    main()

