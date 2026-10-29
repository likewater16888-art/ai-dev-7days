/* =============================================================================
 * js/data/glossary.js
 * -----------------------------------------------------------------------------
 * 命令词典：课程里出现的每个命令 / 参数 / 符号 / 概念 / 报错，都能在这里查到。
 *
 * 一条词条：
 *   t    词本身（检索用，如 'ls'、'-L'、'>'、'绝对路径'）
 *   g    分组：cmd | flag | op | concept | ai | err
 *   read 怎么念（可选，给"不敢张口"的人）
 *   m    一句话含义（必填）
 *   eg   例子（可选）
 *   d    哪一天会用到（可选，如 'd1'、'd4'）
 *   warn 常见坑（可选）
 *   alias 额外检索词（可选，数组）
 *
 * 课程里的「逐字拆解」用 ref 指到这里的 t；对不上也没关系，拆解里有 m 就够。
 * ========================================================================== */
(function (global) {
  'use strict';

  var LX = global.LX = global.LX || {};

  var GROUPS = [
    { id: 'cmd', name: '命令', desc: '在终端里敲的第一个词，决定"做什么"' },
    { id: 'flag', name: '参数', desc: '跟在命令后面，用 - 或 -- 开头，微调"怎么做"' },
    { id: 'op', name: '符号', desc: '路径、管道、重定向这些语法零件，最容易看不懂' },
    { id: 'concept', name: '概念', desc: '屏幕上看不见，但不懂就会一直出错的东西' },
    { id: 'ai', name: 'AI 工具链', desc: '环境、模型、GPU 相关的专用命令' },
    { id: 'err', name: '报错', desc: '看到这几句别慌，这里有读法和解法' }
  ];

  var ITEMS = [
    /* ------------------------------- 命令 ------------------------------- */
    { t: 'pwd', g: 'cmd', m: 'print working directory：打印我现在在哪个目录（绝对路径）', eg: 'pwd', d: 'd1' },
    { t: 'cd', g: 'cmd', m: 'change directory：切换当前目录，后面跟目标路径', eg: 'cd ~/work/exp1', d: 'd1' },
    { t: 'ls', g: 'cmd', m: 'list：列出这个目录里有什么（默认不显示隐藏文件）', eg: 'ls -la ~/work', d: 'd1' },
    { t: 'tree', g: 'cmd', m: '以树状显示目录层级，一眼看清项目骨架', eg: 'tree -L 2', d: 'd1', warn: '精简版 Linux 可能没装 tree，报 command not found 时用 ls -R 代替' },
    { t: 'cat', g: 'cmd', m: 'concatenate：把文件内容整段打印到屏幕（短文件用）', eg: 'cat requirements.txt', d: 'd1' },
    { t: 'head', g: 'cmd', m: '只看文件开头若干行（默认 10 行），看数据长什么样最常用', eg: 'head -3 data/train.csv', d: 'd1' },
    { t: 'tail', g: 'cmd', m: '看文件末尾若干行；加 -f 会一直盯着新写进来的日志', eg: 'tail -f logs/train.log', d: 'd3' },
    { t: 'wc', g: 'cmd', m: 'word count：数行数 / 词数 / 字节数，加 -l 只数行', eg: 'wc -l data/train.csv', d: 'd1' },
    { t: 'grep', g: 'cmd', m: '按关键字过滤文本，只留下命中的行', eg: 'grep -n "loss" logs/train.log', d: 'd3', warn: '一行都没命中时退出码是 1，这不是"命令坏了"' },
    { t: 'find', g: 'cmd', m: '按名字 / 时间 / 大小找文件，会自己进子目录', eg: 'find . -name "*.csv"', d: 'd3' },
    { t: 'cp', g: 'cmd', m: 'copy：复制文件或目录（复制目录要加 -r）', eg: 'cp data/train.csv data/train.bak.csv', d: 'd2' },
    { t: 'mv', g: 'cmd', m: 'move：移动或改名，两个名字写在同一目录里就是改名', eg: 'mv old.txt new.txt', d: 'd2' },
    { t: 'rm', g: 'cmd', m: 'remove：删除，命令行没有回收站', eg: 'rm tmp.log', d: 'd2', warn: 'rm -rf 会静默删掉整棵目录树，敲之前先 ls 看一眼' },
    { t: 'mkdir', g: 'cmd', m: 'make directory：建目录，-p 能一次性建出多层', eg: 'mkdir -p ~/work/exp1/data', d: 'd1' },
    { t: 'touch', g: 'cmd', m: '建一个空文件；文件已存在就只更新修改时间', eg: 'touch notes.md', d: 'd1' },
    { t: 'ln', g: 'cmd', m: 'link：建链接，-s 是软链接（像 Windows 快捷方式）', eg: 'ln -s /data/big ~/work/big', d: 'd3' },
    { t: 'chmod', g: 'cmd', m: 'change mode：改权限，755 = 自己可读写执行、别人可读可执行', eg: 'chmod 755 run.sh', d: 'd2' },
    { t: 'chown', g: 'cmd', m: 'change owner：改文件属主，一般要 sudo', eg: 'sudo chown -R student:student work', d: 'd2' },
    { t: 'du', g: 'cmd', m: 'disk usage：看目录/文件占多少空间，-sh 只给一行总数', eg: 'du -sh data models', d: 'd3' },
    { t: 'df', g: 'cmd', m: 'disk free：看磁盘还剩多少，-h 用人看得懂的单位', eg: 'df -h', d: 'd3' },
    { t: 'echo', g: 'cmd', m: '把后面的内容原样输出；配合 > 就能写文件', eg: 'echo "hello" > a.txt', d: 'd1' },
    { t: 'which', g: 'cmd', m: '这个命令到底用的是哪个路径下的可执行文件', eg: 'which python', d: 'd4', warn: 'which python 指向系统目录，说明 conda 环境没激活' },
    { t: 'history', g: 'cmd', m: '列出敲过的命令历史（方向键上也能翻）', eg: 'history | tail -5', d: 'd1' },
    { t: 'clear', g: 'cmd', m: '清屏（快捷键 Ctrl+L 更快），不会删任何东西', eg: 'clear', d: 'd1' },
    { t: 'man', g: 'cmd', m: 'manual：查命令手册，按 q 退出', eg: 'man ls', d: 'd1' },
    { t: 'help', g: 'cmd', m: '本沙盒自带的命令速查（真机上是 命令 --help）', eg: 'help', d: 'd1' },
    { t: 'sudo', g: 'cmd', m: 'superuser do：用管理员身份执行，改系统/装软件才需要', eg: 'sudo apt install tree', d: 'd2', warn: '别习惯性给所有命令加 sudo，会把文件属主改成 root' },
    { t: 'export', g: 'cmd', m: '把变量塞进环境，让后面启动的程序都能读到', eg: 'export CUDA_VISIBLE_DEVICES=0', d: 'd6' },
    { t: 'source', g: 'cmd', m: '在当前 shell 里执行脚本，让里面的变量/激活状态生效', eg: 'source ~/.bashrc', d: 'd4' },
    { t: 'env', g: 'cmd', m: '打印所有环境变量', eg: 'env | grep CUDA', d: 'd6' },
    { t: 'exit', g: 'cmd', m: '退出当前 shell / 结束会话', eg: 'exit', d: 'd1' },
    { t: 'sleep', g: 'cmd', m: '等几秒再继续，脚本里等任务启动常用', eg: 'sleep 5', d: 'd7' },
    { t: 'tee', g: 'cmd', m: '把输出同时写到屏幕和文件（像一根三通管）', eg: 'python train.py | tee logs/train.log', d: 'd3' },
    { t: 'sort', g: 'cmd', m: '排序，-n 按数值、-k2 按第 2 列', eg: 'sort -k2 -n scores.txt', d: 'd3' },
    { t: 'uniq', g: 'cmd', m: '去重（只去掉相邻重复，所以通常先 sort）', eg: 'sort names.txt | uniq -c', d: 'd3' },
    { t: 'cut', g: 'cmd', m: '按列切文本，-d 指定分隔符、-f 指定第几列', eg: "cut -d',' -f1 data/train.csv", d: 'd3' },
    { t: 'sed', g: 'cmd', m: '流式编辑文本，最常用来批量替换；-i 直接改文件', eg: "sed -i 's/2.1/2.4.1/g' requirements.txt", d: 'd4' },
    { t: 'awk', g: 'cmd', m: '按列处理文本的小语言，{print $2} 就是取第 2 列', eg: "awk '{print $2}' scores.txt", d: 'd3' },
    { t: 'xargs', g: 'cmd', m: '把上一步的输出变成下一个命令的参数', eg: 'find . -name "*.tmp" | xargs rm', d: 'd3' },
    { t: 'tar', g: 'cmd', m: '打包/解包；-czf 打包压缩，-xzf 解压', eg: 'tar -czf backup.tar.gz data', d: 'd3' },
    { t: 'zip', g: 'cmd', m: '打成 zip 包，-r 连子目录一起', eg: 'zip -r out.zip models', d: 'd3' },
    { t: 'unzip', g: 'cmd', m: '解压 zip，-d 指定解到哪个目录', eg: 'unzip out.zip -d /tmp/x', d: 'd3' },
    { t: 'ps', g: 'cmd', m: 'process status：看正在跑的进程，aux 是常用组合', eg: 'ps aux | grep python', d: 'd7' },
    { t: 'pgrep', g: 'cmd', m: '按名字找进程 PID，比 ps | grep 干净', eg: 'pgrep -f train.py', d: 'd7' },
    { t: 'pkill', g: 'cmd', m: '按名字杀进程，-f 匹配整条命令行', eg: 'pkill -f train.py', d: 'd7', warn: '杀进程不等于释放显存：GPU 显存要等进程真正退出才回来' },
    { t: 'kill', g: 'cmd', m: '按 PID 发信号，-9 是强杀', eg: 'kill -9 12345', d: 'd7' },
    { t: 'nohup', g: 'cmd', m: 'no hang up：关掉终端任务也继续跑，输出默认写 nohup.out', eg: 'nohup python train.py > logs/train.log 2>&1 &', d: 'd7' },
    { t: 'jobs', g: 'cmd', m: '看当前 shell 里挂着哪些后台任务', eg: 'jobs -l', d: 'd7' },
    { t: 'free', g: 'cmd', m: '看内存和 swap 用量，-h 人类可读', eg: 'free -h', d: 'd3' },
    { t: 'uname', g: 'cmd', m: '看系统信息，-a 全都列出来', eg: 'uname -a', d: 'd1' },
    { t: 'whoami', g: 'cmd', m: '我现在是哪个用户（沙盒里是 student）', eg: 'whoami', d: 'd1' },
    { t: 'stat', g: 'cmd', m: '看文件详细属性：大小、权限、修改时间', eg: 'stat run.sh', d: 'd2' },
    { t: 'file', g: 'cmd', m: '猜文件真实类型（看内容，不看后缀）', eg: 'file data/train.csv', d: 'd3' },
    { t: 'diff', g: 'cmd', m: '逐行比较两个文件的差异', eg: 'diff a.txt b.txt', d: 'd2' },
    { t: 'curl', g: 'cmd', m: '发 HTTP 请求 / 下载，排查接口和端口最常用', eg: 'curl http://127.0.0.1:7860', d: 'd7' },
    { t: 'wget', g: 'cmd', m: '下载文件（支持断点续传）', eg: 'wget https://example.com/model.bin', d: 'd3' },
    { t: 'apt', g: 'cmd', m: 'Ubuntu 的软件包管理器，装系统级工具用它', eg: 'sudo apt install tree -y', d: 'd2' },
    { t: 'tmux', g: 'cmd', m: '终端复用：断网/关窗口后会话还在，跑长任务必备', eg: 'tmux new -s train', d: 'd7' },
    { t: 'docker', g: 'cmd', m: '容器：把环境和代码一起打包，换机器也能跑', eg: 'docker run -it python:3.10 bash', d: 'd7' },
    { t: 'alias', g: 'cmd', m: '给长命令起外号，只对当前 shell 有效', eg: "alias ll='ls -la'", d: 'd4' },
    { t: 'set', g: 'cmd', m: '改 shell 行为，set -e 表示"一出错立刻停"', eg: 'set -e', d: 'd7' },
    { t: 'bash', g: 'cmd', m: '再开一个 shell / 执行脚本', eg: 'bash run.sh', d: 'd7' },
    { t: 'printf', g: 'cmd', m: '格式化输出，会把 \\n 解释成换行，一次写多行文件就靠它', eg: 'printf "a\\nb\\n" > note.md', d: 'd3' },
    { t: 'git', g: 'cmd', m: '版本控制工具：给代码存档、看历史、和远端同步', eg: 'git status', d: 'd5' },
    { t: 'git status', g: 'cmd', m: '看当前分支、改了哪些文件、哪些已暂存（进仓库第一件事）', eg: 'git status', d: 'd5' },
    { t: 'git add', g: 'cmd', m: '把改动放进暂存区（"这次要提交这些"）', eg: 'git add .', d: 'd5' },
    { t: 'git commit', g: 'cmd', m: '给暂存区拍快照并写说明，-m 后面跟一句话', eg: 'git commit -m "exp: baseline 0.86"', d: 'd5' },
    { t: 'git log', g: 'cmd', m: '看提交历史，--oneline 一行一条', eg: 'git log --oneline', d: 'd5' },
    { t: 'git remote', g: 'cmd', m: '管理远端仓库，-v 打印 fetch/push 地址', eg: 'git remote -v', d: 'd5' },
    { t: 'git push', g: 'cmd', m: '把本地提交推到远端（第一次要 -u origin 分支名）', eg: 'git push -u origin main', d: 'd5' },
    { t: 'README.md', g: 'concept', m: '项目的门面文件：怎么装、怎么跑、模型哪来，四行就够用', eg: 'cat README.md', d: 'd7' },
    /* ------------------------------- 参数 ------------------------------- */
    { t: '-l', g: 'flag', m: 'ls -l：长格式（权限、属主、大小、时间）；wc -l：只数行', eg: 'ls -l', d: 'd1' },
    { t: '-a', g: 'flag', m: 'all：连隐藏文件（以 . 开头的）一起显示', eg: 'ls -la', d: 'd1' },
    { t: '-h', g: 'flag', m: '多数命令里是 human-readable（1K/2M 这种单位）；有些命令里是 help', eg: 'df -h', d: 'd3', warn: '同一个字母在不同命令里意思不同，拿不准就 命令 --help' },
    { t: '-r', g: 'flag', m: 'recursive：递归处理子目录（cp -r / rm -r / zip -r）', eg: 'cp -r data data_bak', d: 'd2' },
    { t: '-R', g: 'flag', m: '大写 R 通常也是递归，ls -R 会一层层列下去', eg: 'ls -R', d: 'd1' },
    { t: '-f', g: 'flag', m: 'force（rm -f 不提示强行删）或 follow（tail -f 跟着看新内容）', eg: 'tail -f logs/train.log', d: 'd3' },
    { t: '-n', g: 'flag', m: 'name：给东西起名字（conda create -n ai7）；grep -n 是显示行号', eg: 'conda create -n ai7 python=3.10', d: 'd4' },
    { t: '-i', g: 'flag', m: 'in-place：直接改原文件（sed -i）或交互式确认（rm -i）', eg: "sed -i 's/a/b/' f.txt", d: 'd4' },
    { t: '-v', g: 'flag', m: 'verbose：说详细点，打印过程', eg: 'pip install -v torch', d: 'd4' },
    { t: '-p', g: 'flag', m: 'parents：缺的父目录一起建（mkdir -p a/b/c）', eg: 'mkdir -p a/b/c', d: 'd1' },
    { t: '-L', g: 'flag', m: 'limit / level：限制层数（tree -L 2 只看两层）', eg: 'tree -L 2', d: 'd1' },
    { t: '-3', g: 'flag', m: '数字参数：只要 3 行（head -3 / tail -3）', eg: 'head -3 data/train.csv', d: 'd1' },
    { t: '-y', g: 'flag', m: 'yes：所有确认都自动回答 y，装东西不再问你', eg: 'conda create -n ai7 python=3.10 -y', d: 'd4' },
    { t: '-s', g: 'flag', m: 'symbolic（ln -s 软链接）或 summary（du -sh 只要总数）', eg: 'du -sh data', d: 'd3' },
    { t: '-d', g: 'flag', m: 'directory / delimiter：指定目标目录或分隔符', eg: "cut -d',' -f1 f.csv", d: 'd3' },
    { t: '-k', g: 'flag', m: 'key：按哪一列排序（sort -k2）', eg: 'sort -k2 -n f.txt', d: 'd3' },
    { t: '-u', g: 'flag', m: 'user / unique：指定用户，或开启去重', eg: 'uniq -u f.txt', d: 'd3' },
    { t: '-c', g: 'flag', m: 'count / create：计数（uniq -c）或创建（tar -czf）', eg: 'uniq -c f.txt', d: 'd3' },
    { t: '-e', g: 'flag', m: 'execute：直接执行一小段代码（python -c "print(1)"）', eg: 'python -c "print(1)"', d: 'd4' },
    { t: '-m', g: 'flag', m: 'message：提交/说明用的一句话（git commit -m "..."）', eg: 'git commit -m "add notes"', d: 'd5' },
    { t: '-q', g: 'flag', m: 'quiet：少废话，只给结果', eg: 'pip install -q torch', d: 'd4' },
    { t: '-o', g: 'flag', m: 'output：指定输出到哪', eg: 'curl -o model.bin URL', d: 'd3' },
    { t: '-x', g: 'flag', m: 'extract：解压（tar -xzf）', eg: 'tar -xzf backup.tar.gz', d: 'd3' },
    { t: '-z', g: 'flag', m: 'gzip：打包时顺便压缩', eg: 'tar -czf b.tar.gz data', d: 'd3' },
    { t: '-rf', g: 'flag', m: 'rm -rf = 递归 + 强制：删整棵目录树且不确认，最危险的组合', eg: 'rm -rf tmp', d: 'd2', warn: '永远别在 rm -rf 后面接变量，也不要在 ~ 下随手用' },
    { t: '-la', g: 'flag', m: 'ls -la = 长格式 + 全部（含隐藏文件），最常用的目录体检', eg: 'ls -la', d: 'd1' },
    { t: '-r requirements.txt', g: 'flag', m: 'pip 专用：按清单文件装依赖', eg: 'pip install -r requirements.txt', d: 'd4' },
    { t: '--help', g: 'flag', m: '任何命令加它都会打印用法，真机上最靠谱的说明书', eg: 'pip install --help', d: 'd1' },
    { t: '--version', g: 'flag', m: '打印版本号，排查环境问题的第一步', eg: 'python --version', d: 'd4' },
    { t: '--no-cache-dir', g: 'flag', m: 'pip 不读本地缓存，强制重新下载（怀疑缓存坏了时用）', eg: 'pip install --no-cache-dir torch', d: 'd4' },
    /* ------------------------------- 符号 ------------------------------- */
    { t: '~', g: 'op', m: '波浪号 = 你的主目录（沙盒里就是 /home/student）', eg: 'cd ~/work', d: 'd1' },
    { t: '/', g: 'op', m: '路径分隔符；写在最前面表示"从根目录开始"（绝对路径）', eg: 'cd /home/student/work', d: 'd1' },
    { t: '.', g: 'op', m: '当前目录（cp ./a ./b 里的 . 就是这个意思）', eg: 'ls .', d: 'd1' },
    { t: '..', g: 'op', m: '上一级目录（cd .. 就是往回退一层）', eg: 'cd ..', d: 'd1' },
    { t: '>', g: 'op', m: '重定向标准输出到文件；文件已存在会被整段覆盖', eg: 'echo hi > a.txt', d: 'd1', warn: '想追加要用 >>，用 > 会把原内容清空' },
    { t: '>>', g: 'op', m: '追加重定向：写到文件末尾，不覆盖原内容', eg: 'echo hi >> a.txt', d: 'd1' },
    { t: '<', g: 'op', m: '把文件当标准输入喂给命令', eg: 'wc -l < data/train.csv', d: 'd3' },
    { t: '2>', g: 'op', m: '只重定向标准错误（把报错单独存一份）', eg: 'python t.py 2> err.log', d: 'd3' },
    { t: '2>&1', g: 'op', m: '把标准错误并到标准输出，一起被重定向（日志里最常写）', eg: 'python t.py > all.log 2>&1', d: 'd7' },
    { t: '|', g: 'op', m: '管道：把左边命令的输出，当成右边命令的输入', eg: 'ps aux | grep python', d: 'd3' },
    { t: '&&', g: 'op', m: '前面的命令成功了（退出码 0）才执行后面这条', eg: 'cd ~/work && ls', d: 'd1' },
    { t: '||', g: 'op', m: '前面的命令失败了才执行后面这条（兜底）', eg: 'cd ~/work || echo "进不去"', d: 'd3' },
    { t: ';', g: 'op', m: '不管前一条成不成功，都继续执行下一条', eg: 'pwd; ls', d: 'd1' },
    { t: '#', g: 'op', m: '注释：这行 # 后面的内容不执行（写给人看的）', eg: '# 这里是注释', d: 'd1', warn: '在引号里的 # 不算注释，就是普通字符' },
    { t: '*', g: 'op', m: '通配符：匹配任意多个字符（*.csv = 所有 csv）', eg: 'ls data/*.csv', d: 'd3' },
    { t: '?', g: 'op', m: '通配符：只匹配一个字符（a?.txt 命中 a1.txt）', eg: 'ls a?.txt', d: 'd3' },
    { t: '$', g: 'op', m: '取变量的值（$HOME、$USER）；也用在 awk 的 $1 $2 里取列', eg: 'echo $HOME', d: 'd4' },
    { t: '${}', g: 'op', m: '变量的完整写法，边界更清楚（${HOME}/work）', eg: 'echo ${HOME}/work', d: 'd4' },
    { t: '$(...)', g: 'op', m: '命令替换：先跑括号里的命令，把结果填进来', eg: 'echo "今天是 $(date +%F)"', d: 'd7' },
    { t: '"', g: 'op', m: '双引号：把带空格的一串当成一个整体，里面的 $变量 仍会展开', eg: 'echo "hello world"', d: 'd1' },
    { t: "'", g: 'op', m: '单引号：里面所有字符都原样保留，连 $变量 也不展开', eg: "echo '$HOME'", d: 'd1' },
    { t: '\\', g: 'op', m: '转义：让后面那个特殊字符失去特殊含义；行尾的 \\ 表示"下一行接着写"', eg: 'echo "a\\nb"', d: 'd1' },
    { t: '`', g: 'op', m: '反引号：老式命令替换，效果同 $(...)；在本应用里还用来开关终端', eg: 'echo `date`', d: 'd1' },
    { t: '&', g: 'op', m: '放到命令末尾 = 丢到后台跑，终端立刻还给你', eg: 'python train.py &', d: 'd7' },
    { t: '{}', g: 'op', m: '花括号：批量展开（a{1,2}.txt）或占位符', eg: 'touch a{1,2}.txt', d: 'd3' },
    { t: '--', g: 'op', m: '长参数都从两个减号开始（--help）；也用来表示"后面全是文件名"', eg: 'rm -- -weird.txt', d: 'd1' },
    { t: '=', g: 'op', m: '赋值（VAR=1）或指定版本（python=3.10）；等号两边不能有空格', eg: 'export MODE=train', d: 'd4' },
    { t: 'PATH', g: 'op', m: '环境变量里的一份"命令搜索目录清单"，输入命令时按它找程序', eg: 'echo $PATH', d: 'd4' },

    /* ------------------------------- 概念 ------------------------------- */
    { t: '绝对路径', g: 'concept', m: '从 / 写起的完整地址，在哪执行都指向同一个地方', eg: '/home/student/work/exp1', d: 'd1' },
    { t: '相对路径', g: 'concept', m: '从"我现在在哪"算起的地址，换个目录执行就指向别处了', eg: 'data/train.csv', d: 'd1' },
    { t: '主目录', g: 'concept', m: '登录后默认待的目录，用 ~ 表示（沙盒里 /home/student）', eg: 'cd ~', d: 'd1' },
    { t: '标准输出', g: 'concept', m: 'stdout：命令的"正常结果"，默认打到屏幕，可以被 > 改道', eg: 'ls > list.txt', d: 'd1' },
    { t: '标准错误', g: 'concept', m: 'stderr：报错走的另一个通道，和标准输出分开（所以 2> 才能单独抓）', eg: 'python a.py 2> err.log', d: 'd3' },
    { t: '退出码', g: 'concept', m: 'exit code：0 = 成功，非 0 = 失败；$? 能看上一次的', eg: 'echo $?', d: 'd3' },
    { t: '隐藏文件', g: 'concept', m: '以 . 开头的文件（如 .gitignore），ls 默认看不见，要 -a', eg: 'ls -a', d: 'd5' },
    { t: '权限', g: 'concept', m: 'rwx 三段 = 属主/属组/其他人；755 = 7(rwx)5(r-x)5(r-x)', eg: 'chmod 755 run.sh', d: 'd2' },
    { t: '软链接', g: 'concept', m: '指向另一个路径的"快捷方式"，源文件删了它就成了死链接', eg: 'ln -s /data/big big', d: 'd3' },
    { t: '进程', g: 'concept', m: '正在运行的程序实例，每个有唯一 PID', eg: 'ps aux', d: 'd7' },
    { t: '前台/后台', g: 'concept', m: '前台占着终端要等它结束；末尾加 & 丢后台，Ctrl+C 只影响前台', eg: 'python t.py &', d: 'd7' },
    { t: '环境变量', g: 'concept', m: '给程序看的配置（PATH/HOME/CUDA_VISIBLE_DEVICES），子进程能继承', eg: 'export MODE=train', d: 'd6' },
    { t: '虚拟环境', g: 'concept', m: '一套独立的 Python + 依赖，项目之间互不污染', eg: 'conda activate ai7', d: 'd4' },
    { t: '可复现', g: 'concept', m: '换机器 / 隔半年，照着清单还能装出一样的环境、跑出一样的结果', eg: 'pip freeze > lock.txt', d: 'd4' },
    { t: '依赖冲突', g: 'concept', m: '两个包要求同一个包的版本不一样，装谁都不对；解法是分环境', eg: 'pip install "numpy<2"', d: 'd4' },
    { t: '缓存', g: 'concept', m: '装过的包会存本地，下次装得快；但缓存坏了会装出怪问题', eg: 'pip cache purge', d: 'd4' },
    { t: '日志', g: 'concept', m: '程序运行时写给"未来的你"看的记录，出问题第一现场', eg: 'tail -f logs/train.log', d: 'd3' },
    { t: '端口', g: 'concept', m: '一台机器上区分不同服务的编号（Web 常 7860/8000/8080）', eg: 'curl 127.0.0.1:7860', d: 'd7' },
    { t: '显存', g: 'concept', m: 'GPU 自己的内存（VRAM）；模型和 batch 越大越吃显存', eg: 'nvidia-smi', d: 'd6' },
    { t: 'OOM', g: 'concept', m: 'Out Of Memory：显存/内存不够，先降 batch、清缓存、查僵尸进程', eg: 'nvidia-smi', d: 'd7' },
    /* ------------------------------ AI 工具链 ------------------------------ */
    { t: 'conda', g: 'ai', m: '环境 + 包管理器，数据/算法工程里最常用的环境工具', eg: 'conda --version', d: 'd4' },
    { t: 'conda create', g: 'ai', m: '新建一个隔离环境，-n 起名、python=3.10 指定解释器版本', eg: 'conda create -n ai7 python=3.10 -y', d: 'd4' },
    { t: 'conda activate', g: 'ai', m: '进入某个环境；成功以后提示符前面会多出 (ai7)', eg: 'conda activate ai7', d: 'd4', warn: '没激活就 pip install，包会装到 base 里，白忙一场' },
    { t: 'conda deactivate', g: 'ai', m: '退出当前环境，回到 base', eg: 'conda deactivate', d: 'd4' },
    { t: 'conda env list', g: 'ai', m: '列出所有环境，带 * 的是当前激活的', eg: 'conda env list', d: 'd4' },
    { t: 'conda list', g: 'ai', m: '列出当前环境里装了哪些包和版本', eg: 'conda list | grep torch', d: 'd4' },
    { t: 'conda install', g: 'ai', m: '用 conda 装包（能装非 Python 的依赖，如 cudatoolkit）', eg: 'conda install numpy -y', d: 'd4' },
    { t: 'conda env export', g: 'ai', m: '把当前环境导出成 environment.yml，别人能照着复现', eg: 'conda env export > environment.yml', d: 'd4' },
    { t: 'pip', g: 'ai', m: 'Python 官方包管理器，装 PyPI 上的库', eg: 'pip --version', d: 'd4' },
    { t: 'pip install', g: 'ai', m: '装包；不带版本号 = 装最新，线上项目一定要锁版本', eg: 'pip install torch==2.4.1', d: 'd4' },
    { t: 'pip install -r', g: 'ai', m: '按 requirements.txt 一次装齐所有依赖', eg: 'pip install -r requirements.txt', d: 'd4' },
    { t: 'pip freeze', g: 'ai', m: '把当前环境里所有包 + 精确版本打出来，用于锁版本', eg: 'pip freeze > requirements.lock.txt', d: 'd4' },
    { t: 'pip list', g: 'ai', m: '看装了什么（比 freeze 好看）', eg: 'pip list', d: 'd4' },
    { t: 'pip show', g: 'ai', m: '看某个包的版本、依赖、安装位置', eg: 'pip show torch', d: 'd4' },
    { t: 'pip cache purge', g: 'ai', m: '清空 pip 下载缓存，解决"怎么装都是旧版本"的怪问题', eg: 'pip cache purge', d: 'd4' },
    { t: 'python', g: 'ai', m: 'Python 解释器；-V 看版本、-c 直接执行一行代码', eg: 'python -V', d: 'd1' },
    { t: 'python3', g: 'ai', m: '有的系统 python 指 2.x，所以习惯写 python3', eg: 'python3 --version', d: 'd4' },
    { t: 'nvidia-smi', g: 'ai', m: '看 GPU 型号、显存占用、正在用卡的进程', eg: 'nvidia-smi', d: 'd6' },
    { t: 'requirements.txt', g: 'ai', m: '项目的依赖清单，一行一个包（可带版本）', eg: 'torch==2.4.1', d: 'd1' },
    { t: 'environment.yml', g: 'ai', m: 'conda 的环境描述文件，能连 Python 版本一起复现', eg: 'conda env create -f environment.yml', d: 'd4' },
    { t: 'hf', g: 'ai', m: 'Hugging Face 命令行：下载模型 / 数据集', eg: 'hf download bert-base-chinese', d: 'd6' },
    { t: 'jupyter', g: 'ai', m: '交互式笔记本，边写边看结果；lab 是它的新版界面', eg: 'jupyter lab', d: 'd7' },
    { t: 'torch', g: 'ai', m: 'PyTorch 深度学习框架（不是命令，是包名）', eg: 'pip install torch==2.4.1', d: 'd4' },

    /* ------------------------------- 报错 ------------------------------- */
    { t: 'command not found', g: 'err', m: '找不到这个命令：拼错了、没装、或者不在 PATH 里', eg: 'tree -L 2  →  tree: command not found', d: 'd1', warn: '先 which 命令 看有没有，再决定装还是改路径' },
    { t: 'No such file or directory', g: 'err', m: '路径写错了或文件不存在（相对路径 + 当前目录不对最常见）', eg: 'cat data/trian.csv', d: 'd1' },
    { t: 'Permission denied', g: 'err', m: '没权限：文件不可执行、不可写，或需要 sudo/改权限', eg: 'chmod 755 run.sh', d: 'd2' },
    { t: 'Is a directory', g: 'err', m: '把目录当文件用了（比如 cat 一个目录）', eg: 'cat data/', d: 'd1' },
    { t: 'ModuleNotFoundError', g: 'err', m: 'Python 找不到这个包：环境没激活 / 没装 / 装到了别的环境', eg: 'python -c "import torch"', d: 'd4' },
    { t: 'CUDA out of memory', g: 'err', m: '显存不够：降 batch、清僵尸进程、关掉占卡的兄弟任务', eg: 'nvidia-smi', d: 'd7' },
    { t: 'fatal: not a git repository', g: 'err', m: '当前目录（或上层）没有 .git，先 git init 或 cd 到仓库里', eg: 'git status', d: 'd5' },
    { t: 'Address already in use', g: 'err', m: '端口被占了：换端口或把占用进程杀掉', eg: 'curl 127.0.0.1:7860', d: 'd7' },
    { t: 'No space left on device', g: 'err', m: '磁盘满了：清缓存/删旧模型，用 df -h 和 du -sh 找元凶', eg: 'df -h', d: 'd3' },
    { t: 'CondaError: environment not found', g: 'err', m: '环境名写错或还没建：conda env list 确认名字', eg: 'conda env list', d: 'd4' },
  ];

  var INDEX = {};
  ITEMS.forEach(function (it) {
    INDEX[String(it.t).toLowerCase()] = it;
    (it.alias || []).forEach(function (a) { INDEX[String(a).toLowerCase()] = it; });
  });

  function norm(q) {
    var s = String(q == null ? '' : q).trim();
    /* 只去掉"包起来"的引号；单独一个引号（词典里有 " 和 ' 词条）要保留 */
    if (s.length > 2) s = s.replace(/^[`'"]+|[`'"]+$/g, '');
    return s.toLowerCase();
  }

  var Glossary = {
    groups: GROUPS,
    items: ITEMS,

    /** 词条总数（检查脚本会断言 >= 120） */
    count: function () { return ITEMS.length; },

    /**
     * 按词取词条。会逐级退化：
     *   'tree -L 2' → 'tree'；'~/work/x' → '~'；'-la' → '-la' → '-l'；'python=3.10' → 'python'
     */
    get: function (term) {
      var key = norm(term);
      if (!key) return null;
      if (INDEX[key]) return INDEX[key];

      var first = key.split(/\s+/)[0];
      if (INDEX[first]) return INDEX[first];

      if (key.charAt(0) === '~' && INDEX['~']) return INDEX['~'];
      if (key.indexOf('2>&') === 0 && INDEX['2>&1']) return INDEX['2>&1'];
      if (key.indexOf('=') > 0) {
        var bare = key.split('=')[0];
        if (INDEX[bare]) return INDEX[bare];
      }
      if (key.charAt(0) === '-') {
        /* -la → -l；-rf → -r；--no-cache-dir → --help 那类整体找不到就不猜了 */
        for (var i = key.length; i >= 2; i--) {
          var cut = key.slice(0, i);
          if (INDEX[cut]) return INDEX[cut];
        }
      }
      return null;
    },

    /** 模糊搜索：词、含义、例子、别名里出现就算命中 */
    search: function (q) {
      var key = norm(q);
      if (!key) return ITEMS.slice();
      return ITEMS.filter(function (it) {
        var hay = [it.t, it.m, it.eg, it.read, it.warn].concat(it.alias || []).join(' ').toLowerCase();
        return hay.indexOf(key) >= 0;
      });
    },

    byGroup: function (g) {
      return ITEMS.filter(function (it) { return it.g === g; });
    },

    groupName: function (g) {
      var hit = GROUPS.filter(function (x) { return x.id === g; })[0];
      return hit ? hit.name : g;
    }
  };

  LX.Glossary = Glossary;
})(window);
