(() => {
'use strict';

const STORAGE_KEY = 'magnit-dp-preferences-v2026';
const LEGACY_KEYS = ['magnit-dp-workspace-v26','magnit-dp-manual-v21','magnit-dp-manual-v20','magnit-dp-manual-v19','magnit-dp-manual-v18','magnit-dp-manual-v17'];
const FONTS = {
  system: 'Inter, "Segoe UI Variable", "Segoe UI", Roboto, Arial, sans-serif',
  segoe: '"Segoe UI Variable", "Segoe UI", Arial, sans-serif',
  arial: 'Arial, Helvetica, sans-serif',
  humanist: '"Trebuchet MS", "Segoe UI", Arial, sans-serif'
};
const PRESETS = {"executive-milk":{"name":"Магнит · официальный","short":"Официальный","description":"Полностью отдельный современный интерфейс Магнита: светлая служебная навигация, строгая типографика, высокая читаемость и никакого свечения.","tokens":{"fontFamily":"segoe","fontScale":1,"fontWeight":"strong","radius":10,"density":"compact","success":"#16784B","warning":"#976000","danger":"#B32631","mode":"light","brand":"#E30613","accent":"#171719","page":"#F4F2EE","surface":"#FFFFFF","surfaceAlt":"#F7F5F1","text":"#202124","textMuted":"#66686D","border":"#DDD9D2","sidebar":"#FBF9F5","sidebarPanel":"#FFFFFF","sidebarText":"#202124","topbar":"#FFFFFF","authBackground":"#F4F2EE","authPanel":"#FFFFFF"}},"magnit-warm":{"name":"Магнит · тёплая светлая","short":"Тёплая","description":"Фирменная бежевая основа без резких белых блоков.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":15,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#e30820","accent":"#7e1930","page":"#e4d8c8","surface":"#fbf3e8","surfaceAlt":"#f1e5d6","text":"#1b1713","textMuted":"#5d534a","border":"#cdbba5","sidebar":"#171518","sidebarPanel":"#211d21","sidebarText":"#f7f1ee","topbar":"#fbf3e8","authBackground":"#111013","authPanel":"#191619"}},"magnit-dark":{"name":"Магнит · тёмная","short":"Тёмная","description":"Спокойная графитовая тема с фирменным красным.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":15,"density":"comfortable","success":"#48bd7b","warning":"#e6b64b","danger":"#ff655b","mode":"dark","brand":"#f02e43","accent":"#bd4963","page":"#111013","surface":"#19171a","surfaceAlt":"#211e22","text":"#f4f1f1","textMuted":"#aaa3a6","border":"#4a4247","sidebar":"#0e0d0f","sidebarPanel":"#191619","sidebarText":"#f7f1f3","topbar":"#19171a","authBackground":"#0d0c0e","authPanel":"#171417"}},"neutral":{"name":"Нейтральная","short":"Нейтральная","description":"Чистая серая палитра для длительной работы.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"comfortable","radius":13,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#3d4754","accent":"#687586","page":"#edf0f3","surface":"#ffffff","surfaceAlt":"#f5f7f9","text":"#171b20","textMuted":"#616a75","border":"#cfd5dc","sidebar":"#20252b","sidebarPanel":"#2a3037","sidebarText":"#f6f8fa","topbar":"#ffffff","authBackground":"#171b20","authPanel":"#22272e"}},"contrast":{"name":"Высокий контраст","short":"Контраст","description":"Максимальная читаемость текста, границ и статусов.","tokens":{"fontFamily":"segoe","fontScale":1.06,"fontWeight":"strong","radius":8,"density":"spacious","success":"#45e08a","warning":"#ffd400","danger":"#ff5e57","mode":"dark","brand":"#ff3b4f","accent":"#ffd400","page":"#000000","surface":"#0b0b0b","surfaceAlt":"#171717","text":"#ffffff","textMuted":"#d3d3d3","border":"#f2f2f2","sidebar":"#000000","sidebarPanel":"#111111","sidebarText":"#ffffff","topbar":"#050505","authBackground":"#000000","authPanel":"#101010"}},"pink":{"name":"Розовая","short":"Розовая","description":"Мягкий розовый акцент на спокойной светлой базе.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":17,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#d63384","accent":"#8d3f6a","page":"#f5e8ef","surface":"#fff9fc","surfaceAlt":"#f8edf3","text":"#261820","textMuted":"#715867","border":"#d9becd","sidebar":"#34212d","sidebarPanel":"#442b3a","sidebarText":"#fff6fb","topbar":"#fff9fc","authBackground":"#24171f","authPanel":"#34212d"}},"blue":{"name":"Синяя","short":"Синяя","description":"Холодная деловая палитра для строгого интерфейса.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":14,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#1769d2","accent":"#304f88","page":"#e8eef6","surface":"#fbfdff","surfaceAlt":"#eef4fa","text":"#142033","textMuted":"#56677f","border":"#bdcbe0","sidebar":"#14243b","sidebarPanel":"#1d3150","sidebarText":"#f4f8ff","topbar":"#fbfdff","authBackground":"#101b2c","authPanel":"#172943"}},"green":{"name":"Зелёная","short":"Зелёная","description":"Спокойная природная тема с уверенным зелёным акцентом.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":15,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#17845a","accent":"#315f50","page":"#e7f0eb","surface":"#fbfefc","surfaceAlt":"#edf6f1","text":"#14241d","textMuted":"#566d62","border":"#bdd1c7","sidebar":"#142c23","sidebarPanel":"#1d3b30","sidebarText":"#f2fff8","topbar":"#fbfefc","authBackground":"#10221b","authPanel":"#173128"}},"red":{"name":"Красная","short":"Красная","description":"Контрастная красно-графитовая тема без лишней пестроты.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"strong","radius":13,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#c81e2b","accent":"#702631","page":"#f0e9e9","surface":"#fffafa","surfaceAlt":"#f6eeee","text":"#251719","textMuted":"#72585c","border":"#d5bfc2","sidebar":"#2d171b","sidebarPanel":"#3c2025","sidebarText":"#fff7f8","topbar":"#fffafa","authBackground":"#211114","authPanel":"#30191e"}},"yellow":{"name":"Жёлтая","short":"Жёлтая","description":"Тёплая тема с золотистым акцентом и тёмным текстом.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":15,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#d89b00","accent":"#795d16","page":"#f2ead4","surface":"#fffdf5","surfaceAlt":"#f7f0dc","text":"#241f12","textMuted":"#6c6247","border":"#d6c79c","sidebar":"#302a1a","sidebarPanel":"#403824","sidebarText":"#fffbea","topbar":"#fffdf5","authBackground":"#242015","authPanel":"#332d1c"}},"purple":{"name":"Фиолетовая","short":"Фиолетовая","description":"Глубокий фиолетовый акцент на нейтральной основе.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":17,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#7451c8","accent":"#51377e","page":"#eeeaf6","surface":"#fdfbff","surfaceAlt":"#f3eff9","text":"#20172e","textMuted":"#655978","border":"#cbbfdb","sidebar":"#261c38","sidebarPanel":"#34264c","sidebarText":"#fbf7ff","topbar":"#fdfbff","authBackground":"#1c1529","authPanel":"#291e3d"}},"orange":{"name":"Оранжевая","short":"Оранжевая","description":"Энергичный акцент с тёплыми спокойными поверхностями.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":14,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#df6c16","accent":"#86451c","page":"#f2e8df","surface":"#fffaf6","surfaceAlt":"#f8eee6","text":"#2a1b13","textMuted":"#735b4c","border":"#d7c1b1","sidebar":"#332117","sidebarPanel":"#442c1f","sidebarText":"#fff8f3","topbar":"#fffaf6","authBackground":"#271911","authPanel":"#392319"}},"teal":{"name":"Бирюзовая","short":"Бирюзовая","description":"Технологичная бирюзовая тема с прохладными поверхностями.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":15,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#07838b","accent":"#315f68","page":"#e5eff0","surface":"#faffff","surfaceAlt":"#edf6f6","text":"#132426","textMuted":"#536b6d","border":"#b9d0d1","sidebar":"#142c2f","sidebarPanel":"#1d3b3f","sidebarText":"#f2feff","topbar":"#faffff","authBackground":"#102225","authPanel":"#173136"}},"ocean-dark":{"name":"Океан · тёмная","short":"Океан","description":"Глубокая сине-бирюзовая тема для вечерней работы.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":16,"density":"comfortable","success":"#49c984","warning":"#efbd55","danger":"#ff6b68","mode":"dark","brand":"#19b7c6","accent":"#4a72d8","page":"#07151b","surface":"#0d2028","surfaceAlt":"#132b35","text":"#f1fbfd","textMuted":"#a9c3c9","border":"#33515a","sidebar":"#071216","sidebarPanel":"#0d2027","sidebarText":"#f0fbfd","topbar":"#0b1c23","authBackground":"#061116","authPanel":"#0d2028"}},"navy-dark":{"name":"Тёмно-синяя","short":"Тёмно-синяя","description":"Строгая тёмно-синяя основа с ярким голубым акцентом.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":14,"density":"comfortable","success":"#49c984","warning":"#efbd55","danger":"#ff6b68","mode":"dark","brand":"#4f9dff","accent":"#7f72e8","page":"#08111f","surface":"#101c2e","surfaceAlt":"#17263a","text":"#f5f8ff","textMuted":"#b6c2d5","border":"#3c4d67","sidebar":"#07101d","sidebarPanel":"#101b2d","sidebarText":"#f6f9ff","topbar":"#0d1828","authBackground":"#070e19","authPanel":"#101b2b"}},"forest-dark":{"name":"Лес · тёмная","short":"Тёмный лес","description":"Глубокая зелёная палитра с высокой читаемостью.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":16,"density":"comfortable","success":"#49c984","warning":"#efbd55","danger":"#ff6b68","mode":"dark","brand":"#39c981","accent":"#77a85c","page":"#08150f","surface":"#102219","surfaceAlt":"#183025","text":"#f3fbf6","textMuted":"#b1c8b9","border":"#3a5947","sidebar":"#07120d","sidebarPanel":"#102019","sidebarText":"#f3fbf6","topbar":"#0d1c14","authBackground":"#07110c","authPanel":"#102019"}},"burgundy-dark":{"name":"Бордо · тёмная","short":"Бордо","description":"Тёмная винная тема с мягкими розово-красными акцентами.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":17,"density":"comfortable","success":"#49c984","warning":"#efbd55","danger":"#ff6b68","mode":"dark","brand":"#ef607d","accent":"#b67ae8","page":"#180a10","surface":"#241019","surfaceAlt":"#311722","text":"#fff4f7","textMuted":"#d3adb7","border":"#68404b","sidebar":"#14080d","sidebarPanel":"#241018","sidebarText":"#fff5f8","topbar":"#210e16","authBackground":"#12070b","authPanel":"#231018"}},"graphite-cyan":{"name":"Графит и циан","short":"Графит","description":"Нейтральный графит с технологичным циановым акцентом.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"strong","radius":11,"density":"comfortable","success":"#49c984","warning":"#efbd55","danger":"#ff6b68","mode":"dark","brand":"#2fd4d0","accent":"#6f8cff","page":"#101316","surface":"#191d22","surfaceAlt":"#22282e","text":"#f6f8fa","textMuted":"#bac1c8","border":"#505961","sidebar":"#0c0f12","sidebarPanel":"#171b20","sidebarText":"#f6f8fa","topbar":"#15191e","authBackground":"#0a0c0f","authPanel":"#171b20"}},"lavender":{"name":"Лавандовая","short":"Лаванда","description":"Светлая прохладная тема с лавандовыми акцентами.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":18,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#765ad6","accent":"#a14d8f","page":"#eeeaf8","surface":"#fdfbff","surfaceAlt":"#f4f0fb","text":"#211932","textMuted":"#675d78","border":"#c9bedc","sidebar":"#251d37","sidebarPanel":"#332749","sidebarText":"#fbf8ff","topbar":"#fdfbff","authBackground":"#1d162a","authPanel":"#2a203d"}},"mint":{"name":"Мятная","short":"Мятная","description":"Лёгкая мятная палитра для длительной спокойной работы.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":16,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#168d72","accent":"#437c71","page":"#e5f1ed","surface":"#fbfffd","surfaceAlt":"#edf7f3","text":"#14241f","textMuted":"#536d64","border":"#bad3ca","sidebar":"#153027","sidebarPanel":"#1e4135","sidebarText":"#f3fff9","topbar":"#fbfffd","authBackground":"#10251e","authPanel":"#18362c"}},"ice":{"name":"Ледяная","short":"Ледяная","description":"Очень светлая сине-серая основа с чистыми контрастами.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":12,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#2478c8","accent":"#52739b","page":"#e8f1f8","surface":"#fcfeff","surfaceAlt":"#eff6fb","text":"#142331","textMuted":"#586d7e","border":"#bfd0dc","sidebar":"#152b3d","sidebarPanel":"#1e3a50","sidebarText":"#f4fbff","topbar":"#fcfeff","authBackground":"#102333","authPanel":"#193146"}},"sand":{"name":"Песочная","short":"Песочная","description":"Тёплая спокойная палитра без резких белых поверхностей.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":14,"density":"comfortable","success":"#18724a","warning":"#946300","danger":"#bd3038","mode":"light","brand":"#b56b22","accent":"#80633c","page":"#eee4d4","surface":"#fffaf1","surfaceAlt":"#f5ecde","text":"#281f15","textMuted":"#6f604e","border":"#d5c4a9","sidebar":"#30261b","sidebarPanel":"#413326","sidebarText":"#fff9ef","topbar":"#fffaf1","authBackground":"#241c13","authPanel":"#35291e"}},"coffee":{"name":"Кофейная","short":"Кофейная","description":"Тёплая тёмная тема с медными акцентами.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":15,"density":"comfortable","success":"#49c984","warning":"#efbd55","danger":"#ff6b68","mode":"dark","brand":"#d9904a","accent":"#b96b62","page":"#17110d","surface":"#231a14","surfaceAlt":"#30241c","text":"#fff8f1","textMuted":"#d0b8a5","border":"#665143","sidebar":"#130e0b","sidebarPanel":"#211812","sidebarText":"#fff8f1","topbar":"#211812","authBackground":"#100b08","authPanel":"#211812"}},"rainbow":{"name":"Радужная · сияние","short":"Радужная 🌈","description":"Мягкая переливающаяся тема с радужными градиентами, светлыми карточками и аккуратной читаемостью.","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":18,"density":"comfortable","success":"#168A63","warning":"#9B6500","danger":"#C83E63","mode":"light","brand":"#7C4DFF","accent":"#E744A7","page":"#F1F5FF","surface":"#FFFDFF","surfaceAlt":"#F5F1FF","text":"#24213D","textMuted":"#67647E","border":"#D9D3EE","sidebar":"#241947","sidebarPanel":"#35245F","sidebarText":"#FFF9FF","topbar":"#FFFDFF","authBackground":"#1C1237","authPanel":"#302052"}},"official-light":{"name":"Официальная · светлая","short":"Официальная","description":"Строгая корпоративная палитра: белые поверхности, тёмно-синяя навигация и сдержанный красный акцент.","tokens":{"fontFamily":"segoe","fontScale":1,"fontWeight":"strong","radius":8,"density":"compact","success":"#176b45","warning":"#8a5b00","danger":"#b4232d","mode":"light","brand":"#b51f2e","accent":"#334155","page":"#e9edf2","surface":"#ffffff","surfaceAlt":"#f3f5f7","text":"#172033","textMuted":"#536173","border":"#bcc5d0","sidebar":"#172033","sidebarPanel":"#222d42","sidebarText":"#f8fafc","topbar":"#ffffff","authBackground":"#111827","authPanel":"#1f2937"}},"official-dark":{"name":"Официальная · тёмная","short":"Офиц. тёмная","description":"Сдержанная графитово-синяя тема для рабочих помещений и длительных смен.","tokens":{"fontFamily":"segoe","fontScale":1,"fontWeight":"strong","radius":8,"density":"compact","success":"#4ac18a","warning":"#e1b451","danger":"#ff6b70","mode":"dark","brand":"#e04452","accent":"#8da2c0","page":"#0d1420","surface":"#151e2b","surfaceAlt":"#1d2837","text":"#f4f7fb","textMuted":"#b3bfce","border":"#465468","sidebar":"#090f18","sidebarPanel":"#141d2a","sidebarText":"#f6f8fb","topbar":"#121b28","authBackground":"#080d15","authPanel":"#131c29"}},"porcelain":{"name":"Фарфор · светлая","short":"Фарфор","description":"Чистая бело-голубая палитра с мягкими тенями и строгой читаемостью.","badge":"НОВАЯ","tokens":{"fontFamily":"segoe","fontScale":1,"fontWeight":"balanced","radius":16,"density":"comfortable","success":"#16784B","warning":"#946300","danger":"#B32631","mode":"light","brand":"#315FA8","accent":"#7C8FAF","page":"#EEF3F8","surface":"#FFFFFF","surfaceAlt":"#F5F8FB","text":"#172131","textMuted":"#5D6B7D","border":"#CAD5E1","sidebar":"#1D2B3C","sidebarPanel":"#283A50","sidebarText":"#F7FAFF","topbar":"#FFFFFF","authBackground":"#172334","authPanel":"#223247"}},"sage":{"name":"Шалфей · светлая","short":"Шалфей","description":"Спокойная зелёно-серая тема для длительной работы без визуального напряжения.","badge":"НОВАЯ","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":18,"density":"comfortable","success":"#247A55","warning":"#8B6508","danger":"#B63C43","mode":"light","brand":"#567A64","accent":"#8C6F59","page":"#EDF1EC","surface":"#FBFDFB","surfaceAlt":"#F2F6F1","text":"#1B261F","textMuted":"#617067","border":"#C8D2C9","sidebar":"#24322A","sidebarPanel":"#304139","sidebarText":"#F5FBF7","topbar":"#FBFDFB","authBackground":"#1C2821","authPanel":"#28372E"}},"peach":{"name":"Персик · светлая","short":"Персик","description":"Тёплая кремово-персиковая палитра с мягким акцентом и спокойными поверхностями.","badge":"НОВАЯ","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":19,"density":"comfortable","success":"#1D7750","warning":"#8C6100","danger":"#B83A45","mode":"light","brand":"#D66B4F","accent":"#8F5860","page":"#F6ECE6","surface":"#FFFCFA","surfaceAlt":"#FAF1EC","text":"#2B1C18","textMuted":"#735D55","border":"#DEC8BE","sidebar":"#3A2823","sidebarPanel":"#4A352E","sidebarText":"#FFF8F5","topbar":"#FFFCFA","authBackground":"#2D201C","authPanel":"#3D2A25"}},"sky":{"name":"Небо · светлая","short":"Небо","description":"Воздушная голубая тема с лёгкими поверхностями и ясной визуальной иерархией.","badge":"НОВАЯ","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"comfortable","radius":17,"density":"comfortable","success":"#18724A","warning":"#8C6400","danger":"#B72E3A","mode":"light","brand":"#2583C5","accent":"#586DA8","page":"#EAF4FA","surface":"#FCFEFF","surfaceAlt":"#F1F8FC","text":"#152433","textMuted":"#5A7082","border":"#C4D8E5","sidebar":"#173146","sidebarPanel":"#21435F","sidebarText":"#F4FBFF","topbar":"#FCFEFF","authBackground":"#11283A","authPanel":"#1B3A53"}},"platinum":{"name":"Платина · светлая","short":"Платина","description":"Минималистичная серо-белая тема с металлическим акцентом и компактной геометрией.","badge":"НОВАЯ","tokens":{"fontFamily":"segoe","fontScale":1,"fontWeight":"strong","radius":11,"density":"compact","success":"#16784B","warning":"#8A6200","danger":"#B32631","mode":"light","brand":"#4B5563","accent":"#8B95A3","page":"#ECEFF2","surface":"#FFFFFF","surfaceAlt":"#F5F6F8","text":"#1B1F24","textMuted":"#636B75","border":"#CDD2D8","sidebar":"#20252B","sidebarPanel":"#2B3138","sidebarText":"#F8FAFC","topbar":"#FFFFFF","authBackground":"#171B20","authPanel":"#242A31"}},"olive":{"name":"Олива · светлая","short":"Олива","description":"Тёплая природная палитра с оливковым акцентом и мягкой кремовой базой.","badge":"НОВАЯ","tokens":{"fontFamily":"humanist","fontScale":1,"fontWeight":"balanced","radius":18,"density":"comfortable","success":"#3F7A47","warning":"#8A6500","danger":"#B43A3F","mode":"light","brand":"#72833C","accent":"#8B6846","page":"#F1F0E5","surface":"#FEFDF8","surfaceAlt":"#F6F5EA","text":"#26281B","textMuted":"#6E705A","border":"#D2D1B8","sidebar":"#343522","sidebarPanel":"#45472E","sidebarText":"#FBFBEF","topbar":"#FEFDF8","authBackground":"#292A1B","authPanel":"#3A3B27"}},"amoled":{"name":"AMOLED · тёмная","short":"AMOLED","description":"Глубокий почти чёрный фон, минимальное свечение и яркие акцентные элементы.","badge":"НОВАЯ","tokens":{"fontFamily":"segoe","fontScale":1,"fontWeight":"strong","radius":12,"density":"compact","success":"#45D483","warning":"#F0C04E","danger":"#FF6464","mode":"dark","brand":"#FF3348","accent":"#7C5CFF","page":"#000000","surface":"#09090B","surfaceAlt":"#121216","text":"#FFFFFF","textMuted":"#B9BAC1","border":"#34343C","sidebar":"#000000","sidebarPanel":"#0B0B0E","sidebarText":"#FFFFFF","topbar":"#070709","authBackground":"#000000","authPanel":"#0A0A0D"}},"midnight-violet":{"name":"Полночь · фиолетовая","short":"Полночь","description":"Глубокий фиолетово-синий интерфейс с холодным акцентом и спокойным контрастом.","badge":"НОВАЯ","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":18,"density":"comfortable","success":"#56CF92","warning":"#E9B95B","danger":"#FF7078","mode":"dark","brand":"#9B7BFF","accent":"#4F7DFF","page":"#0B0914","surface":"#151225","surfaceAlt":"#1E1932","text":"#F8F6FF","textMuted":"#BBB5D2","border":"#4A4164","sidebar":"#080711","sidebarPanel":"#131021","sidebarText":"#FAF8FF","topbar":"#12101F","authBackground":"#07060E","authPanel":"#131020"}},"ember-dark":{"name":"Уголь · тёмная","short":"Уголь","description":"Тёплая графитовая тема с янтарно-красным акцентом для вечерней работы.","badge":"НОВАЯ","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":16,"density":"comfortable","success":"#59C88A","warning":"#F2B84B","danger":"#FF716A","mode":"dark","brand":"#E46F3D","accent":"#D13E4F","page":"#120D0B","surface":"#1D1613","surfaceAlt":"#291F1A","text":"#FFF7F2","textMuted":"#C6B4AA","border":"#5A4439","sidebar":"#0E0A08","sidebarPanel":"#1A1310","sidebarText":"#FFF8F3","topbar":"#1A1411","authBackground":"#0C0907","authPanel":"#1A1310"}},"arctic-dark":{"name":"Арктика · тёмная","short":"Арктика","description":"Холодная сине-серая палитра с ярким ледяным акцентом и высокой читаемостью.","badge":"НОВАЯ","tokens":{"fontFamily":"system","fontScale":1,"fontWeight":"balanced","radius":15,"density":"comfortable","success":"#52CD8B","warning":"#EAC05B","danger":"#FF6D72","mode":"dark","brand":"#56B9FF","accent":"#74E0D4","page":"#071018","surface":"#0F1B25","surfaceAlt":"#172632","text":"#F2FAFF","textMuted":"#AFC4D2","border":"#385466","sidebar":"#060D13","sidebarPanel":"#0E1A23","sidebarText":"#F3FBFF","topbar":"#0C1720","authBackground":"#050B10","authPanel":"#0E1922"}},"terminal-dark":{"name":"Терминал · тёмная","short":"Терминал","description":"Строгая чёрно-зелёная тема в стиле рабочего терминала без лишнего декора.","badge":"НОВАЯ","tokens":{"fontFamily":"segoe","fontScale":1,"fontWeight":"strong","radius":8,"density":"compact","success":"#48D27E","warning":"#E8C14F","danger":"#FF6868","mode":"dark","brand":"#38C976","accent":"#7E9B4F","page":"#050807","surface":"#0B100E","surfaceAlt":"#111915","text":"#F1FFF6","textMuted":"#A7C4B1","border":"#345041","sidebar":"#030504","sidebarPanel":"#0A0F0D","sidebarText":"#F4FFF8","topbar":"#080D0B","authBackground":"#020403","authPanel":"#090E0C"}},"chocolate-dark":{"name":"Шоколад · тёмная","short":"Шоколад","description":"Мягкая кофейно-шоколадная тема с кремовым текстом и тёплым акцентом.","badge":"НОВАЯ","tokens":{"fontFamily":"humanist","fontScale":1,"fontWeight":"balanced","radius":18,"density":"comfortable","success":"#5CC98B","warning":"#E7B856","danger":"#FF7770","mode":"dark","brand":"#D68A55","accent":"#A86A77","page":"#140E0B","surface":"#211713","surfaceAlt":"#2D201A","text":"#FFF8F2","textMuted":"#C9B8AD","border":"#5C473B","sidebar":"#100B09","sidebarPanel":"#1C1411","sidebarText":"#FFF8F3","topbar":"#1D1512","authBackground":"#0E0A08","authPanel":"#1C1411"}}};
const FIELDS = [["brand","Основной акцент","Кнопки, активные элементы и фокус"],["accent","Дополнительный акцент","Вторичные выделения и декор"],["page","Фон страницы","Общий фон рабочего пространства"],["surface","Основная поверхность","Карточки, окна и поля"],["surfaceAlt","Вторичная поверхность","Вложенные блоки и подложки"],["topbar","Верхняя панель","Фон шапки приложения"],["sidebar","Sidebar","Основной фон левого меню"],["sidebarPanel","Панель sidebar","Статус и вложенные блоки"],["authBackground","Фон авторизации","Внешний фон экрана входа"],["authPanel","Панель авторизации","Карточки экрана входа"],["text","Основной текст","Заголовки и рабочие значения"],["textMuted","Вторичный текст","Подсказки и подписи"],["border","Границы","Поля, карточки и разделители"],["sidebarText","Текст sidebar","Навигация левого меню"],["success","Успех","Положительные статусы"],["warning","Предупреждение","Требующие внимания состояния"],["danger","Ошибка","Ошибки и критические действия"]];
const COLOR_KEYS = FIELDS.map(([key]) => key);
const DEFAULT_PREFERENCES = { version: 2, presetId: 'magnit-warm', basePresetId: 'magnit-warm', custom: null };

let savedPreferences = null;
let workingPreferences = null;
let ready = false;
let lockedScrollY = 0;
let lockedScrollX = 0;
let themeTouchPoint = null;
let scrollLockSnapshot = null;
let lastFocus = null;
let dirty = false;
let themeModeFilter = 'light';
let themeSearchQuery = '';

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const escapeHtml = value => String(value ?? '').replace(/[&<>"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[char]));

function normalizeHex(value) {
  const raw = String(value || '').trim().replace('#', '');
  if (/^[0-9a-f]{3}$/i.test(raw)) return `#${raw.split('').map(char => char + char).join('').toLowerCase()}`;
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toLowerCase()}`;
  return null;
}
function rgb(value) {
  const color = normalizeHex(value) || '#000000';
  return { r: parseInt(color.slice(1,3),16), g: parseInt(color.slice(3,5),16), b: parseInt(color.slice(5,7),16) };
}
function toHex(color) {
  return '#' + [color.r,color.g,color.b].map(value => clamp(Math.round(value),0,255).toString(16).padStart(2,'0')).join('');
}
function mix(first, second, amount = .5) {
  const a = rgb(first); const b = rgb(second);
  return toHex({ r:a.r+(b.r-a.r)*amount, g:a.g+(b.g-a.g)*amount, b:a.b+(b.b-a.b)*amount });
}
function luminance(value) {
  const channels = [rgb(value).r,rgb(value).g,rgb(value).b].map(channel => {
    const normalized = channel / 255;
    return normalized <= .03928 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
  });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrastRatio(first, second) {
  const a = luminance(first); const b = luminance(second);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
function minContrast(color, backgrounds) { return Math.min(...backgrounds.map(background => contrastRatio(color, background))); }
function bestMonochrome(backgrounds) {
  const light = minContrast('#ffffff', backgrounds);
  const dark = minContrast('#0d1117', backgrounds);
  return light >= dark ? '#ffffff' : '#0d1117';
}
function ensureContrast(color, backgrounds, minimum = 4.5) {
  const source = normalizeHex(color) || '#0d1117';
  if (minContrast(source, backgrounds) >= minimum) return source;
  const target = bestMonochrome(backgrounds);
  if (minContrast(target, backgrounds) < minimum) return target;
  let low = 0; let high = 1;
  for (let index = 0; index < 18; index += 1) {
    const middle = (low + high) / 2;
    if (minContrast(mix(source, target, middle), backgrounds) >= minimum) high = middle;
    else low = middle;
  }
  return mix(source, target, high);
}
function harmonizeBackground(color, mode, role) {
  const source = normalizeHex(color) || (mode === 'dark' ? '#15181d' : '#f7f8fa');
  const lightness = luminance(source);
  if (mode === 'dark' && lightness > .28) {
    const strength = role === 'page' ? .78 : role === 'surfaceAlt' ? .66 : .72;
    return mix(source, '#080a0e', strength);
  }
  if (mode === 'light' && lightness < .58) {
    const strength = role === 'page' ? .76 : role === 'surfaceAlt' ? .70 : .74;
    return mix(source, '#ffffff', strength);
  }
  return source;
}
function convertMode(source, mode) {
  const tokens = clone(source);
  tokens.mode = mode;
  if (mode === 'dark') {
    tokens.page = mix(tokens.page, '#080a0e', .82);
    tokens.surface = mix(tokens.surface, '#12161d', .78);
    tokens.surfaceAlt = mix(tokens.surfaceAlt, '#1a2029', .72);
    tokens.topbar = mix(tokens.topbar, '#11151c', .78);
    tokens.sidebar = mix(tokens.sidebar, '#07090c', .76);
    tokens.sidebarPanel = mix(tokens.sidebarPanel, '#141920', .72);
    tokens.authBackground = mix(tokens.authBackground, '#06080b', .8);
    tokens.authPanel = mix(tokens.authPanel, '#12161d', .74);
    tokens.text = '#f5f7fb'; tokens.textMuted = '#bdc5d0'; tokens.sidebarText = '#f7f9fc'; tokens.border = '#48515e';
    tokens.success = '#4fd08b'; tokens.warning = '#efbd55'; tokens.danger = '#ff716d';
  } else {
    tokens.page = mix(tokens.page, '#f2f4f7', .78);
    tokens.surface = mix(tokens.surface, '#ffffff', .84);
    tokens.surfaceAlt = mix(tokens.surfaceAlt, '#f4f6f8', .76);
    tokens.topbar = mix(tokens.topbar, '#ffffff', .84);
    tokens.sidebar = mix(tokens.sidebar, '#202631', .24);
    tokens.sidebarPanel = mix(tokens.sidebarPanel, '#2b3340', .2);
    tokens.authBackground = mix(tokens.authBackground, '#161b23', .22);
    tokens.authPanel = mix(tokens.authPanel, '#222a35', .2);
    tokens.text = '#171b22'; tokens.textMuted = '#596371'; tokens.sidebarText = '#f7f9fc'; tokens.border = '#cbd2db';
    tokens.success = '#18724a'; tokens.warning = '#946300'; tokens.danger = '#bd3038';
  }
  return tokens;
}
function derive(source) {
  const fallback = PRESETS['magnit-warm'].tokens;
  const tokens = clone({ ...fallback, ...(source || {}) });
  tokens.mode = tokens.mode === 'dark' ? 'dark' : 'light';
  COLOR_KEYS.forEach(key => { tokens[key] = normalizeHex(tokens[key]) || fallback[key]; });
  ['page','surface','surfaceAlt','topbar'].forEach(key => {
    tokens[key] = harmonizeBackground(tokens[key], tokens.mode, key);
  });
  tokens.fontFamily = FONTS[tokens.fontFamily] ? tokens.fontFamily : 'system';
  tokens.fontScale = clamp(Number(tokens.fontScale) || 1, .95, 1.08);
  tokens.radius = clamp(Number(tokens.radius) || 15, 4, 24);
  tokens.fontWeight = ['comfortable','balanced','strong'].includes(tokens.fontWeight) ? tokens.fontWeight : 'balanced';
  tokens.density = ['compact','comfortable','spacious'].includes(tokens.density) ? tokens.density : 'comfortable';

  const workBackgrounds = [tokens.page,tokens.surface,tokens.surfaceAlt,tokens.topbar];
  tokens.text = ensureContrast(tokens.text, workBackgrounds, 4.5);
  tokens.textMuted = ensureContrast(tokens.textMuted, [tokens.surface,tokens.surfaceAlt,tokens.topbar], 4.5);
  tokens.sidebarText = ensureContrast(tokens.sidebarText, [tokens.sidebar,tokens.sidebarPanel], 4.5);
  tokens.authText = ensureContrast(tokens.text, [tokens.authPanel], 4.5);
  tokens.inputBackground = tokens.mode === 'dark' ? mix(tokens.surface, '#ffffff', .025) : mix(tokens.surface, '#000000', .012);
  tokens.inputText = ensureContrast(tokens.text, [tokens.inputBackground], 7);
  tokens.inputPlaceholder = ensureContrast(tokens.textMuted, [tokens.inputBackground], 4.5);
  tokens.onBrand = ensureContrast(bestMonochrome([tokens.brand]), [tokens.brand], 4.5);

  const dark = tokens.mode === 'dark';
  const brandSoft = mix(tokens.brand, tokens.surface, dark ? .74 : .86);
  const brandFaint = mix(tokens.brand, tokens.surface, dark ? .86 : .93);
  const successSoft = mix(tokens.success,tokens.surface,dark ? .74 : .87);
  const warningSoft = mix(tokens.warning,tokens.surface,dark ? .72 : .86);
  const dangerSoft = mix(tokens.danger,tokens.surface,dark ? .72 : .87);
  Object.assign(tokens, {
    brandHover: mix(tokens.brand, dark ? '#ffffff' : '#000000', dark ? .1 : .11),
    brandActive: mix(tokens.brand, '#000000', dark ? .08 : .2),
    brandSoft,
    brandFaint,
    brandText: ensureContrast(tokens.brand, [tokens.page,tokens.surface,tokens.surfaceAlt,tokens.topbar,brandSoft,brandFaint], 4.5),
    sidebarAccentText: ensureContrast(tokens.brand, [tokens.sidebar,tokens.sidebarPanel], 4.5),
    accentDeep: mix(tokens.accent, '#000000', dark ? .28 : .5),
    coral: mix(tokens.brand, '#ffffff', dark ? .23 : .18),
    textSecondary: ensureContrast(mix(tokens.text,tokens.textMuted,.54), [tokens.surface,tokens.surfaceAlt], 4.5),
    textFaint: ensureContrast(mix(tokens.textMuted,tokens.surface,dark ? .22 : .24), [tokens.page,tokens.surface,tokens.surfaceAlt,tokens.topbar], 4.5),
    borderStrong: mix(tokens.border,tokens.text,dark ? .22 : .15),
    surface3: mix(tokens.surfaceAlt,tokens.text,dark ? .08 : .055),
    surface4: mix(tokens.surfaceAlt,tokens.text,dark ? .14 : .1),
    successSoft,
    warningSoft,
    dangerSoft,
    successText: ensureContrast(tokens.success, [tokens.page,tokens.surface,tokens.surfaceAlt,successSoft], 4.5),
    warningText: ensureContrast(tokens.warning, [tokens.page,tokens.surface,tokens.surfaceAlt,warningSoft], 4.5),
    dangerText: ensureContrast(tokens.danger, [tokens.page,tokens.surface,tokens.surfaceAlt,dangerSoft], 4.5),
    onSuccess: ensureContrast(bestMonochrome([tokens.success]), [tokens.success], 4.5),
    onWarning: ensureContrast(bestMonochrome([tokens.warning]), [tokens.warning], 4.5),
    onDanger: ensureContrast(bestMonochrome([tokens.danger]), [tokens.danger], 4.5),
    authMuted: ensureContrast(tokens.textMuted, [tokens.authPanel,tokens.authBackground], 4.5),
    sidebarMuted: ensureContrast(mix(tokens.sidebarText,tokens.sidebar,.43), [tokens.sidebar,tokens.sidebarPanel,mix(tokens.sidebarPanel,tokens.sidebarText,.12)], 4.7),
    sidebarBorder: mix(tokens.sidebarText,tokens.sidebar,.82)
  });
  return tokens;
}
function legacyPreset() {
  for (const key of LEGACY_KEYS) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      const item = Array.isArray(parsed?.checklists) ? (parsed.checklists.find(entry => entry.id === parsed.activeChecklistId) || parsed.checklists[0]) : parsed;
      if (item?.ui?.theme === 'dark') return 'magnit-dark';
      if (item?.ui?.theme === 'light') return 'magnit-warm';
    } catch (_) {}
  }
  return 'magnit-warm';
}
function normalizePreferences(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const presetId = source.presetId === 'custom' || PRESETS[source.presetId] ? source.presetId : 'magnit-warm';
  return {
    ...DEFAULT_PREFERENCES,
    ...source,
    presetId,
    basePresetId: PRESETS[source.basePresetId] ? source.basePresetId : (PRESETS[presetId] ? presetId : 'magnit-warm'),
    custom: source.custom && typeof source.custom === 'object' ? source.custom : null
  };
}
function loadSavedPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored) return normalizePreferences(stored);
  } catch (error) { console.warn(error); }
  const presetId = legacyPreset();
  return { ...DEFAULT_PREFERENCES, presetId, basePresetId: presetId };
}
function persistSavedPreferences() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...savedPreferences, version: 2 })); return true; }
  catch (error) { console.warn(error); return false; }
}
function resolved(preferences = workingPreferences) {
  return preferences?.presetId === 'custom' && preferences.custom
    ? derive(preferences.custom)
    : derive((PRESETS[preferences?.presetId] || PRESETS['magnit-warm']).tokens);
}
function preferenceName(preferences = workingPreferences) {
  return preferences?.presetId === 'custom' ? 'Пользовательская' : (PRESETS[preferences?.presetId]?.name || PRESETS['magnit-warm'].name);
}
function isOpen() { const backdrop = document.getElementById('themeStudioBackdrop'); return Boolean(backdrop && !backdrop.hidden); }
function updateTrigger(tokens, preferences) {
  const button = document.getElementById('themeToggle'); if (!button) return;
  button.innerHTML = '<span aria-hidden="true">◈</span>';
  button.title = `Темы · ${preferenceName(preferences)}`;
  button.setAttribute('aria-label', `Открыть темы. Сейчас: ${preferenceName(preferences)}`);
  button.style.setProperty('--theme-trigger-color', tokens.brand);
}
function applyPreferences(preferences = workingPreferences) {
  const root = document.documentElement; const tokens = resolved(preferences);
  const weights = { comfortable:[600,760], balanced:[700,820], strong:[750,900] }[tokens.fontWeight];
  const density = { compact:.86, comfortable:1, spacious:1.12 }[tokens.density];
  const color = rgb(tokens.text); const shadowColor = `${color.r}, ${color.g}, ${color.b}`;
  const variables = {
    '--red':tokens.brand,'--accent':tokens.accent,'--red-hover':tokens.brandHover,'--red-active':tokens.brandActive,'--red-soft':tokens.brandSoft,'--red-faint':tokens.brandFaint,
    '--wine':tokens.accent,'--wine-deep':tokens.accentDeep,'--coral':tokens.coral,'--ink':tokens.text,'--ink-2':tokens.textSecondary,
    '--muted':tokens.textMuted,'--faint':tokens.textFaint,'--line':tokens.border,'--line-strong':tokens.borderStrong,'--page':tokens.page,
    '--surface':tokens.surface,'--surface-2':tokens.surfaceAlt,'--surface-3':tokens.surface3,'--surface-4':tokens.surface4,
    '--sidebar-bg':tokens.sidebar,'--sidebar-panel':tokens.sidebarPanel,'--sidebar-text':tokens.sidebarText,'--sidebar-muted':tokens.sidebarMuted,
    '--sidebar-border':tokens.sidebarBorder,'--topbar-bg':tokens.topbar,'--auth-bg':tokens.authBackground,'--auth-panel':tokens.authPanel,
    '--auth-text':tokens.authText,'--success':tokens.success,'--success-soft':tokens.successSoft,'--warning':tokens.warning,'--warning-soft':tokens.warningSoft,
    '--danger':tokens.danger,'--danger-soft':tokens.dangerSoft,'--red-text':tokens.brandText,'--sidebar-accent-text':tokens.sidebarAccentText,'--success-text':tokens.successText,
    '--warning-text':tokens.warningText,'--danger-text':tokens.dangerText,'--on-success':tokens.onSuccess,'--on-warning':tokens.onWarning,
    '--on-danger':tokens.onDanger,'--auth-muted':tokens.authMuted,'--on-brand':tokens.onBrand,'--input-bg':tokens.inputBackground,
    '--input-text':tokens.inputText,'--input-placeholder':tokens.inputPlaceholder,'--font-ui':FONTS[tokens.fontFamily],
    '--font-scale':String(tokens.fontScale),'--font-weight-base':String(weights[0]),'--font-weight-strong':String(weights[1]),
    '--density-scale':String(density),'--radius-xl':`${tokens.radius+5}px`,'--radius':`${tokens.radius}px`,
    '--radius-sm':`${Math.max(4,tokens.radius-4)}px`,'--shadow-xs':`0 1px 2px rgba(${shadowColor},${tokens.mode==='dark'?'.22':'.05'})`,
    '--shadow-sm':`0 10px 28px rgba(${shadowColor},${tokens.mode==='dark'?'.26':'.08'})`,
    '--shadow-md':`0 24px 64px rgba(${shadowColor},${tokens.mode==='dark'?'.46':'.15'})`
  };
  Object.entries(variables).forEach(([key,value]) => root.style.setProperty(key,value));
  root.dataset.theme = tokens.mode; root.dataset.themePreset = preferences?.presetId || 'magnit-warm'; root.dataset.themeBasePreset = preferences?.basePresetId || preferences?.presetId || 'magnit-warm'; root.style.colorScheme = tokens.mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',tokens.brand);
  updateTrigger(tokens,preferences);
  if (isOpen()) refreshChrome();
  window.dispatchEvent(new CustomEvent('magnit-theme-change',{detail:{preferences:clone(preferences),tokens:clone(tokens),saved:!dirty}}));
}
function ensureCustom() {
  if (workingPreferences.presetId === 'custom' && workingPreferences.custom) return;
  workingPreferences.basePresetId = PRESETS[workingPreferences.presetId] ? workingPreferences.presetId : (workingPreferences.basePresetId || 'magnit-warm');
  workingPreferences.custom = resolved(workingPreferences);
  workingPreferences.presetId = 'custom';
}
function setDirty(value = true) { dirty = value; refreshChrome(); }
function selectPreset(id) {
  if (!PRESETS[id]) return;
  themeModeFilter = PRESETS[id].tokens?.mode === 'dark' ? 'dark' : 'light';
  workingPreferences = { ...DEFAULT_PREFERENCES, presetId:id, basePresetId:id, custom:null };
  setDirty(JSON.stringify(workingPreferences) !== JSON.stringify(savedPreferences));
  applyPreferences(workingPreferences); render();
  status('Предпросмотр применён. Для постоянного использования нажмите «Сохранить тему».');
}
function updateToken(key,value) {
  ensureCustom();
  if (key === 'mode' && value !== workingPreferences.custom.mode) workingPreferences.custom = convertMode(workingPreferences.custom,value);
  else workingPreferences.custom[key] = value;
  setDirty(JSON.stringify(workingPreferences) !== JSON.stringify(savedPreferences));
  applyPreferences(workingPreferences);
}
function themeModeLabel(mode) { return mode === 'dark' ? 'Тёмная' : 'Светлая'; }
function themePresetEntries() {
  const query = themeSearchQuery.trim().toLocaleLowerCase('ru-RU');
  return Object.entries(PRESETS).filter(([id,preset]) => {
    if ((preset.tokens?.mode || 'light') !== themeModeFilter) return false;
    if (!query) return true;
    return `${id} ${preset.name} ${preset.short} ${preset.description}`.toLocaleLowerCase('ru-RU').includes(query);
  });
}
function themePresetCounts() {
  return Object.values(PRESETS).reduce((result,preset) => {
    const mode = preset.tokens?.mode === 'dark' ? 'dark' : 'light';
    result[mode] += 1;
    return result;
  }, { light:0, dark:0 });
}
function themePresetVisual(tokens) {
  return `<span class="theme-preset-visual" style="--theme-card-page:${tokens.page};--theme-card-surface:${tokens.surface};--theme-card-alt:${tokens.surfaceAlt};--theme-card-sidebar:${tokens.sidebar};--theme-card-topbar:${tokens.topbar};--theme-card-brand:${tokens.brand};--theme-card-border:${tokens.border};--theme-card-text:${tokens.text}"><span class="theme-preset-mini-sidebar"><i></i><i></i><i></i></span><span class="theme-preset-mini-workspace"><span class="theme-preset-mini-topbar"></span><span class="theme-preset-mini-content"><i></i><i></i><i></i></span></span></span>`;
}
function presetHtml() {
  const entries = themePresetEntries();
  if (!entries.length) return `<div class="theme-library-empty"><span>⌕</span><strong>Темы не найдены</strong><small>Измените запрос или переключите вкладку.</small></div>`;
  return entries.map(([id,preset]) => {
    const tokens = derive(preset.tokens); const active = workingPreferences.presetId === id;
    const exclusive = id === 'executive-milk';
    const badge = preset.badge || (exclusive ? 'ОФИЦИАЛЬНАЯ' : '');
    return `<button type="button" class="theme-preset-card ${active?'active':''} ${exclusive?'theme-preset-card-exclusive':''}" data-theme-preset="${id}" aria-pressed="${active}">
      ${themePresetVisual(tokens)}
      <span class="theme-preset-card-body">
        <span class="theme-preset-card-title"><strong>${escapeHtml(preset.short)}</strong><span class="theme-mode-badge ${tokens.mode}">${themeModeLabel(tokens.mode)}</span></span>
        <small>${escapeHtml(preset.description)}</small>
        <span class="theme-preset-swatches"><i style="--swatch:${tokens.brand}"></i><i style="--swatch:${tokens.page}"></i><i style="--swatch:${tokens.surface}"></i><i style="--swatch:${tokens.sidebar}"></i></span>
      </span>
      ${badge?`<em class="theme-preset-badge">${escapeHtml(badge)}</em>`:''}
      <span class="theme-preset-selected" aria-hidden="true">✓</span>
    </button>`;
  }).join('');
}
function renderPresetLibrary({ resetScroll = false } = {}) {
  const list = document.getElementById('themePresetList');
  const panel = document.getElementById('themePresetList');
  if (!list) return;
  list.innerHTML = presetHtml();
  const counts = themePresetCounts();
  const lightCount = document.getElementById('themeLightCount');
  const darkCount = document.getElementById('themeDarkCount');
  const visibleCount = document.getElementById('themeVisibleCount');
  if (lightCount) lightCount.textContent = counts.light;
  if (darkCount) darkCount.textContent = counts.dark;
  if (visibleCount) visibleCount.textContent = String(themePresetEntries().length);
  document.querySelectorAll('[data-theme-mode-filter]').forEach(button => {
    const active = button.dataset.themeModeFilter === themeModeFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const input = document.getElementById('themeSearch');
  if (input && input.value !== themeSearchQuery) input.value = themeSearchQuery;
  if (resetScroll && panel) panel.scrollTop = 0;
}
function themeSelectionHtml(tokens) {
  return `<section class="theme-selection-hero"><div class="theme-selection-copy"><span class="eyebrow">Текущий предпросмотр</span><h3 id="themeSelectionName">${escapeHtml(preferenceName(workingPreferences))}</h3><p id="themeSelectionMode">${themeModeLabel(tokens.mode)} тема · изменения применяются только после сохранения</p></div><div class="theme-selection-palette" aria-hidden="true"><i class="brand"></i><i class="page"></i><i class="surface"></i><i class="sidebar"></i></div></section>`;
}
function colorHtml(key,label,hint,value) {
  return `<label class="theme-color-field"><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(hint)}</small></span><span class="theme-color-inputs"><input type="color" value="${value}" data-theme-color="${key}" aria-label="${escapeHtml(label)}"><input class="theme-hex-input" type="text" value="${value.toUpperCase()}" maxlength="7" data-theme-hex="${key}" aria-label="HEX: ${escapeHtml(label)}"></span></label>`;
}
function contrastReport(tokens) {
  const checks = [
    ['Текст / страница',tokens.text,tokens.page],['Текст / карточка',tokens.text,tokens.surface],['Подпись / карточка',tokens.textMuted,tokens.surface],
    ['Поле ввода',tokens.inputText,tokens.inputBackground],['Подсказка поля',tokens.inputPlaceholder,tokens.inputBackground],
    ['Sidebar',tokens.sidebarText,tokens.sidebar],['Кнопка',tokens.onBrand,tokens.brand]
  ].map(([label,foreground,background]) => ({label,value:contrastRatio(foreground,background)}));
  const risks = checks.filter(item => item.value < 4.5);
  const statusColors = [tokens.success, tokens.warning, tokens.danger].map(rgb);
  const statusDistances = [
    Math.hypot(statusColors[0].r-statusColors[1].r, statusColors[0].g-statusColors[1].g, statusColors[0].b-statusColors[1].b),
    Math.hypot(statusColors[0].r-statusColors[2].r, statusColors[0].g-statusColors[2].g, statusColors[0].b-statusColors[2].b),
    Math.hypot(statusColors[1].r-statusColors[2].r, statusColors[1].g-statusColors[2].g, statusColors[1].b-statusColors[2].b),
  ];
  if (Math.min(...statusDistances) < 64) risks.push({label:'Цвета статусов слишком похожи'});
  return {checks,risks};
}
function contrastHtml(tokens) {
  const report = contrastReport(tokens); const minimum = Math.min(...report.checks.map(item => item.value));
  return `<div class="theme-contrast ${report.risks.length?'warning':'good'}" id="themeContrastPanel"><div><span class="theme-contrast-dot"></span><strong>${report.risks.length?'Нужно поправить: '+report.risks.length:(minimum>=7?'Отличная читаемость':'Контраст в норме')}</strong><small>Минимальный коэффициент: ${minimum.toFixed(2)}:1</small></div><div class="theme-contrast-list">${report.checks.map(item => `<span class="${item.value>=4.5?'pass':'fail'}">${escapeHtml(item.label)} <b>${item.value.toFixed(2)}:1</b></span>`).join('')}</div><p>${report.risks.length?escapeHtml(report.risks.map(item=>item.label).join(' · ')):'Текст, поля ввода и навигация автоматически удерживают безопасный контраст.'}</p></div>`;
}
function previewHtml() {
  return `<div class="theme-preview"><div class="theme-preview-sidebar"><span class="theme-preview-logo">М</span><i></i><i></i><i></i><i></i></div><div class="theme-preview-main"><div class="theme-preview-top"><strong>Предпросмотр</strong><span></span></div><div class="theme-preview-content"><div class="theme-preview-card"><small>Поле ввода</small><strong>Читаемый заголовок</strong><input class="theme-preview-input" value="Текст хорошо виден" readonly tabindex="-1"><p>Цвет текста и курсора автоматически адаптируется к поверхности.</p><button type="button" tabindex="-1">Основное действие</button></div><div class="theme-preview-states"><i class="success"></i><i class="warning"></i><i class="danger"></i></div></div></div></div>`;
}
function captureThemeScrollState() {
  const presetList = document.getElementById('themePresetList');
  const controls = document.getElementById('themeStudioControls');
  return {
    presetTop: presetList?.scrollTop || 0,
    presetLeft: presetList?.scrollLeft || 0,
    controlsTop: controls?.scrollTop || 0,
    controlsLeft: controls?.scrollLeft || 0
  };
}
function restoreThemeScrollState(state) {
  if (!state) return;
  const restore = () => {
    const presetList = document.getElementById('themePresetList');
    const controls = document.getElementById('themeStudioControls');
    if (presetList) { presetList.scrollTop = state.presetTop; presetList.scrollLeft = state.presetLeft; }
    if (controls) { controls.scrollTop = state.controlsTop; controls.scrollLeft = state.controlsLeft; }
  };
  restore();
  requestAnimationFrame(restore);
}
function render(options = {}) {
  const { resetScroll = false } = options;
  const scrollState = resetScroll ? null : captureThemeScrollState();
  const list = document.getElementById('themePresetList'); const controls = document.getElementById('themeStudioControls');
  if (!list || !controls) return;
  const tokens = resolved(workingPreferences);
  renderPresetLibrary();
  document.getElementById('themeCurrentLabel').textContent = preferenceName(workingPreferences);
  controls.innerHTML = `${themeSelectionHtml(tokens)}${previewHtml()}${contrastHtml(tokens)}<section class="theme-settings-section"><div class="theme-settings-heading"><div><span>Палитра</span><h3>Настройка каждого участка</h3></div><small>Это только предпросмотр. Постоянная тема изменится исключительно после нажатия «Сохранить тему».</small></div><div class="theme-color-grid">${FIELDS.map(([key,label,hint])=>colorHtml(key,label,hint,tokens[key])).join('')}</div></section><section class="theme-settings-section"><div class="theme-settings-heading"><div><span>Типографика</span><h3>Шрифт, плотность и геометрия</h3></div><small>Системные шрифты и автоматическая защита контраста во всех полях.</small></div><div class="theme-typography-grid"><label class="theme-setting-field"><span><strong>Шрифтовой стек</strong><small>Единый для всех элементов</small></span><select data-theme-setting="fontFamily"><option value="system" ${tokens.fontFamily==='system'?'selected':''}>Системный</option><option value="segoe" ${tokens.fontFamily==='segoe'?'selected':''}>Segoe UI</option><option value="arial" ${tokens.fontFamily==='arial'?'selected':''}>Arial</option><option value="humanist" ${tokens.fontFamily==='humanist'?'selected':''}>Humanist</option></select></label><label class="theme-setting-field"><span><strong>Насыщенность</strong><small>Без смешения случайных начертаний</small></span><select data-theme-setting="fontWeight"><option value="comfortable" ${tokens.fontWeight==='comfortable'?'selected':''}>Спокойная</option><option value="balanced" ${tokens.fontWeight==='balanced'?'selected':''}>Сбалансированная</option><option value="strong" ${tokens.fontWeight==='strong'?'selected':''}>Выраженная</option></select></label><label class="theme-setting-field"><span><strong>Плотность</strong><small>Высота элементов управления</small></span><select data-theme-setting="density"><option value="compact" ${tokens.density==='compact'?'selected':''}>Компактная</option><option value="comfortable" ${tokens.density==='comfortable'?'selected':''}>Комфортная</option><option value="spacious" ${tokens.density==='spacious'?'selected':''}>Просторная</option></select></label><label class="theme-setting-field"><span><strong>Цветовая основа</strong><small>Перестраивает поверхности и текст вместе</small></span><select data-theme-setting="mode"><option value="light" ${tokens.mode==='light'?'selected':''}>Светлая</option><option value="dark" ${tokens.mode==='dark'?'selected':''}>Тёмная</option></select></label><label class="theme-range-field"><span><strong>Масштаб текста</strong><small id="themeFontScaleValue">${Math.round(tokens.fontScale*100)}%</small></span><input type="range" min="95" max="108" value="${Math.round(tokens.fontScale*100)}" data-theme-range="fontScale"></label><label class="theme-range-field"><span><strong>Скругление</strong><small id="themeRadiusValue">${tokens.radius}px</small></span><input type="range" min="4" max="24" value="${tokens.radius}" data-theme-range="radius"></label></div></section>`;
  refreshChrome();
  restoreThemeScrollState(scrollState);
}
function refreshChrome() {
  const label = document.getElementById('themeCurrentLabel'); if (label) label.textContent = preferenceName(workingPreferences);
  const selectionName = document.getElementById('themeSelectionName'); if (selectionName) selectionName.textContent = preferenceName(workingPreferences);
  const selectionMode = document.getElementById('themeSelectionMode'); if (selectionMode) selectionMode.textContent = `${themeModeLabel(resolved(workingPreferences).mode)} тема · изменения применяются только после сохранения`;
  document.querySelectorAll('[data-theme-preset]').forEach(button => {
    const active = workingPreferences.presetId === button.dataset.themePreset;
    button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active));
  });
  const oldPanel = document.getElementById('themeContrastPanel'); if (oldPanel) oldPanel.outerHTML = contrastHtml(resolved(workingPreferences));
  const saveButton = document.getElementById('themeStudioSave');
  if (saveButton) { saveButton.disabled = !dirty; saveButton.textContent = dirty ? 'Сохранить тему' : 'Тема сохранена'; }
  const statusElement = document.getElementById('themeStudioStatus');
  if (statusElement && !statusElement.classList.contains('show')) statusElement.textContent = dirty ? 'Предпросмотр не сохранён' : 'Сохранённая тема активна';
}
function status(message) {
  const element = document.getElementById('themeStudioStatus'); if (!element) return;
  element.textContent = message; element.classList.add('show'); clearTimeout(status.timer);
  status.timer = setTimeout(() => { element.classList.remove('show'); refreshChrome(); },2800);
}

function getThemeScrollContainer(target) {
  const backdrop = document.getElementById('themeStudioBackdrop');
  let node = target instanceof Element ? target : null;
  while (node && node !== backdrop) {
    const style = getComputedStyle(node);
    const canScrollY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1;
    const canScrollX = /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1;
    if (canScrollY || canScrollX) return { node, canScrollY, canScrollX };
    node = node.parentElement;
  }
  return null;
}
function routeThemeWheel(event) {
  if (!isOpen()) return;
  if (event.target instanceof Element && event.target.closest('select, input[type="color"], input[type="range"]')) return;
  event.preventDefault();
  const scrollable = getThemeScrollContainer(event.target);
  if (!scrollable) return;
  const { node, canScrollY, canScrollX } = scrollable;
  const horizontalPreset = node.classList.contains('theme-preset-panel') && window.innerWidth <= 820;
  if (horizontalPreset && canScrollX) node.scrollLeft += event.deltaX || event.deltaY;
  else {
    if (canScrollY) node.scrollTop += event.deltaY;
    if (canScrollX && event.deltaX) node.scrollLeft += event.deltaX;
  }
}
function rememberThemeTouch(event) {
  if (!isOpen() || !event.touches?.length) return;
  themeTouchPoint = { x:event.touches[0].clientX, y:event.touches[0].clientY, target:event.target };
}
function routeThemeTouch(event) {
  if (!isOpen() || !themeTouchPoint || !event.touches?.length) return;
  event.preventDefault();
  const current = { x:event.touches[0].clientX, y:event.touches[0].clientY };
  const deltaX = themeTouchPoint.x - current.x;
  const deltaY = themeTouchPoint.y - current.y;
  const scrollable = getThemeScrollContainer(themeTouchPoint.target || event.target);
  if (scrollable) {
    const { node, canScrollY, canScrollX } = scrollable;
    const horizontalPreset = node.classList.contains('theme-preset-panel') && window.innerWidth <= 820;
    if (horizontalPreset && canScrollX) node.scrollLeft += Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    else {
      if (canScrollY) node.scrollTop += deltaY;
      if (canScrollX && Math.abs(deltaX) > Math.abs(deltaY)) node.scrollLeft += deltaX;
    }
  }
  themeTouchPoint = { x:current.x, y:current.y, target:themeTouchPoint.target };
}
function clearThemeTouch() { themeTouchPoint = null; }
function rememberStyleProperty(element, property) {
  return { value:element.style.getPropertyValue(property), priority:element.style.getPropertyPriority(property) };
}
function restoreStyleProperty(element, property, snapshot) {
  if (!snapshot?.value) element.style.removeProperty(property);
  else element.style.setProperty(property, snapshot.value, snapshot.priority || '');
}
function lockPageScroll() {
  const root = document.documentElement; const body = document.body;
  lockedScrollX = window.scrollX || root.scrollLeft || 0;
  lockedScrollY = window.scrollY || root.scrollTop || 0;
  const rootProps = ['overflow','height','overscroll-behavior'];
  const bodyProps = ['position','top','left','right','width','height','overflow','overscroll-behavior','padding-right'];
  scrollLockSnapshot = {
    root:Object.fromEntries(rootProps.map(key => [key,rememberStyleProperty(root,key)])),
    body:Object.fromEntries(bodyProps.map(key => [key,rememberStyleProperty(body,key)]))
  };
  const scrollbarGap = Math.max(0, window.innerWidth - root.clientWidth);
  root.style.setProperty('overflow','hidden','important');
  root.style.setProperty('height','100%','important');
  root.style.setProperty('overscroll-behavior','none','important');
  body.style.setProperty('position','fixed','important');
  body.style.setProperty('top',`-${lockedScrollY}px`,'important');
  body.style.setProperty('left',`-${lockedScrollX}px`,'important');
  body.style.setProperty('right','0','important');
  body.style.setProperty('width','100%','important');
  body.style.setProperty('height','100%','important');
  body.style.setProperty('overflow','hidden','important');
  body.style.setProperty('overscroll-behavior','none','important');
  if (scrollbarGap) body.style.setProperty('padding-right',`${scrollbarGap}px`,'important');
}
function unlockPageScroll() {
  const root = document.documentElement; const body = document.body;
  if (scrollLockSnapshot) {
    Object.entries(scrollLockSnapshot.root).forEach(([key,value]) => restoreStyleProperty(root,key,value));
    Object.entries(scrollLockSnapshot.body).forEach(([key,value]) => restoreStyleProperty(body,key,value));
  }
  scrollLockSnapshot = null;
  window.scrollTo(lockedScrollX, lockedScrollY);
}
function guardThemeViewport() {
  if (!isOpen()) return;
  if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0,0);
}

function open() {
  const backdrop = document.getElementById('themeStudioBackdrop'); if (!backdrop || !backdrop.hidden) return;
  lastFocus = document.activeElement; workingPreferences = clone(savedPreferences); dirty = false;
  themeModeFilter = resolved(workingPreferences).mode; themeSearchQuery = '';
  applyPreferences(workingPreferences); render({ resetScroll:true });
  lockPageScroll();
  backdrop.hidden = false; document.documentElement.classList.add('theme-studio-open'); document.body.classList.add('theme-studio-open');
  requestAnimationFrame(() => document.getElementById('themeStudioClose')?.focus({ preventScroll: true }));
}
function close() {
  const backdrop = document.getElementById('themeStudioBackdrop'); if (!backdrop || backdrop.hidden) return;
  if (dirty) { workingPreferences = clone(savedPreferences); dirty = false; applyPreferences(workingPreferences); }
  backdrop.hidden = true; document.documentElement.classList.remove('theme-studio-open'); document.body.classList.remove('theme-studio-open'); themeTouchPoint = null;
  unlockPageScroll(); lastFocus?.focus?.({ preventScroll: true });
}
function saveTheme() {
  savedPreferences = normalizePreferences(clone(workingPreferences));
  workingPreferences = clone(savedPreferences);
  const success = persistSavedPreferences(); dirty = false; applyPreferences(workingPreferences); refreshChrome();
  status(success ? 'Тема сохранена в браузере.' : 'Не удалось сохранить тему в браузере.');
}
function resetToBase() { selectPreset(workingPreferences.basePresetId || 'magnit-warm'); }
function downloadTheme() {
  const blob = new Blob([JSON.stringify({app:'magnit-dp',type:'theme-preferences',exportedAt:new Date().toISOString(),preferences:clone(workingPreferences),resolvedTheme:resolved(workingPreferences)},null,2)],{type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `magnit-theme-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); status('Файл текущего предпросмотра экспортирован.');
}
async function importTheme(file) {
  try {
    const parsed = JSON.parse(await file.text()); const source = parsed.preferences || parsed;
    if (source.presetId && source.presetId !== 'custom' && PRESETS[source.presetId]) workingPreferences = {...DEFAULT_PREFERENCES,presetId:source.presetId,basePresetId:source.presetId,custom:null};
    else {
      const custom = source.custom || parsed.resolvedTheme || source.tokens;
      if (!custom || typeof custom !== 'object') throw new Error('Invalid theme');
      workingPreferences = {...DEFAULT_PREFERENCES,presetId:'custom',basePresetId:PRESETS[source.basePresetId]?source.basePresetId:'magnit-warm',custom:derive(custom)};
    }
    themeModeFilter = resolved(workingPreferences).mode;
    dirty = JSON.stringify(workingPreferences) !== JSON.stringify(savedPreferences); applyPreferences(workingPreferences); render();
    status('Тема импортирована в предпросмотр. Нажмите «Сохранить тему», чтобы оставить её.');
  } catch (error) { console.error(error); status('Не удалось импортировать файл темы.'); }
}
function bind() {
  document.getElementById('themeToggle')?.addEventListener('click',open);
  document.getElementById('themeStudioClose')?.addEventListener('click',close);
  const backdrop = document.getElementById('themeStudioBackdrop');
  document.addEventListener('wheel', routeThemeWheel, { capture: true, passive: false });
  document.addEventListener('touchstart', rememberThemeTouch, { capture: true, passive: true });
  document.addEventListener('touchmove', routeThemeTouch, { capture: true, passive: false });
  document.addEventListener('touchend', clearThemeTouch, { capture: true, passive: true });
  document.addEventListener('touchcancel', clearThemeTouch, { capture: true, passive: true });
  window.addEventListener('scroll', guardThemeViewport, { capture: true, passive: true });
  backdrop?.addEventListener('click', event => {
    if (event.target === backdrop) close();
  });
  document.getElementById('themePresetList')?.addEventListener('click', event => {
    const preset = event.target.closest('[data-theme-preset]');
    if (preset) selectPreset(preset.dataset.themePreset);
  });
  document.querySelector('.theme-mode-tabs')?.addEventListener('click', event => {
    const button = event.target.closest('[data-theme-mode-filter]');
    if (!button) return;
    themeModeFilter = button.dataset.themeModeFilter === 'dark' ? 'dark' : 'light';
    renderPresetLibrary({ resetScroll:true });
  });
  document.getElementById('themeSearch')?.addEventListener('input', event => {
    themeSearchQuery = event.target.value || '';
    renderPresetLibrary({ resetScroll:true });
  });
  document.getElementById('themeStudioReset')?.addEventListener('click',resetToBase);
  document.getElementById('themeStudioSave')?.addEventListener('click',saveTheme);
  document.getElementById('themeStudioExport')?.addEventListener('click',downloadTheme);
  document.getElementById('themeStudioImportButton')?.addEventListener('click',()=>document.getElementById('themeStudioImport')?.click());
  document.getElementById('themeStudioImport')?.addEventListener('change',event=>{const file=event.target.files?.[0];if(file)importTheme(file);event.target.value='';});
  backdrop?.addEventListener('input',event=>{
    const colorKey=event.target.dataset.themeColor;
    if(colorKey){const value=normalizeHex(event.target.value);if(value){const hexInput=document.querySelector(`[data-theme-hex="${colorKey}"]`);if(hexInput)hexInput.value=value.toUpperCase();updateToken(colorKey,value);}return;}
    const hexKey=event.target.dataset.themeHex;
    if(hexKey){const value=normalizeHex(event.target.value);if(value){const colorInput=document.querySelector(`[data-theme-color="${hexKey}"]`);if(colorInput)colorInput.value=value;updateToken(hexKey,value);}return;}
    const rangeKey=event.target.dataset.themeRange;
    if(rangeKey==='fontScale'){const value=clamp(Number(event.target.value)/100,.95,1.08);document.getElementById('themeFontScaleValue').textContent=Math.round(value*100)+'%';updateToken(rangeKey,value);}
    if(rangeKey==='radius'){const value=clamp(Number(event.target.value),4,24);document.getElementById('themeRadiusValue').textContent=value+'px';updateToken(rangeKey,value);}
  });
  backdrop?.addEventListener('change',event=>{
    const key=event.target.dataset.themeSetting;if(key){updateToken(key,event.target.value);if(key==='mode'){themeModeFilter=event.target.value==='dark'?'dark':'light';render();}}
    const hexKey=event.target.dataset.themeHex;if(hexKey&&!normalizeHex(event.target.value)){event.target.value=resolved(workingPreferences)[hexKey].toUpperCase();status('Введите цвет в формате #RRGGBB.');}
  });
  document.addEventListener('keydown',event=>{
    if(!isOpen()) return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();document.getElementById('themeSearch')?.focus();document.getElementById('themeSearch')?.select();return;}
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
  },true);
}
function init() {
  if (ready) return;
  savedPreferences = loadSavedPreferences(); workingPreferences = clone(savedPreferences); ready = true;
  applyPreferences(workingPreferences); bind();
}

window.ThemeStudio = {
  init,open,close,isOpen,selectPreset,
  applyCurrent:()=>applyPreferences(workingPreferences),
  getPreferences:()=>clone(savedPreferences),
  getResolvedTheme:()=>clone(resolved(workingPreferences)),
  presets:clone(PRESETS)
};
init();
})();
