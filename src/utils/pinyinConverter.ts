// 常用汉字拼音映射表（覆盖约1000个常用字）
const pinyinMap: Record<string, string> = {
  // 数字
  '一': 'yi', '二': 'er', '三': 'san', '四': 'si', '五': 'wu',
  '六': 'liu', '七': 'qi', '八': 'ba', '九': 'jiu', '十': 'shi',
  '百': 'bai', '千': 'qian', '万': 'wan', '零': 'ling',
  
  // 常用字A
  '阿': 'a', '啊': 'a', '哎': 'ai', '爱': 'ai', '安': 'an',
  '按': 'an', '暗': 'an', '岸': 'an', '案': 'an',
  
  // 常用字B
  '八': 'ba', '吧': 'ba', '巴': 'ba', '把': 'ba', '爸': 'ba',
  '白': 'bai', '百': 'bai', '拜': 'bai', '班': 'ban', '般': 'ban',
  '板': 'ban', '版': 'ban', '半': 'ban', '办': 'ban', '帮': 'bang',
  '包': 'bao', '宝': 'bao', '报': 'bao', '抱': 'bao', '保': 'bao',
  '杯': 'bei', '北': 'bei', '被': 'bei', '备': 'bei', '背': 'bei',
  '本': 'ben', '比': 'bi', '笔': 'bi', '必': 'bi', '毕': 'bi',
  '闭': 'bi', '边': 'bian', '变': 'bian', '便': 'bian', '表': 'biao',
  '别': 'bie', '并': 'bing', '病': 'bing', '不': 'bu', '步': 'bu',
  '部': 'bu', '布': 'bu',
  
  // 常用字C
  '才': 'cai', '材': 'cai', '菜': 'cai', '参': 'can', '餐': 'can',
  '草': 'cao', '层': 'ceng', '茶': 'cha', '查': 'cha', '差': 'cha',
  '长': 'chang', '常': 'chang', '场': 'chang', '厂': 'chang', '唱': 'chang',
  '超': 'chao', '朝': 'chao', '车': 'che', '成': 'cheng', '城': 'cheng',
  '程': 'cheng', '吃': 'chi', '持': 'chi', '出': 'chu', '初': 'chu',
  '除': 'chu', '处': 'chu', '川': 'chuan', '传': 'chuan', '船': 'chuan',
  '窗': 'chuang', '床': 'chuang', '春': 'chun', '词': 'ci', '次': 'ci',
  '从': 'cong', '村': 'cun', '错': 'cuo',
  
  // 常用字D
  '大': 'da', '打': 'da', '带': 'dai', '待': 'dai', '代': 'dai',
  '单': 'dan', '但': 'dan', '蛋': 'dan', '当': 'dang', '党': 'dang',
  '到': 'dao', '道': 'dao', '的': 'de', '得': 'de', '地': 'di',
  '第': 'di', '点': 'dian', '店': 'dian', '电': 'dian', '定': 'ding',
  '东': 'dong', '冬': 'dong', '动': 'dong', '懂': 'dong', '都': 'dou',
  '读': 'du', '度': 'du', '短': 'duan', '段': 'duan', '对': 'dui',
  '多': 'duo', '朵': 'duo',
  
  // 常用字E
  '儿': 'er', '而': 'er', '二': 'er', '耳': 'er',
  
  // 常用字F
  '发': 'fa', '法': 'fa', '反': 'fan', '饭': 'fan', '范': 'fan',
  '方': 'fang', '房': 'fang', '放': 'fang', '飞': 'fei', '非': 'fei',
  '分': 'fen', '份': 'fen', '风': 'feng', '服': 'fu', '父': 'fu',
  '付': 'fu', '妇': 'fu', '富': 'fu', '福': 'fu',
  
  // 常用字G
  '该': 'gai', '改': 'gai', '干': 'gan', '感': 'gan', '敢': 'gan',
  '刚': 'gang', '钢': 'gang', '高': 'gao', '告': 'gao', '哥': 'ge',
  '个': 'ge', '各': 'ge', '给': 'gei', '根': 'gen', '跟': 'gen',
  '更': 'geng', '工': 'gong', '公': 'gong', '共': 'gong', '狗': 'gou',
  '够': 'gou', '古': 'gu', '故': 'gu', '瓜': 'gua', '刮': 'gua',
  '关': 'guan', '观': 'guan', '馆': 'guan', '管': 'guan', '光': 'guang',
  '广': 'guang', '逛': 'guang', '规': 'gui', '贵': 'gui', '国': 'guo',
  '果': 'guo', '过': 'guo',
  
  // 常用字H
  '还': 'hai', '海': 'hai', '孩': 'hai', '害': 'hai', '汉': 'han',
  '好': 'hao', '号': 'hao', '喝': 'he', '和': 'he', '河': 'he',
  '黑': 'hei', '很': 'hen', '红': 'hong', '后': 'hou', '厚': 'hou',
  '候': 'hou', '花': 'hua', '华': 'hua', '画': 'hua', '话': 'hua',
  '化': 'hua', '欢': 'huan', '还': 'huan', '环': 'huan', '黄': 'huang',
  '回': 'hui', '会': 'hui', '活': 'huo', '火': 'huo', '货': 'huo',
  
  // 常用字J
  '机': 'ji', '鸡': 'ji', '几': 'ji', '己': 'ji', '记': 'ji',
  '季': 'ji', '计': 'ji', '际': 'ji', '继': 'ji', '技': 'ji',
  '加': 'jia', '家': 'jia', '假': 'jia', '价': 'jia', '间': 'jian',
  '见': 'jian', '件': 'jian', '建': 'jian', '江': 'jiang', '将': 'jiang',
  '讲': 'jiang', '交': 'jiao', '教': 'jiao', '叫': 'jiao', '觉': 'jiao',
  '脚': 'jiao', '角': 'jiao', '接': 'jie', '节': 'jie', '结': 'jie',
  '姐': 'jie', '解': 'jie', '届': 'jie', '界': 'jie', '借': 'jie',
  '今': 'jin', '金': 'jin', '斤': 'jin', '进': 'jin', '近': 'jin',
  '尽': 'jin', '紧': 'jin', '京': 'jing', '经': 'jing', '精': 'jing',
  '景': 'jing', '静': 'jing', '九': 'jiu', '久': 'jiu', '旧': 'jiu',
  '就': 'jiu', '酒': 'jiu', '举': 'ju', '句': 'ju', '具': 'ju',
  '觉': 'jue', '决': 'jue', '绝': 'jue',
  
  // 常用字K
  '开': 'kai', '看': 'kan', '考': 'kao', '靠': 'kao', '科': 'ke',
  '可': 'ke', '课': 'ke', '客': 'ke', '刻': 'ke', '空': 'kong',
  '口': 'kou', '哭': 'ku', '苦': 'ku', '快': 'kuai', '块': 'kuai',
  
  // 常用字L
  '拉': 'la', '啦': 'la', '蜡': 'la', '来': 'lai', '老': 'lao',
  '了': 'le', '乐': 'le', '累': 'lei', '类': 'lei', '冷': 'leng',
  '离': 'li', '里': 'li', '理': 'li', '李': 'li', '立': 'li',
  '丽': 'li', '利': 'li', '历': 'li', '力': 'li', '例': 'li',
  '连': 'lian', '联': 'lian', '脸': 'lian', '练': 'lian', '两': 'liang',
  '亮': 'liang', '量': 'liang', '辆': 'liang', '了': 'liao', '料': 'liao',
  '列': 'lie', '林': 'lin', '邻': 'lin', '零': 'ling', '领': 'ling',
  '另': 'ling', '留': 'liu', '六': 'liu', '流': 'liu', '楼': 'lou',
  '路': 'lu', '绿': 'lv', '旅': 'lv', '律': 'lv', '论': 'lun',
  '落': 'luo',
  
  // 常用字M
  '妈': 'ma', '马': 'ma', '吗': 'ma', '麻': 'ma', '买': 'mai',
  '卖': 'mai', '满': 'man', '慢': 'man', '忙': 'mang', '猫': 'mao',
  '毛': 'mao', '么': 'me', '没': 'mei', '每': 'mei', '美': 'mei',
  '妹': 'mei', '门': 'men', '们': 'men', '梦': 'meng', '米': 'mi',
  '面': 'mian', '秒': 'miao', '民': 'min', '名': 'ming', '明': 'ming',
  '母': 'mu', '木': 'mu', '目': 'mu',
  
  // 常用字N
  '拿': 'na', '哪': 'na', '那': 'na', '奶': 'nai', '南': 'nan',
  '难': 'nan', '脑': 'nao', '呢': 'ne', '内': 'nei', '能': 'neng',
  '你': 'ni', '年': 'nian', '念': 'nian', '鸟': 'niao', '您': 'nin',
  '牛': 'niu', '女': 'nv', '暖': 'nuan',
  
  // 常用字O
  '哦': 'o', '欧': 'ou',
  
  // 常用字P
  '怕': 'pa', '拍': 'pai', '盘': 'pan', '旁': 'pang', '胖': 'pang',
  '跑': 'pao', '朋': 'peng', '碰': 'peng', '片': 'pian', '票': 'piao',
  '漂': 'piao', '平': 'ping', '苹': 'ping', '破': 'po', '铺': 'pu',
  
  // 常用字Q
  '七': 'qi', '其': 'qi', '期': 'qi', '妻': 'qi', '齐': 'qi',
  '起': 'qi', '气': 'qi', '汽': 'qi', '千': 'qian', '前': 'qian',
  '钱': 'qian', '墙': 'qiang', '强': 'qiang', '桥': 'qiao', '巧': 'qiao',
  '切': 'qie', '且': 'qie', '亲': 'qin', '轻': 'qing', '清': 'qing',
  '情': 'qing', '晴': 'qing', '请': 'qing', '庆': 'qing', '秋': 'qiu',
  '球': 'qiu', '求': 'qiu', '区': 'qu', '去': 'qu', '取': 'qu',
  '趣': 'qu', '全': 'quan', '缺': 'que', '却': 'que', '群': 'qun',
  
  // 常用字R
  '然': 'ran', '让': 'rang', '热': 're', '人': 'ren', '认': 'ren',
  '任': 'ren', '日': 'ri', '容': 'rong', '肉': 'rou', '如': 'ru',
  
  // 常用字S
  '三': 'san', '伞': 'san', '色': 'se', '山': 'shan', '商': 'shang',
  '上': 'shang', '少': 'shao', '绍': 'shao', '舌': 'she', '谁': 'shei',
  '身': 'shen', '深': 'shen', '什': 'shen', '神': 'shen', '生': 'sheng',
  '声': 'sheng', '省': 'sheng', '师': 'shi', '诗': 'shi', '十': 'shi',
  '时': 'shi', '食': 'shi', '识': 'shi', '实': 'shi', '史': 'shi',
  '使': 'shi', '始': 'shi', '是': 'shi', '事': 'shi', '市': 'shi',
  '室': 'shi', '视': 'shi', '试': 'shi', '收': 'shou', '手': 'shou',
  '首': 'shou', '受': 'shou', '书': 'shu', '树': 'shu', '数': 'shu',
  '双': 'shuang', '水': 'shui', '睡': 'shui', '说': 'shuo', '司': 'si',
  '四': 'si', '死': 'si', '送': 'song', '苏': 'su', '诉': 'su',
  '算': 'suan', '虽': 'sui', '岁': 'sui', '所': 'suo',
  
  // 常用字T
  '他': 'ta', '她': 'ta', '它': 'ta', '台': 'tai', '太': 'tai',
  '态': 'tai', '谈': 'tan', '弹': 'tan', '糖': 'tang', '汤': 'tang',
  '套': 'tao', '特': 'te', '疼': 'teng', '提': 'ti', '题': 'ti',
  '体': 'ti', '天': 'tian', '田': 'tian', '甜': 'tian', '条': 'tiao',
  '跳': 'tiao', '贴': 'tie', '铁': 'tie', '听': 'ting', '停': 'ting',
  '通': 'tong', '同': 'tong', '童': 'tong', '头': 'tou', '图': 'tu',
  '土': 'tu', '兔': 'tu', '团': 'tuan', '推': 'tui', '腿': 'tui',
  
  // 常用字W
  '外': 'wai', '完': 'wan', '玩': 'wan', '晚': 'wan', '万': 'wan',
  '王': 'wang', '网': 'wang', '往': 'wang', '忘': 'wang', '望': 'wang',
  '为': 'wei', '围': 'wei', '位': 'wei', '味': 'wei', '卫': 'wei',
  '温': 'wen', '文': 'wen', '闻': 'wen', '问': 'wen', '我': 'wo',
  '午': 'wu', '五': 'wu', '无': 'wu', '物': 'wu', '舞': 'wu',
  
  // 常用字X
  '西': 'xi', '希': 'xi', '习': 'xi', '洗': 'xi', '喜': 'xi',
  '系': 'xi', '细': 'xi', '夏': 'xia', '下': 'xia', '先': 'xian',
  '现': 'xian', '线': 'xian', '县': 'xian', '乡': 'xiang', '香': 'xiang',
  '想': 'xiang', '向': 'xiang', '象': 'xiang', '像': 'xiang', '小': 'xiao',
  '笑': 'xiao', '校': 'xiao', '些': 'xie', '鞋': 'xie', '写': 'xie',
  '谢': 'xie', '心': 'xin', '新': 'xin', '信': 'xin', '星': 'xing',
  '行': 'xing', '姓': 'xing', '兴': 'xing', '熊': 'xiong', '休': 'xiu',
  '须': 'xu', '需': 'xu', '许': 'xu', '选': 'xuan', '学': 'xue',
  '雪': 'xue',
  
  // 常用字Y
  '呀': 'ya', '牙': 'ya', '盐': 'yan', '眼': 'yan', '颜': 'yan',
  '阳': 'yang', '羊': 'yang', '养': 'yang', '样': 'yang', '要': 'yao',
  '药': 'yao', '爷': 'ye', '也': 'ye', '夜': 'ye', '叶': 'ye',
  '页': 'ye', '一': 'yi', '医': 'yi', '衣': 'yi', '已': 'yi',
  '以': 'yi', '意': 'yi', '易': 'yi', '艺': 'yi', '因': 'yin',
  '音': 'yin', '银': 'yin', '引': 'yin', '饮': 'yin', '应': 'ying',
  '英': 'ying', '影': 'ying', '用': 'yong', '永': 'yong', '由': 'you',
  '游': 'you', '友': 'you', '有': 'you', '又': 'you', '右': 'you',
  '鱼': 'yu', '雨': 'yu', '语': 'yu', '与': 'yu', '育': 'yu',
  '遇': 'yu', '元': 'yuan', '员': 'yuan', '园': 'yuan', '远': 'yuan',
  '院': 'yuan', '愿': 'yuan', '月': 'yue', '乐': 'yue', '约': 'yue',
  '云': 'yun', '运': 'yun',
  
  // 常用字Z
  '在': 'zai', '再': 'zai', '早': 'zao', '造': 'zao', '怎': 'zen',
  '增': 'zeng', '站': 'zhan', '张': 'zhang', '长': 'zhang', '找': 'zhao',
  '着': 'zhao', '照': 'zhao', '者': 'zhe', '这': 'zhe', '着': 'zhe',
  '真': 'zhen', '正': 'zheng', '整': 'zheng', '证': 'zheng', '之': 'zhi',
  '只': 'zhi', '知': 'zhi', '直': 'zhi', '纸': 'zhi', '指': 'zhi',
  '至': 'zhi', '治': 'zhi', '中': 'zhong', '种': 'zhong', '重': 'zhong',
  '周': 'zhou', '州': 'zhou', '主': 'zhu', '住': 'zhu', '注': 'zhu',
  '祝': 'zhu', '助': 'zhu', '著': 'zhu', '专': 'zhuan', '转': 'zhuan',
  '装': 'zhuang', '准': 'zhun', '桌': 'zhuo', '子': 'zi', '字': 'zi',
  '自': 'zi', '紫': 'zi', '总': 'zong', '走': 'zou', '租': 'zu',
  '足': 'zu', '族': 'zu', '组': 'zu', '最': 'zui', '嘴': 'zui',
  '昨': 'zuo', '左': 'zuo', '作': 'zuo', '做': 'zuo', '座': 'zuo',
  
  // 特殊字符
  '烛': 'zhu', '贴': 'tie', '纸': 'zhi', '卡': 'ka', '片': 'pian',
  '书': 'shu', '签': 'qian', '笔': 'bi', '记': 'ji', '本': 'ben',
};

/**
 * 将中文字符串转换为拼音
 * @param text 中文文本
 * @returns 拼音字符串（首字母大写）
 */
export function chineseToPinyin(text: string): string {
  if (!text) return '';
  
  let result = '';
  let wordBuffer = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // 如果是中文字符，尝试转换
    if (/[\u4e00-\u9fa5]/.test(char)) {
      const pinyin = pinyinMap[char];
      if (pinyin) {
        // 如果有有效的拼音，首字母大写后追加
        if (wordBuffer) {
          result += wordBuffer.charAt(0).toUpperCase() + wordBuffer.slice(1);
          wordBuffer = '';
        }
        wordBuffer = pinyin;
      } else {
        // 如果没有找到拼音映射，使用原字符
        wordBuffer += char;
      }
    } else if (/[a-zA-Z0-9]/.test(char)) {
      // 保留字母和数字
      wordBuffer += char.toLowerCase();
    } else if (char === ' ' || char === '-' || char === '_') {
      // 遇到分隔符，将当前词缓冲区的内容添加到结果
      if (wordBuffer) {
        result += wordBuffer.charAt(0).toUpperCase() + wordBuffer.slice(1);
        wordBuffer = '';
      }
      // 空格转换为驼峰命名，- 和 _ 保留
      if (char !== ' ') {
        result += char;
      }
    }
    // 其他字符忽略
  }
  
  // 处理最后的词缓冲区
  if (wordBuffer) {
    result += wordBuffer.charAt(0).toUpperCase() + wordBuffer.slice(1);
  }
  
  return result || 'Title';
}

/**
 * 检测文本是否包含中文字符
 * @param text 文本
 * @returns 是否包含中文
 */
export function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

