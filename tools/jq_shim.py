#!/usr/bin/env python
"""jq shim - 用 Python 实现 cursor_client.sh 所需的最小 jq 功能"""
import sys, json, subprocess

def main():
    args = sys.argv[1:]

    # jq -n --arg key val ... '{json}'
    if '-n' in args:
        idx = args.index('-n')
        rest = args[idx+1:]
        # 收集 --arg key val 对
        string_args = {}
        i = 0
        while i < len(rest) and rest[i] == '--arg':
            key = rest[i+1]
            val = rest[i+2]
            string_args[key] = val
            i += 3
        # 剩余是 JSON 模板
        template = ' '.join(rest[i:]).strip().strip("'").strip('"')
        # 替换 $key 占位符
        result = template
        for k, v in string_args.items():
            result = result.replace(f'${k}', json.dumps(v, ensure_ascii=False))
        # 输出
        try:
            parsed = json.loads(result)
            print(json.dumps(parsed, ensure_ascii=False, indent=2))
        except:
            print(result)
        return

    # echo "$json" | jq -r '.field'
    if '-r' in args:
        idx = args.index('-r')
        expr = args[idx+1] if idx+1 < len(args) else '.'
        data = sys.stdin.read()
        try:
            obj = json.loads(data)
        except:
            print(data.strip())
            return
        # 简单表达式解析: .field.subfield 或 .field
        keys = expr.lstrip('.').split('.')
        val = obj
        for k in keys:
            if k == '':
                continue
            if isinstance(val, list) and k == 'length':
                print(len(val))
                return
            if isinstance(val, dict):
                val = val.get(k, '')
            else:
                val = ''
        if val == '' and '//' in expr:
            # .field // 'default' 语法
            parts = expr.split('//')
            key = parts[0].strip().lstrip('.')
            default = parts[1].strip().strip("'").strip('"').strip()
            val = obj
            for k in key.split('.'):
                if k == '': continue
                val = val.get(k, '') if isinstance(val, dict) else ''
            print(val if val != '' and val is not None else default)
            return
        print(val if val is not None else '')
        return

    # echo "$json" | jq . (pretty print)
    if len(args) == 0 or args == ['.']:
        data = sys.stdin.read()
        try:
            obj = json.loads(data)
            print(json.dumps(obj, ensure_ascii=False, indent=2))
        except:
            print(data.strip())
        return

    # 其他情况：透传 stdin
    data = sys.stdin.read()
    try:
        obj = json.loads(data)
        print(json.dumps(obj, ensure_ascii=False, indent=2))
    except:
        print(data.strip())

if __name__ == '__main__':
    main()
