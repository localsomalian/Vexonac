#!/usr/bin/env python3
"""
VexonAC JS obfuscator — XOR-encrypts source, emits a self-decoding loader.
Works with FiveM's v8/Node JS environment.
"""

import sys, os, secrets

def obfuscate(src: str) -> str:
    key  = list(secrets.token_bytes(64))
    data = list(src.encode('utf-8'))
    enc  = [(b ^ key[i % len(key)]) for i, b in enumerate(data)]

    # Pass CommonJS module globals explicitly so require() works inside the decoded code
    return '\n'.join([
        '(function(require,exports,module,__filename,__dirname){',
        f'var _k=[{",".join(map(str,key))}];',
        f'var _d=[{",".join(map(str,enc))}];',
        'var _s="";',
        'for(var _i=0;_i<_d.length;_i++)_s+=String.fromCharCode(_d[_i]^_k[_i%_k.length]);',
        '(new Function("require","exports","module","__filename","__dirname",_s))(require,exports,module,__filename,__dirname);',
        '})(require,exports,module,__filename,__dirname);',
    ])

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python3 js-obfuscator.py <input.js> <output.js>')
        sys.exit(1)
    inp, out = sys.argv[1], sys.argv[2]
    src = open(inp, 'r', encoding='utf-8').read()
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    open(out, 'w', encoding='utf-8').write(obfuscate(src))
    print(f'  obfuscated: {os.path.basename(inp)} → {os.path.basename(out)}')
