import html.parser

class P(html.parser.HTMLParser):
    def error(self, msg):
        print("HTML ERROR", msg)

p = P()
p.feed(open("index.html").read())
print("HTML parsed OK")

css = open("style.css").read()
opens = css.count("{")
closes = css.count("}")
print("CSS braces -> open:", opens, "close:", closes, "balanced:", opens == closes)

media_count = css.count("@media")
print("@media blocks:", media_count)
