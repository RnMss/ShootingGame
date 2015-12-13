import tornado.websocket


class ShootGameWSHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        print("Connection opened from: %s" % self.request.remote_ip)

    def on_close(self):
        print("Connection closed client: %s" % self.request.remote_ip)

    def on_message(self, message):
        self.write_message(u"You said: " + message)

