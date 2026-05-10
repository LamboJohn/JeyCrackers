f = open('index.html', 'r', encoding='utf-8')
content = f.read()
f.close()

old = 'JEY CRACKERS</span>\n        <span style="font-size:0.85rem; opacity:0.8;">Use fireworks safely and only where permitted.</span>\n      </div>'
new = 'JEY CRACKERS</span>\n        <span style="font-size:0.85rem; opacity:0.8;">Use fireworks safely and only where permitted.</span>\n        <a href="safety-tips.html" style="font-size:0.85rem; color:#ffd700;">Safety Guide</a>\n      </div>'

if old in content:
    result = content.replace(old, new, 1)
    f = open('index.html', 'w', encoding='utf-8')
    f.write(result)
    f.close()
    print('Done - Safety Guide link added!')
else:
    print('NOT FOUND - check the file')
