const n=JSON.parse('{"key":"v-6f0a28ec","path":"/spring/01-spring%E5%AE%B9%E5%99%A8%E7%9A%84%E5%88%9B%E5%BB%BA.html","title":"Spring源码系列（一）——容器的创建","lang":"en-US","frontmatter":{"title":"Spring源码系列（一）——容器的创建","icon":"page","order":1,"author":"luoliang","date":"2023-01-28T00:00:00.000Z","category":["spring"],"tag":["源码"],"sticky":true,"star":true,"footer":false,"copyright":"No Copyright","editLink":false,"comment":false,"description":"内容大纲 容器的创建 读取器的创建 扫描器的创建 小结 补充说明 BeanPostProcessor Spring中容器的属性说明 一、容器的创建 下面我们从容器的创建开始，逐步探索Spring的源码 函数的入口 public static void main(String[] args) { // 创建容器 AnnotationConfigApplicationContext annotationConfigApplicationContext = new AnnotationConfigApplicationContext(AppConfig.class); // 从容器中获取Bean IndexDao dao = annotationConfigApplicationContext.getBean(IndexDao.class); // 调用Bean的方法 dao.query(); }","head":[["meta",{"property":"og:url","content":"https://mister-hope.github.io/spring/01-spring%E5%AE%B9%E5%99%A8%E7%9A%84%E5%88%9B%E5%BB%BA.html"}],["meta",{"property":"og:site_name","content":"luoliang"}],["meta",{"property":"og:title","content":"Spring源码系列（一）——容器的创建"}],["meta",{"property":"og:description","content":"内容大纲 容器的创建 读取器的创建 扫描器的创建 小结 补充说明 BeanPostProcessor Spring中容器的属性说明 一、容器的创建 下面我们从容器的创建开始，逐步探索Spring的源码 函数的入口 public static void main(String[] args) { // 创建容器 AnnotationConfigApplicationContext annotationConfigApplicationContext = new AnnotationConfigApplicationContext(AppConfig.class); // 从容器中获取Bean IndexDao dao = annotationConfigApplicationContext.getBean(IndexDao.class); // 调用Bean的方法 dao.query(); }"}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:updated_time","content":"2023-02-04T14:29:49.000Z"}],["meta",{"property":"og:locale","content":"en-US"}],["meta",{"property":"article:author","content":"luoliang"}],["meta",{"property":"article:tag","content":"源码"}],["meta",{"property":"article:published_time","content":"2023-01-28T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2023-02-04T14:29:49.000Z"}]]},"headers":[{"level":2,"title":"内容大纲","slug":"内容大纲","link":"#内容大纲","children":[]},{"level":2,"title":"一、容器的创建","slug":"一、容器的创建","link":"#一、容器的创建","children":[]},{"level":2,"title":"二、读取器的创建","slug":"二、读取器的创建","link":"#二、读取器的创建","children":[]},{"level":2,"title":"三、扫描器的创建","slug":"三、扫描器的创建","link":"#三、扫描器的创建","children":[]},{"level":2,"title":"四、小结","slug":"四、小结","link":"#四、小结","children":[]},{"level":2,"title":"五、补充说明","slug":"五、补充说明","link":"#五、补充说明","children":[]}],"git":{"createdTime":1674865034000,"updatedTime":1675520989000,"contributors":[{"name":"weiluoliang","email":"wll000000","commits":2}]},"readingTime":{"minutes":1.48,"words":445},"filePathRelative":"spring/01-spring容器的创建.md","localizedDate":"January 28, 2023","excerpt":"<h2> 内容大纲</h2>\\n<ol>\\n<li>容器的创建</li>\\n<li>读取器的创建</li>\\n<li>扫描器的创建</li>\\n<li>小结</li>\\n<li>补充说明\\n<ol>\\n<li>BeanPostProcessor</li>\\n<li>Spring中容器的属性说明</li>\\n</ol>\\n</li>\\n</ol>\\n<h2> 一、容器的创建</h2>\\n<p>下面我们从容器的创建开始，逐步探索Spring的源码<br>\\n函数的入口</p>\\n<div class=\\"language-java line-numbers-mode\\" data-ext=\\"java\\"><pre class=\\"language-java\\"><code> <span class=\\"token keyword\\">public</span> <span class=\\"token keyword\\">static</span> <span class=\\"token keyword\\">void</span> <span class=\\"token function\\">main</span><span class=\\"token punctuation\\">(</span><span class=\\"token class-name\\">String</span><span class=\\"token punctuation\\">[</span><span class=\\"token punctuation\\">]</span> args<span class=\\"token punctuation\\">)</span> <span class=\\"token punctuation\\">{</span>\\n    <span class=\\"token comment\\">// 创建容器</span>\\n    <span class=\\"token class-name\\">AnnotationConfigApplicationContext</span> annotationConfigApplicationContext <span class=\\"token operator\\">=</span> <span class=\\"token keyword\\">new</span> <span class=\\"token class-name\\">AnnotationConfigApplicationContext</span><span class=\\"token punctuation\\">(</span><span class=\\"token class-name\\">AppConfig</span><span class=\\"token punctuation\\">.</span><span class=\\"token keyword\\">class</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n\\n    <span class=\\"token comment\\">// 从容器中获取Bean</span>\\n    <span class=\\"token class-name\\">IndexDao</span> dao <span class=\\"token operator\\">=</span> annotationConfigApplicationContext<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">getBean</span><span class=\\"token punctuation\\">(</span><span class=\\"token class-name\\">IndexDao</span><span class=\\"token punctuation\\">.</span><span class=\\"token keyword\\">class</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n\\n    <span class=\\"token comment\\">// 调用Bean的方法</span>\\n    dao<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">query</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n<span class=\\"token punctuation\\">}</span>\\n</code></pre><div class=\\"line-numbers\\" aria-hidden=\\"true\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}');export{n as data};
