import shootgame
from os import path

debug = True

BASE_PATH = path.abspath(path.join(path.dirname(shootgame.__file__), "../../web/"))
print("Base Path: " + BASE_PATH)

template_path = path.join(BASE_PATH, "templates")
static_path = path.join(BASE_PATH, "static")

index_html_path = path.join(BASE_PATH, "static", "shoot.htm")

port = 8888

autoreload = debug